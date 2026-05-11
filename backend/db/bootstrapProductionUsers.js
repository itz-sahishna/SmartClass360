/**
 * Idempotent production bootstrap: default admin / teacher / student accounts
 * plus minimal department → academic_year → section graph required by FKs.
 *
 * Safe to run on every server start (Render): skips existing users by email.
 * Set SKIP_DEFAULT_USER_SEED=true to disable.
 */
const bcrypt = require("bcrypt");
const { withTransaction } = require("../src/db");

const IDS = {
  department: "dept-sc360-bootstrap",
  academicYear: "year-sc360-bootstrap",
  section: "sec-sc360-bootstrap",
  adminUser: "user-sc360-admin",
  teacherUser: "user-sc360-teacher",
  studentUser: "user-sc360-student",
  adminRow: "admin-sc360-bootstrap",
  teacherRow: "teacher-sc360-bootstrap",
  studentRow: "student-sc360-bootstrap",
};

const DEFAULT_ACCOUNTS = [
  {
    userId: IDS.adminUser,
    roleRowId: IDS.adminRow,
    email: "admin@smartclass.com",
    password: "Admin123",
    role: "admin",
    name: "System Administrator",
  },
  {
    userId: IDS.teacherUser,
    roleRowId: IDS.teacherRow,
    email: "teacher@smartclass.com",
    password: "Teacher123",
    role: "teacher",
    name: "Default Teacher",
  },
  {
    userId: IDS.studentUser,
    roleRowId: IDS.studentRow,
    email: "student@smartclass.com",
    password: "Student123",
    role: "student",
    name: "Default Student",
  },
];

const STUDENT_ROLL_NUMBER = "SC360-SEED-STUDENT-001";

async function tableExists(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'users'
     ) AS ok`
  );
  return Boolean(rows[0]?.ok);
}

async function ensureMinimalOrgGraph(client) {
  await client.query(
    `INSERT INTO departments (id, name)
     VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [IDS.department, "SmartClass 360 — bootstrap (internal)"]
  );

  await client.query(
    `INSERT INTO academic_years (id, department_id, year_number, academic_year)
     VALUES ($1, $2, 1, '2025-26')
     ON CONFLICT (department_id, year_number, academic_year) DO NOTHING`,
    [IDS.academicYear, IDS.department]
  );

  await client.query(
    `INSERT INTO sections (id, year_id, class_name, name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (year_id, class_name, name) DO NOTHING`,
    [IDS.section, IDS.academicYear, "Bootstrap", "A"]
  );
}

/**
 * Insert user if missing (by email). Never overwrites password for existing users.
 * @returns {{ id: string, created: boolean, role: string }}
 */
async function upsertUserByEmail(client, { userId, name, email, passwordHash, role }) {
  const inserted = await client.query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, is_blocked, profile)
     VALUES ($1, $2, $3, NULL, $4, $5, FALSE, '{}'::jsonb)
     ON CONFLICT (email) DO NOTHING
     RETURNING id, role`,
    [userId, name, email, passwordHash, role]
  );

  if (inserted.rows.length) {
    return { id: inserted.rows[0].id, created: true, role: inserted.rows[0].role };
  }

  const existing = await client.query(`SELECT id, role FROM users WHERE email = $1`, [email]);
  if (!existing.rows.length) {
    throw new Error(`Expected user row for ${email} after conflict`);
  }
  return { id: existing.rows[0].id, created: false, role: existing.rows[0].role };
}

async function ensureAdminProfile(client, { userId, roleRowId, expectedRole, email }) {
  if (expectedRole !== "admin") return;
  const u = await client.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (u.rows[0]?.role !== "admin") {
    console.warn(
      `[bootstrap] User ${email} exists with role "${u.rows[0]?.role}"; skipping admins row`
    );
    return;
  }
  await client.query(
    `INSERT INTO admins (id, user_id) VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [roleRowId, userId]
  );
}

async function ensureTeacherProfile(client, { userId, roleRowId, expectedRole, email }) {
  if (expectedRole !== "teacher") return;
  const u = await client.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (u.rows[0]?.role !== "teacher") {
    console.warn(
      `[bootstrap] User ${email} exists with role "${u.rows[0]?.role}"; skipping teachers row`
    );
    return;
  }
  await client.query(
    `INSERT INTO teachers (id, user_id, department_id, designation)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO NOTHING`,
    [roleRowId, userId, IDS.department, "Faculty"]
  );
}

async function ensureStudentProfile(client, { userId, roleRowId, expectedRole, email }) {
  if (expectedRole !== "student") return;
  const u = await client.query(`SELECT role FROM users WHERE id = $1`, [userId]);
  if (u.rows[0]?.role !== "student") {
    console.warn(
      `[bootstrap] User ${email} exists with role "${u.rows[0]?.role}"; skipping students row`
    );
    return;
  }
  await client.query(
    `INSERT INTO students (id, user_id, roll_number, section_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO NOTHING`,
    [roleRowId, userId, STUDENT_ROLL_NUMBER, IDS.section]
  );
}

async function ensureProductionDefaultUsers() {
  if (process.env.SKIP_DEFAULT_USER_SEED === "true") {
    console.log("[bootstrap] SKIP_DEFAULT_USER_SEED=true — skipping default user seed");
    return;
  }

  const passwordHashes = {};
  for (const acc of DEFAULT_ACCOUNTS) {
    passwordHashes[acc.email] = await bcrypt.hash(acc.password, 10);
  }

  await withTransaction(async (client) => {
    if (!(await tableExists(client))) {
      console.error(
        '[bootstrap] Table "users" not found. Apply `backend/db/schema.sql` to Postgres before seeding.'
      );
      return;
    }

    await ensureMinimalOrgGraph(client);

    for (const acc of DEFAULT_ACCOUNTS) {
      const { id, created, role } = await upsertUserByEmail(client, {
        userId: acc.userId,
        name: acc.name,
        email: acc.email,
        passwordHash: passwordHashes[acc.email],
        role: acc.role,
      });

      if (!created && role !== acc.role) {
        console.warn(
          `[bootstrap] ${acc.email} already exists with role "${role}" (expected "${acc.role}"). Skipping role-specific rows.`
        );
        continue;
      }

      if (acc.role === "admin") {
        await ensureAdminProfile(client, {
          userId: id,
          roleRowId: acc.roleRowId,
          expectedRole: acc.role,
          email: acc.email,
        });
      } else if (acc.role === "teacher") {
        await ensureTeacherProfile(client, {
          userId: id,
          roleRowId: acc.roleRowId,
          expectedRole: acc.role,
          email: acc.email,
        });
      } else if (acc.role === "student") {
        await ensureStudentProfile(client, {
          userId: id,
          roleRowId: acc.roleRowId,
          expectedRole: acc.role,
          email: acc.email,
        });
      }

      console.log(
        `[bootstrap] ${acc.role} ${acc.email}: ${created ? "created" : "already present (password unchanged)"}`
      );
    }
  });
}

if (require.main === module) {
  ensureProductionDefaultUsers()
    .then(() => {
      console.log("[bootstrap] Done");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[bootstrap] Failed:", err);
      process.exit(1);
    });
}

module.exports = {
  ensureProductionDefaultUsers,
};

const express = require("express");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const { query, withTransaction } = require("../db");
const { randomUUID, parseJson, getUserById } = require("../db/helpers");

const router = express.Router();

router.use(auth, roleGuard("admin"));

function mapUserRow(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    is_blocked: row.is_blocked,
    roll_number: row.roll_number || null,
    section_id: row.section_id || null,
    class_name: row.class_name || null,
    section_name: row.section_name || null,
    department: row.department_name || null,
    department_id: row.department_id || null,
    year: row.year_number || null,
    academic_year: row.academic_year || null,
    designation: row.designation || null,
    teacher_subjects: row.teacher_subjects || [],
    profile: parseJson(row.profile, {}),
  };
}

async function buildAnalytics() {
  const totals = await query(`
    SELECT
      COUNT(*) FILTER (WHERE role = 'student') AS total_students,
      COUNT(*) FILTER (WHERE role = 'teacher') AS total_teachers,
      COUNT(*) FILTER (WHERE role = 'admin') AS total_admins,
      COUNT(*) AS total_users
    FROM users
  `);

  const yearCounts = await query(`
    WITH years AS (
      SELECT generate_series(EXTRACT(YEAR FROM CURRENT_DATE)::int - 4, EXTRACT(YEAR FROM CURRENT_DATE)::int) AS calendar_year
    )
    SELECT years.calendar_year AS year,
           COUNT(u.id) AS count
    FROM years
    LEFT JOIN users u
      ON u.role = 'student'
     AND EXTRACT(YEAR FROM u.created_at)::int = years.calendar_year
    GROUP BY years.calendar_year
    ORDER BY years.calendar_year
  `);

  const subjectAnalytics = await query(`
    SELECT
      sub.id,
      sub.name,
      sub.code,
      COUNT(DISTINCT ta.teacher_id) AS teacher_count,
      COUNT(DISTINCT st.id) AS enrolled_students
    FROM subjects sub
    LEFT JOIN teacher_assignments ta ON ta.subject_id = sub.id
    LEFT JOIN students st ON st.section_id = ta.section_id
    GROUP BY sub.id, sub.name, sub.code
    ORDER BY sub.name
  `);

  const requestCount = await query(
    `SELECT COUNT(*) AS count FROM requests WHERE status = 'pending'`
  );

  const totalRow = totals.rows[0];
  return {
    totalStudents: Number(totalRow.total_students || 0),
    totalTeachers: Number(totalRow.total_teachers || 0),
    totalSubjects: subjectAnalytics.rows.length,
    totalUsers: Number(totalRow.total_users || 0),
    pendingRequests: Number(requestCount.rows[0]?.count || 0),
    studentsYearWise: yearCounts.rows.map((row) => ({
      year: Number(row.year),
      count: Number(row.count),
    })),
    subjectAnalytics: subjectAnalytics.rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      teacherCount: Number(row.teacher_count || 0),
      enrolledStudents: Number(row.enrolled_students || 0),
    })),
    userMix: [
      { name: "Students", value: Number(totalRow.total_students || 0), color: "#2563eb" },
      { name: "Teachers", value: Number(totalRow.total_teachers || 0), color: "#0f766e" },
      { name: "Admins", value: Number(totalRow.total_admins || 0), color: "#7c3aed" },
    ],
  };
}

async function getRequests() {
  const result = await query(`
    SELECT r.*,
           u.name AS user_name,
           u.role
    FROM requests r
    JOIN users u ON u.id = r.user_id
    ORDER BY r.created_at DESC
  `);

  return result.rows.map((row) => ({
    ...row,
    old_value: parseJson(row.old_value, null),
    new_value: parseJson(row.new_value, null),
    request:
      row.type === "profile_update"
        ? "Profile update request submitted for review."
        : "Attendance change request requires review.",
  }));
}

router.get("/lookups", async (req, res, next) => {
  try {
    const [departments, years, sections, subjects, teacherAssignments, timetables] = await Promise.all([
      query(`SELECT id, name FROM departments ORDER BY name`),
      query(`SELECT id, year_number, academic_year, department_id FROM academic_years ORDER BY academic_year DESC, year_number`),
      query(`
        SELECT sec.id, sec.name, sec.class_name, sec.year_id, ay.year_number, ay.academic_year
        FROM sections sec
        JOIN academic_years ay ON ay.id = sec.year_id
        ORDER BY sec.class_name, sec.name
      `),
      query(`
        SELECT sub.id, sub.name, sub.code, sub.department_id, sub.year_id, d.name AS department_name, ay.year_number, ay.academic_year
        FROM subjects sub
        JOIN departments d ON d.id = sub.department_id
        JOIN academic_years ay ON ay.id = sub.year_id
        ORDER BY sub.name
      `),
      query(`
        SELECT ta.id,
               ta.teacher_id,
               ta.subject_id,
               ta.section_id,
               ta.academic_year,
               sub.name AS subject_name,
               sec.class_name,
               sec.name AS section_name
        FROM teacher_assignments ta
        JOIN subjects sub ON sub.id = ta.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        ORDER BY sub.name, sec.class_name, sec.name
      `),
      query(`
        SELECT tt.id,
               tt.teacher_assignment_id,
               tt.day_of_week,
               to_char(tt.start_time, 'HH24:MI') AS start_time,
               to_char(tt.end_time, 'HH24:MI') AS end_time,
               tt.room,
               sub.name AS subject_name,
               sec.class_name,
               sec.name AS section_name,
               u.name AS teacher_name
        FROM timetables tt
        JOIN teacher_assignments ta ON ta.id = tt.teacher_assignment_id
        JOIN subjects sub ON sub.id = ta.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        JOIN teachers t ON t.id = ta.teacher_id
        JOIN users u ON u.id = t.user_id
        ORDER BY tt.day_of_week, tt.start_time
      `),
    ]);

    res.json({
      success: true,
      data: {
        departments: departments.rows,
        years: years.rows,
        sections: sections.rows,
        subjects: subjects.rows,
        teacherAssignments: teacherAssignments.rows,
        timetables: timetables.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/subjects", async (req, res, next) => {
  try {
    const { name, code, department_id, year_id, semester = "", syllabus = "", credits = 3 } = req.body;
    if (!name || !code || !department_id || !year_id) {
      return res.status(400).json({ success: false, message: "name, code, department_id, and year_id are required." });
    }

    const created = await query(
      `
        INSERT INTO subjects (id, name, code, department_id, year_id, semester, syllabus, credits)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [randomUUID(), name, String(code).trim().toUpperCase(), department_id, year_id, semester, syllabus, Number(credits || 3)]
    );

    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/sections", async (req, res, next) => {
  try {
    const { year_id, class_name, name } = req.body;
    if (!year_id || !class_name || !name) {
      return res.status(400).json({ success: false, message: "year_id, class_name, and section name are required." });
    }

    const created = await query(
      `
        INSERT INTO sections (id, year_id, class_name, name)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [randomUUID(), year_id, class_name, String(name).trim().toUpperCase()]
    );

    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post("/timetables", async (req, res, next) => {
  try {
    const { teacher_assignment_id, day_of_week, start_time, end_time, room = "" } = req.body;
    if (!teacher_assignment_id || !day_of_week || !start_time || !end_time) {
      return res.status(400).json({ success: false, message: "teacher_assignment_id, day_of_week, start_time, and end_time are required." });
    }

    const created = await query(
      `
        INSERT INTO timetables (id, teacher_assignment_id, day_of_week, start_time, end_time, room)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [randomUUID(), teacher_assignment_id, day_of_week, start_time, end_time, room || null]
    );

    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const [analytics, recentUsers, requests] = await Promise.all([
      buildAnalytics(),
      query(`
        SELECT u.*, s.roll_number
        FROM users u
        LEFT JOIN students s ON s.user_id = u.id
        ORDER BY u.created_at DESC
        LIMIT 5
      `),
      getRequests(),
    ]);

    res.json({
      success: true,
      data: {
        analytics,
        recentUsers: recentUsers.rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          is_blocked: row.is_blocked,
          roll_number: row.roll_number || null,
        })),
        requests,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analytics", async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildAnalytics() });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { search = "", role = "", status = "" } = req.query;
    const result = await query(
      `
        SELECT
          u.*,
          st.roll_number,
          st.section_id,
          sec.class_name,
          sec.name AS section_name,
          ay.year_number,
          ay.academic_year,
          d.name AS department_name,
          d.id AS department_id,
          t.designation,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'teacher_assignment_id', ta.id,
                'subject_id', sub.id,
                'subject_name', sub.name,
                'section_id', sec2.id,
                'class_name', sec2.class_name,
                'section_name', sec2.name,
                'academic_year', ta.academic_year
              )
            ) FILTER (WHERE ta.id IS NOT NULL),
            '[]'::json
          ) AS teacher_subjects
        FROM users u
        LEFT JOIN students st ON st.user_id = u.id
        LEFT JOIN sections sec ON sec.id = st.section_id
        LEFT JOIN academic_years ay ON ay.id = sec.year_id
        LEFT JOIN departments d ON d.id = COALESCE(ay.department_id, (
          SELECT department_id FROM teachers t WHERE t.user_id = u.id LIMIT 1
        ))
        LEFT JOIN teachers t ON t.user_id = u.id
        LEFT JOIN teacher_assignments ta ON ta.teacher_id = t.id
        LEFT JOIN subjects sub ON sub.id = ta.subject_id
        LEFT JOIN sections sec2 ON sec2.id = ta.section_id
        WHERE ($1 = '' OR u.role = $1)
          AND ($2 = '' OR (
            u.name ILIKE '%' || $2 || '%' OR
            u.email ILIKE '%' || $2 || '%' OR
            COALESCE(u.phone, '') ILIKE '%' || $2 || '%' OR
            COALESCE(st.roll_number, '') ILIKE '%' || $2 || '%'
          ))
          AND (
            $3 = '' OR
            ($3 = 'blocked' AND u.is_blocked = TRUE) OR
            ($3 = 'active' AND u.is_blocked = FALSE)
          )
        GROUP BY u.id, st.roll_number, st.section_id, sec.class_name, sec.name, ay.year_number, ay.academic_year, d.name, d.id, t.designation
        ORDER BY u.created_at DESC
      `,
      [String(role), String(search), String(status)]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows.map(mapUserRow),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      password = "password123",
      department_id,
      section_id,
      roll_number,
      designation,
      teaching_assignments = [],
    } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: "Name, email, and role are required." });
    }

    const hashed = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    await withTransaction(async (client) => {
      await client.query(
        `
          INSERT INTO users (id, name, email, phone, password_hash, role, profile)
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        `,
        [
          userId,
          name,
          email,
          phone || null,
          hashed,
          role,
          JSON.stringify({
            designation: designation || (role === "teacher" ? "Faculty" : role === "admin" ? "Administrator" : "Student"),
            notifications: { email: true, push: true },
            theme: "light",
          }),
        ]
      );

      if (role === "admin") {
        await client.query(`INSERT INTO admins (id, user_id) VALUES ($1, $2)`, [randomUUID(), userId]);
      }

      if (role === "teacher") {
        if (!department_id) throw new Error("Teacher department is required.");
        const teacherId = randomUUID();
        await client.query(
          `INSERT INTO teachers (id, user_id, department_id, designation) VALUES ($1, $2, $3, $4)`,
          [teacherId, userId, department_id, designation || "Faculty"]
        );

        for (const assignment of teaching_assignments) {
          if (!assignment.subject_id || !assignment.section_id || !assignment.academic_year) continue;
          await client.query(
            `
              INSERT INTO teacher_assignments (id, teacher_id, subject_id, section_id, academic_year)
              VALUES ($1, $2, $3, $4, $5)
            `,
            [randomUUID(), teacherId, assignment.subject_id, assignment.section_id, assignment.academic_year]
          );
        }
      }

      if (role === "student") {
        if (!section_id || !roll_number) throw new Error("Student section and roll number are required.");
        await client.query(
          `INSERT INTO students (id, user_id, roll_number, section_id) VALUES ($1, $2, $3, $4)`,
          [randomUUID(), userId, roll_number, section_id]
        );
      }
    });

    const created = await getUserById(userId);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const {
      name,
      email,
      phone,
      is_blocked,
      section_id,
      roll_number,
      department_id,
      designation,
      teaching_assignments = [],
    } = req.body;

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE users
          SET name = COALESCE($2, name),
              email = COALESCE($3, email),
              phone = COALESCE($4, phone),
              is_blocked = COALESCE($5, is_blocked),
              updated_at = NOW()
          WHERE id = $1
        `,
        [req.params.id, name || null, email || null, phone || null, typeof is_blocked === "boolean" ? is_blocked : null]
      );

      if (user.role === "student") {
        await client.query(
          `
            UPDATE students
            SET roll_number = COALESCE($2, roll_number),
                section_id = COALESCE($3, section_id)
            WHERE user_id = $1
          `,
          [req.params.id, roll_number || null, section_id || null]
        );
      }

      if (user.role === "teacher") {
        await client.query(
          `
            UPDATE teachers
            SET department_id = COALESCE($2, department_id),
                designation = COALESCE($3, designation)
            WHERE user_id = $1
          `,
          [req.params.id, department_id || null, designation || null]
        );

        const teacherRow = await client.query(
          `SELECT id FROM teachers WHERE user_id = $1 LIMIT 1`,
          [req.params.id]
        );
        const teacherId = teacherRow.rows[0]?.id;
        if (teacherId) {
          await client.query(`DELETE FROM teacher_assignments WHERE teacher_id = $1`, [teacherId]);
          for (const assignment of teaching_assignments) {
            if (!assignment.subject_id || !assignment.section_id || !assignment.academic_year) continue;
            await client.query(
              `INSERT INTO teacher_assignments (id, teacher_id, subject_id, section_id, academic_year) VALUES ($1, $2, $3, $4, $5)`,
              [randomUUID(), teacherId, assignment.subject_id, assignment.section_id, assignment.academic_year]
            );
          }
        }
      }
    });

    const updated = await getUserById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/block", async (req, res, next) => {
  try {
    const result = await query(
      `
        UPDATE users
        SET is_blocked = NOT is_blocked,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const updated = await getUserById(req.params.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const result = await query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    if (!result.rowCount) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    next(error);
  }
});

router.get("/requests", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getRequests() });
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected." });
    }

    const requestResult = await query(`SELECT * FROM requests WHERE id = $1 LIMIT 1`, [req.params.id]);
    const requestRow = requestResult.rows[0];
    if (!requestRow) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    const requestData = {
      ...requestRow,
      old_value: parseJson(requestRow.old_value, null),
      new_value: parseJson(requestRow.new_value, null),
    };
    const requestUser = await getUserById(requestData.user_id);

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE requests
          SET status = $2,
              reviewed_by = $3,
              reviewed_at = NOW()
          WHERE id = $1
        `,
        [req.params.id, status, req.user.id]
      );

      if (status === "approved" && requestData.type === "profile_update") {
        const newValue = requestData.new_value || {};
        const profile = newValue.profile || {};
        await client.query(
          `
            UPDATE users
            SET name = COALESCE($2, name),
                email = COALESCE($3, email),
                phone = COALESCE($4, phone),
                profile = profile || $5::jsonb,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            requestData.user_id,
            newValue.name || null,
            newValue.email || null,
            newValue.phone || null,
            JSON.stringify(profile),
          ]
        );

        if (requestUser?.role === "student" && (newValue.roll_number || newValue.section_id)) {
          await client.query(
            `
              UPDATE students
              SET roll_number = COALESCE($2, roll_number),
                  section_id = COALESCE($3, section_id)
              WHERE user_id = $1
            `,
            [requestData.user_id, newValue.roll_number || null, newValue.section_id || null]
          );
        }

        if (requestUser?.role === "teacher") {
          let departmentId = newValue.department_id || null;
          if (!departmentId && newValue.department) {
            const departmentResult = await client.query(
              `SELECT id FROM departments WHERE LOWER(name) = LOWER($1) LIMIT 1`,
              [newValue.department]
            );
            departmentId = departmentResult.rows[0]?.id || null;
          }

          if (departmentId || newValue.profile?.designation || newValue.designation) {
            await client.query(
              `
                UPDATE teachers
                SET department_id = COALESCE($2, department_id),
                    designation = COALESCE($3, designation)
                WHERE user_id = $1
              `,
              [
                requestData.user_id,
                departmentId,
                newValue.designation || newValue.profile?.designation || null,
              ]
            );
          }
        }
      }

      if (status === "approved" && requestData.type === "attendance_change") {
        const newValue = requestData.new_value || {};
        if (newValue.attendance_record_id) {
          await client.query(
            `UPDATE attendance_records SET status = $2, marked_at = NOW() WHERE id = $1`,
            [newValue.attendance_record_id, newValue.status]
          );
        }
      }

      await client.query(
        `
          INSERT INTO notifications (id, user_id, title, message, type, action_url)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          randomUUID(),
          requestData.user_id,
          `Request ${status}`,
          status === "approved"
            ? "Your request was approved and the database has been updated."
            : "Your request was reviewed and rejected.",
          "alert",
          requestData.type === "attendance_change" ? "/student/attendance" : `/${requestUser?.role || "student"}/profile`,
        ]
      );
    });

    const updated = await query(`SELECT * FROM requests WHERE id = $1`, [req.params.id]);
    res.json({
      success: true,
      data: {
        ...updated.rows[0],
        old_value: parseJson(updated.rows[0].old_value, null),
        new_value: parseJson(updated.rows[0].new_value, null),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const user = await getUserById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", async (req, res, next) => {
  try {
    const { name, email, phone, profile = {} } = req.body;
    await query(
      `
        UPDATE users
        SET name = COALESCE($2, name),
            email = COALESCE($3, email),
            phone = COALESCE($4, phone),
            profile = profile || $5::jsonb,
            updated_at = NOW()
        WHERE id = $1
      `,
      [req.user.id, name || null, email || null, phone || null, JSON.stringify(profile)]
    );

    res.json({ success: true, data: await getUserById(req.user.id) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

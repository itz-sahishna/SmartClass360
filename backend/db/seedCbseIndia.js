/**
 * Rich CBSE-style India school dataset (idempotent via app_seed_meta).
 *
 * - Relaxes academic_years.year_number to 1–12 (grades 6–12).
 * - Skips if app_seed_meta contains cbse_india_v1 (set FORCE_CBSE_SEED=true to re-run — not recommended on partial data).
 * - Synthetic teachers/students share password: Passw0rd!CBSE (bootstrap trio unchanged).
 *
 * Heavy work runs after HTTP listen (server.js) or: npm run db:seed-cbse
 */
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");
const { pool } = require("../src/db");

const SEED_KEY = "cbse_india_v1";
const ACADEMIC_YEAR = "2025-26";
const DEPT_ID = "dept-cbse-vidya-niketan";
const DEPT_NAME = "Vidya Niketan Public School (CBSE)";
const DEMO_PASSWORD = "Passw0rd!CBSE";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PERIODS = [
  { label: "P1", start: "08:00", end: "08:45" },
  { label: "P2", start: "08:50", end: "09:35" },
  { label: "P3", start: "09:40", end: "10:25" },
  { label: "P4", start: "10:40", end: "11:25" },
  { label: "Lunch", start: "11:30", end: "12:10" },
  { label: "P5", start: "12:15", end: "13:00" },
  { label: "P6", start: "13:05", end: "13:50" },
  { label: "P7", start: "13:55", end: "14:40" },
  { label: "P8", start: "14:45", end: "15:30" },
];

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Krishna", "Ishaan", "Shaurya", "Atharv",
  "Ananya", "Diya", "Saanvi", "Aadhya", "Ira", "Myra", "Kiara", "Pihu", "Riya", "Tara",
  "Rohan", "Kabir", "Dev", "Yash", "Neel", "Karan", "Manav", "Harsh", "Rudra", "Om",
  "Kavya", "Meera", "Navya", "Prisha", "Siya", "Avni", "Ishita", "Arya", "Mira", "Lavanya",
];
const LAST_NAMES = [
  "Sharma", "Verma", "Reddy", "Iyer", "Patel", "Singh", "Kumar", "Gupta", "Mehta", "Joshi",
  "Nair", "Menon", "Pillai", "Rao", "Chopra", "Kapoor", "Malhotra", "Bansal", "Agarwal", "Desai",
  "Kulkarni", "Chatterjee", "Banerjee", "Mukherjee", "Das", "Sen", "Ghosh", "Bhatt", "Shah", "Modi",
];
const TEACHER_FIRST = [
  "Rajesh", "Sunita", "Amit", "Priya", "Vikram", "Neha", "Suresh", "Deepa", "Manish", "Kavita",
  "Anil", "Poonam", "Ramesh", "Geeta", "Naveen", "Swati", "Harish", "Meena", "Ashok", "Lata",
  "Vinod", "Rekha", "Gopal", "Uma", "Kiran", "Sarita", "Prakash", "Anita", "Dinesh", "Ritu",
];
const STREETS = [
  "Sector 12, Dwarka", "Rohini Sector 24", "Indirapuram", "Vaishali", "Jayanagar 4th Block",
  "Koramangala 5th Block", "Banjara Hills Road No 10", "Hitech City", "Salt Lake Sector V",
  "Viman Nagar", "Kothrud", "Sector 62 Noida", "Gurgaon Sector 56", "Faridabad NIT",
];
const MOTHER_NAMES = ["Sunita", "Kavita", "Meera", "Anjali", "Pooja", "Neha", "Divya", "Radha", "Lakshmi", "Sneha"];
const FATHER_NAMES = ["Ramesh", "Suresh", "Mahesh", "Ajay", "Vijay", "Sanjay", "Deepak", "Manoj", "Nitin", "Ravi"];

function pick(arr, i) {
  return arr[i % arr.length];
}

function dobForStudent(grade, index) {
  const age = 6 + (grade - 6) + 5 + (index % 4);
  const y = 2026 - age;
  const m = 1 + (index % 12);
  const d = 1 + (index % 27);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function subjectsForGrade(grade) {
  const g = (name, code, credits = 3) => ({ name, code: `CBSE-G${grade}-${code}`, credits });
  const tail = [
    g("Value Education", "VAL", 1),
    g("Laboratory", "LAB", 2),
    g("Library", "LIBR", 1),
  ];
  if (grade <= 8) {
    return [
      g("English", "ENG"),
      g("Mathematics", "MAT"),
      g("Science", "SCI"),
      g("Social Science", "SST"),
      g("Hindi", "HIN"),
      g("Sanskrit", "SAN", 2),
      g("Computer Science", "CS"),
      g("Physical Education", "PE", 2),
      ...tail,
    ];
  }
  if (grade <= 10) {
    return [
      g("English", "ENG"),
      g("Mathematics", "MAT"),
      g("Science", "SCI"),
      g("Social Science", "SST"),
      g("Hindi", "HIN"),
      g("Computer Science", "CS"),
      g("Information Technology", "IT", 2),
      g("Physical Education", "PE", 2),
      ...tail,
    ];
  }
  return [
    g("English", "ENG"),
    g("Mathematics", "MAT"),
    g("Physics", "PHY"),
    g("Chemistry", "CHE"),
    g("Biology", "BIO"),
    g("Computer Science", "CS"),
    g("Economics", "ECO", 3),
    g("Accountancy", "ACC", 3),
    g("Business Studies", "BST", 3),
    g("Hindi", "HIN"),
    ...tail,
  ];
}

function subjectIdForCode(code) {
  return `subj-${code}`;
}

function studentsPerSection(grade, secChar) {
  const base = 25 + ((grade + secChar.charCodeAt(0)) % 11);
  return Math.min(35, Math.max(25, base));
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const usedPhones = new Set();

async function generateUniquePhone(client, prefix = "9") {
  while (true) {
    const phone =
      prefix +
      Math.floor(100000000 + Math.random() * 900000000).toString();

    if (usedPhones.has(phone)) continue;

    const exists = await client.query(
      "SELECT 1 FROM users WHERE phone = $1 LIMIT 1",
      [phone]
    );

    if (!exists.rows.length) {
      usedPhones.add(phone);
      return phone;
    }
  }
}

async function ensureAppSeedMetaTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_seed_meta (
      key TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function relaxAcademicYearCheck(client) {
  const { rows } = await client.query(`
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE t.relname = 'academic_years'
      AND n.nspname = 'public'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%year_number%'
  `);
  for (const row of rows) {
    await client.query(`ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS "${row.conname}"`);
  }
  await client.query(`
    ALTER TABLE academic_years
    ADD CONSTRAINT academic_years_year_number_cbse_chk
    CHECK (year_number >= 1 AND year_number <= 12)
  `).catch(() => {});
}

async function insertDepartment(client) {
  await client.query(
    `INSERT INTO departments (id, name) VALUES ($1, $2)
     ON CONFLICT (id) DO NOTHING`,
    [DEPT_ID, DEPT_NAME]
  );
}

async function buildAcademicStructure(client) {
  const yearIds = {};
  for (let grade = 6; grade <= 12; grade += 1) {
    const yid = `year-cbse-${ACADEMIC_YEAR}-g${grade}`;
    yearIds[grade] = yid;
    await client.query(
      `INSERT INTO academic_years (id, department_id, year_number, academic_year)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (department_id, year_number, academic_year) DO NOTHING`,
      [yid, DEPT_ID, grade, ACADEMIC_YEAR]
    );
  }
  const sectionKeys = [];
  for (let grade = 6; grade <= 12; grade += 1) {
    for (const sec of ["A", "B", "C"]) {
      const sid = `sec-cbse-g${grade}-${sec}`;
      sectionKeys.push({ grade, sec, sid });
      await client.query(
        `INSERT INTO sections (id, year_id, class_name, name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (year_id, class_name, name) DO NOTHING`,
        [sid, yearIds[grade], `Grade ${grade}`, sec]
      );
    }
  }
  return { yearIds, sectionKeys };
}

async function insertSubjects(client, yearIds) {
  for (let grade = 6; grade <= 12; grade += 1) {
    const yid = yearIds[grade];
    for (const s of subjectsForGrade(grade)) {
      const sid = subjectIdForCode(s.code);
      await client.query(
        `INSERT INTO subjects (id, name, code, department_id, year_id, semester, syllabus, credits)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (code) DO NOTHING`,
        [
          sid,
          s.name,
          s.code,
          DEPT_ID,
          yid,
          "Term I",
          `CBSE ${ACADEMIC_YEAR} — ${s.name} (Grade ${grade})`,
          s.credits,
        ]
      );
    }
  }
}

function allSubjectCodes() {
  const set = new Set();
  for (let g = 6; g <= 12; g += 1) {
    subjectsForGrade(g).forEach((s) => set.add(s.code));
  }
  return [...set];
}

async function createTeachers(client, demoHash) {
  const codes = allSubjectCodes();
  const teachers = [];
  let ti = 0;
  for (const code of codes) {
    for (let copy = 0; copy < 2; copy += 1) {
      const tid = `tchr-cbse-${code}-c${copy}`;
      const uid = `user-${tid}`;
      const fn = pick(TEACHER_FIRST, ti);
      const ln = pick(LAST_NAMES, ti + 5);
      const email = `faculty.${code.replace(/[^a-zA-Z0-9]/g, "")}.c${copy}.t${ti}@vidyaniketan.edu.in`;
      const phone = await generateUniquePhone(client, "9");
      ti += 1;
      const profile = {
        gender: copy === 0 ? "Female" : "Male",
        qualification: "M.Ed, B.Ed",
        experience_years: 5 + (ti % 18),
        address: `${pick(STREETS, ti)}, India`,
      };
      await client.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, is_blocked, profile)
         VALUES ($1, $2, $3, $4, $5, 'teacher', FALSE, $6::jsonb)
         ON CONFLICT (email) DO NOTHING`,
        [uid, `${fn} ${ln}`, email, phone, demoHash, JSON.stringify(profile)]
      );
      const ur = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
      const realUid = ur.rows[0].id;
      await client.query(
        `INSERT INTO teachers (id, user_id, department_id, designation)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [tid, realUid, DEPT_ID, copy === 0 ? "PGT" : "TGT"]
      );
      teachers.push({ id: tid, userId: realUid, code });
    }
  }
  return teachers;
}

function teachersForCode(teachers, code) {
  return teachers.filter((t) => t.code === code);
}

async function createAssignments(client, sectionKeys, teachers) {
  const list = [];
  let rot = 0;
  for (const { grade, sec, sid } of sectionKeys) {
    for (const s of subjectsForGrade(grade)) {
      const pool = teachersForCode(teachers, s.code);
      const t = pool[rot % pool.length];
      rot += 1;
      const taid = `ta-${sid}-${s.code}`;
      const subjId = subjectIdForCode(s.code);
      await client.query(
        `INSERT INTO teacher_assignments (id, teacher_id, subject_id, section_id, academic_year)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (teacher_id, subject_id, section_id, academic_year) DO NOTHING`,
        [taid, t.id, subjId, sid, ACADEMIC_YEAR]
      );
      list.push({
        id: taid,
        teacherId: t.id,
        subjectId: subjId,
        sectionId: sid,
        grade,
        code: s.code,
      });
    }
  }
  return list;
}

async function createTimetables(client, assignments) {
  const busy = new Set();
  for (const ta of assignments) {
    for (let di = 0; di < DAYS.length; di += 1) {
      const day = DAYS[di];
      let placed = false;
      for (let tries = 0; tries < PERIODS.length && !placed; tries += 1) {
        const pi = (di * 2 + tries + (hashStr(ta.id) % PERIODS.length)) % PERIODS.length;
        const p = PERIODS[pi];
        const key = `${ta.teacherId}|${day}|${p.start}`;
        if (!busy.has(key)) {
          busy.add(key);
          const ttid = `tt-${ta.id}-${day}`;
          await client.query(
            `INSERT INTO timetables (id, teacher_assignment_id, day_of_week, start_time, end_time, room)
             VALUES ($1, $2, $3, $4::time, $5::time, $6)
             ON CONFLICT (id) DO NOTHING`,
            [ttid, ta.id, day, p.start, p.end, `Room ${120 + (hashStr(ttid) % 60)}`]
          );
          placed = true;
        }
      }
      if (!placed) {
        const p = PERIODS[di % PERIODS.length];
        const ttid = `tt-${ta.id}-${day}-f`;
        await client.query(
          `INSERT INTO timetables (id, teacher_assignment_id, day_of_week, start_time, end_time, room)
           VALUES ($1, $2, $3, $4::time, $5::time, $6)
           ON CONFLICT (id) DO NOTHING`,
          [ttid, ta.id, day, p.start, p.end, `Room ${200 + (hashStr(ttid) % 40)}`]
        );
      }
    }
  }
}

async function createStudents(client, sectionKeys, demoHash) {
  const students = [];
  let si = 0;
  for (const { grade, sec, sid } of sectionKeys) {
    const n = studentsPerSection(grade, sec);
    for (let i = 1; i <= n; i += 1) {
      const fn = pick(FIRST_NAMES, si + i);
      const ln = pick(LAST_NAMES, si + i + 2);
      const roll = `2526${grade}${sec}${String(i).padStart(2, "0")}`;
      const email = `student.g${grade}${sec.toLowerCase()}.${String(i).padStart(2, "0")}@vidyaniketan.edu.in`;
      const phone = await generateUniquePhone(client, "8");
      const uid = `user-stu-${roll}`;
      const stid = `stu-${roll}`;
      const mother = pick(MOTHER_NAMES, si);
      const father = pick(FATHER_NAMES, si + 3);
      const profile = {
        gender: genderFromIndex(si),
        date_of_birth: dobForStudent(grade, i),
        address: `${pick(STREETS, si + i)}, India`,
        parent_name: `${father} & ${mother}`,
        parent_phone: `9${String(910000000 + (si % 900000000)).slice(0, 9)}`,
        admission_year: ACADEMIC_YEAR,
        blood_group: pick(["O+", "A+", "B+", "AB+", "O-"], si),
        aadhaar_last4: String(1000 + (si % 9000)),
        ml_features: {
          attendance_percentage: 65 + ((si + i) % 35),
          assignment_completion: 55 + ((si * 2 + i) % 45),
          quiz_scores: 40 + ((si + i * 3) % 55),
          study_hours_per_week: Number((4 + ((si + i) % 20) / 3).toFixed(1)),
          behavior_score: 60 + ((si + i) % 40),
          participation_score: 50 + ((si * 3 + i) % 50),
          internal_marks: 45 + ((si + i * 2) % 55),
          risk_level: pick(["low", "medium", "high"], si + i),
        },
      };
      si += 1;
      await client.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, is_blocked, profile)
         VALUES ($1, $2, $3, $4, $5, 'student', FALSE, $6::jsonb)
         ON CONFLICT (email) DO NOTHING`,
        [uid, `${fn} ${ln}`, email, phone, demoHash, JSON.stringify(profile)]
      );
      const ur = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (!ur.rows.length) continue;
      const realUid = ur.rows[0].id;
      await client.query(
        `INSERT INTO students (id, user_id, roll_number, section_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (roll_number) DO NOTHING`,
        [stid, realUid, roll, sid]
      );
      const sr = await client.query(`SELECT id FROM students WHERE roll_number = $1`, [roll]);
      if (sr.rows.length) {
        students.push({
          id: sr.rows[0].id,
          userId: realUid,
          sectionId: sid,
          grade,
          roll,
        });
      }
    }
  }
  return students;
}

function genderFromIndex(i) {
  return i % 2 === 0 ? "Male" : "Female";
}

async function loadAssignmentRows(client) {
  const r = await client.query(
    `
    SELECT ta.id, ta.teacher_id, ta.subject_id, ta.section_id, ta.academic_year,
           sec.class_name
    FROM teacher_assignments ta
    JOIN sections sec ON sec.id = ta.section_id
    WHERE ta.academic_year = $1 AND ta.id LIKE 'ta-sec-cbse-%'
    ORDER BY ta.id
  `,
    [ACADEMIC_YEAR]
  );
  return r.rows;
}

async function loadStudentsBySection(client) {
  const r = await client.query(`
    SELECT s.id, s.section_id, s.roll_number, sec.class_name
    FROM students s
    JOIN sections sec ON sec.id = s.section_id
    WHERE s.roll_number LIKE '2526%'
    ORDER BY s.section_id, s.roll_number
  `);
  const map = new Map();
  for (const row of r.rows) {
    if (!map.has(row.section_id)) map.set(row.section_id, []);
    map.get(row.section_id).push(row);
  }
  return map;
}

async function createAttendanceAndMarks(client) {
  const tas = await loadAssignmentRows(client);
  const studentsBySec = await loadStudentsBySection(client);
  const ttByTa = new Map();
  const ttRows = await client.query(`
    SELECT id, teacher_assignment_id
    FROM timetables
    WHERE teacher_assignment_id LIKE 'ta-sec-cbse-%'
  `);
  for (const row of ttRows.rows) {
    if (!ttByTa.has(row.teacher_assignment_id)) {
      ttByTa.set(row.teacher_assignment_id, []);
    }
    ttByTa.get(row.teacher_assignment_id).push(row.id);
  }

  const baseDates = [];
  for (let d = 1; d <= 28; d += 1) {
    baseDates.push(`2025-11-${String(d).padStart(2, "0")}`);
  }

  for (const ta of tas) {
    const ttIds = ttByTa.get(ta.id) || [];
    if (!ttIds.length) continue;
    const studs = studentsBySec.get(ta.section_id) || [];
    let dateIdx = 0;
    for (const date of baseDates) {
      const ttid = ttIds[dateIdx % ttIds.length];
      dateIdx += 1;
      const sid = `sess-${ta.id}-${date}`;
      await client.query(
        `INSERT INTO attendance_sessions (id, teacher_assignment_id, timetable_id, date, created_by)
         VALUES ($1, $2, $3, $4::date, $5)
         ON CONFLICT (timetable_id, date) DO NOTHING`,
        [sid, ta.id, ttid, date, ta.teacher_id]
      );
      const sessRes = await client.query(
        `SELECT id FROM attendance_sessions WHERE teacher_assignment_id = $1 AND date = $2::date`,
        [ta.id, date]
      );
      if (!sessRes.rows.length) continue;
      const sessionId = sessRes.rows[0].id;
      for (const st of studs) {
        const rollSum = [...st.roll_number].reduce((a, c) => a + c.charCodeAt(0), 0);
        const statusRoll = rollSum % 10;
        const status = statusRoll < 1 ? "absent" : statusRoll < 2 ? "late" : "present";
        await client.query(
          `INSERT INTO attendance_records (id, session_id, student_id, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, student_id) DO NOTHING`,
          [`ar-${sessionId}-${st.id}`, sessionId, st.id, status]
        );
      }
    }

    const grade = Number((ta.class_name || "").replace(/\D/g, "")) || 8;
    for (const st of studs) {
      const hash = [...st.roll_number].reduce((a, c) => a + c.charCodeAt(0), 0);
      const band = hash % 3;
      const base = band === 0 ? 82 : band === 1 ? 68 : 52;
      const mid = Math.min(100, base + (hash % 12));
      const fin = Math.min(100, mid + (hash % 10) - 4);
      const assign = Math.min(100, mid - 5 + (hash % 8));
      const quiz = Math.min(100, assign + (hash % 15));

      for (const [examType, marks, max, dt] of [
        ["mid", mid, 100, "2025-10-15"],
        ["final", fin, 100, "2025-12-05"],
        ["assignment", assign, 50, "2025-11-01"],
        ["quiz", quiz, 20, "2025-11-18"],
      ]) {
        const markId = `mk-${st.id}-${ta.subject_id}-${examType}-${dt}`;
        await client.query(
          `INSERT INTO marks (id, student_id, subject_id, teacher_id, section_id, exam_type, marks_obtained, max_marks, is_online, date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::date)
           ON CONFLICT (student_id, subject_id, teacher_id, section_id, exam_type, date) DO NOTHING`,
          [
            markId,
            st.id,
            ta.subject_id,
            ta.teacher_id,
            ta.section_id,
            examType,
            marks,
            max,
            examType === "quiz",
            dt,
          ]
        );
      }
    }

    await client.query(
      `
      INSERT INTO exams (id, subject_id, section_id, exam_type, date, max_marks)
      SELECT $1, $2, $3, 'mid', '2025-10-15'::date, 100
      WHERE NOT EXISTS (SELECT 1 FROM exams WHERE id = $1)
    `,
      [`ex-mid-${ta.id}`, ta.subject_id, ta.section_id]
    );

    await client.query(
      `
      INSERT INTO exams (id, subject_id, section_id, exam_type, date, max_marks)
      SELECT $1, $2, $3, 'final', '2025-12-05'::date, 100
      WHERE NOT EXISTS (SELECT 1 FROM exams WHERE id = $1)
    `,
      [`ex-fin-${ta.id}`, ta.subject_id, ta.section_id]
    );
  }
}

async function createAssignmentsAndSubmissions(client) {
  const tas = await loadAssignmentRows(client);
  const studentsBySec = await loadStudentsBySection(client);
  for (const ta of tas.slice(0, 400)) {
    const studs = studentsBySec.get(ta.section_id) || [];
    const aid = `asg-${ta.id}-1`;
    await client.query(
      `
      INSERT INTO assignments (id, title, description, subject_id, teacher_assignment_id, type, due_date, max_marks)
      SELECT $1, $2, $3, $4, $5, 'assignment', NOW() + interval '7 days', 20
      WHERE NOT EXISTS (SELECT 1 FROM assignments WHERE id = $1)
    `,
      [
        aid,
        `Homework — Unit assessment`,
        "Complete NCERT exercises and submit scanned solutions.",
        ta.subject_id,
        ta.id,
      ]
    );

    const qid = `q-${aid}-1`;
    await client.query(
      `
      INSERT INTO assignment_questions (id, assignment_id, question_text, question_type, correct_option_index, marks, display_order)
      SELECT $1, $2, $3, 'mcq', 1, 5, 1
      WHERE NOT EXISTS (SELECT 1 FROM assignment_questions WHERE id = $1)
    `,
      [qid, aid, "Which topic needs the most revision?"]
    );

    for (let oi = 0; oi < 4; oi += 1) {
      await client.query(
        `
        INSERT INTO assignment_question_options (id, question_id, option_text, display_order)
        SELECT $1, $2, $3, $4
        WHERE NOT EXISTS (SELECT 1 FROM assignment_question_options WHERE id = $1)
      `,
        [`opt-${qid}-${oi}`, qid, pick(["Algebra", "Geometry", "Trigonometry", "Mensuration"], oi), oi]
      );
    }

    for (const st of studs) {
      const h = [...st.roll_number].reduce((a, c) => a + c.charCodeAt(0), 0);
      const submitted = h % 7 !== 0;
      await client.query(
        `INSERT INTO submissions (id, assignment_id, student_id, submitted_text, answers, submitted_at, marks, status)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
         ON CONFLICT (assignment_id, student_id) DO NOTHING`,
        [
          `sub-${aid}-${st.id}`,
          aid,
          st.id,
          submitted ? "Submitted via portal" : null,
          JSON.stringify({ q1: h % 4 }),
          submitted ? new Date() : null,
          submitted ? 12 + (h % 8) : null,
          submitted ? "graded" : "pending",
        ]
      ).catch(() => {});
    }
  }
}

async function createStudentPerformance(client) {
  const rows = await client.query(`
    SELECT s.id AS student_id, ta.subject_id,
           AVG(m.marks_obtained / NULLIF(m.max_marks,0) * 100) AS avg_pct
    FROM students s
    JOIN teacher_assignments ta ON ta.section_id = s.section_id
    LEFT JOIN marks m ON m.student_id = s.id AND m.subject_id = ta.subject_id
    WHERE s.roll_number LIKE '2526%'
    GROUP BY s.id, ta.subject_id
  `);
  for (const row of rows.rows) {
    const avg = row.avg_pct ? Number(row.avg_pct) : 60 + (randomUUID().replace(/-/g, "").charCodeAt(0) % 30);
    const att = 70 + (hashStr(row.student_id + row.subject_id) % 28);
    const assign = 55 + (hashStr(row.subject_id) % 40);
    const exam = Math.min(100, avg + 2);
    const finalM = Math.min(100, avg);
    const past = Math.max(40, avg - 5);
    const pass = avg >= 40;
    const pred = avg >= 80 ? "Good" : avg >= 60 ? "Average" : "At Risk";
    const grade = avg >= 90 ? "A+" : avg >= 80 ? "A" : avg >= 70 ? "B" : avg >= 60 ? "C" : "D";
    const insights = {
      factors: [
        att < 75 ? "Attendance below 75%" : "Attendance stable",
        assign < 65 ? "Assignment engagement needs lift" : "Assignments on track",
        exam < 60 ? "Exam performance volatile" : "Exam trend positive",
      ],
      confidence: Math.min(0.98, 0.55 + avg / 200),
      attendance_percentage: att,
      assignment_completion: assign,
      quiz_scores: exam - 5,
      study_hours: Number((5 + (hashStr(row.student_id) % 15) / 3).toFixed(1)),
      behavior_score: 60 + (hashStr(row.subject_id) % 35),
      participation_score: 55 + (hashStr(row.student_id) % 40),
      internal_marks: avg,
      risk_level: avg < 55 ? "high" : avg < 72 ? "medium" : "low",
    };
    await client.query(
      `INSERT INTO student_performance (
         id, student_id, subject_id, avg_marks, attendance_percentage,
         assignment_score, exam_score, final_marks, past_performance,
         predicted_performance, predicted_grade, pass_prediction, insights
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
       ON CONFLICT (student_id, subject_id)
       DO UPDATE SET
         avg_marks = EXCLUDED.avg_marks,
         attendance_percentage = EXCLUDED.attendance_percentage,
         assignment_score = EXCLUDED.assignment_score,
         exam_score = EXCLUDED.exam_score,
         final_marks = EXCLUDED.final_marks,
         past_performance = EXCLUDED.past_performance,
         predicted_performance = EXCLUDED.predicted_performance,
         predicted_grade = EXCLUDED.predicted_grade,
         pass_prediction = EXCLUDED.pass_prediction,
         insights = EXCLUDED.insights,
         generated_at = NOW()`,
      [
        randomUUID(),
        row.student_id,
        row.subject_id,
        avg,
        att,
        assign,
        exam,
        finalM,
        past,
        pred,
        grade,
        pass,
        JSON.stringify(insights),
      ]
    );
  }
}

async function createNotificationsSample(client) {
  const admins = await client.query(`SELECT user_id FROM admins LIMIT 5`);
  const students = await client.query(`
    SELECT u.id AS user_id
    FROM students s
    JOIN users u ON u.id = s.user_id
    WHERE s.roll_number LIKE '2526%'
    LIMIT 200
  `);
  for (const row of students.rows) {
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, 'announcement', FALSE)`,
      [randomUUID(), row.user_id, "PTM reminder", "Parent–Teacher meeting is scheduled for Saturday 10:00 AM."]
    ).catch(() => {});
  }
  for (const row of admins.rows) {
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, 'system', FALSE)`,
      [randomUUID(), row.user_id, "Data sync", "CBSE term records have been refreshed for analytics."]
    ).catch(() => {});
  }
}

async function runCbseSeedInternal() {
  const demoHash = bcrypt.hashSync(DEMO_PASSWORD, 9);
  const client = await pool.connect();
  try {
    await ensureAppSeedMetaTable(client);
    await client.query(`DELETE FROM app_seed_meta WHERE key = $1`, [SEED_KEY]);
    console.log("[seed-cbse] cleared old seed marker");
    if (process.env.FORCE_CBSE_SEED === "true") {
      await client.query(`DELETE FROM app_seed_meta WHERE key = $1`, [SEED_KEY]);
    }
    const applied = await client.query(`SELECT 1 FROM app_seed_meta WHERE key = $1`, [SEED_KEY]);
    if (applied.rows.length > 0) {
      console.log("[seed-cbse] Already applied — skipping");
      return;
    }

    await client.query("BEGIN");
    await relaxAcademicYearCheck(client);
    await insertDepartment(client);
    const { yearIds, sectionKeys } = await buildAcademicStructure(client);
    await insertSubjects(client, yearIds);
    const teachers = await createTeachers(client, demoHash);
    const assignments = await createAssignments(client, sectionKeys, teachers);
    await createTimetables(client, assignments);
    await createStudents(client, sectionKeys, demoHash);
    await client.query("COMMIT");
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {}
    throw e;
  } finally {
    client.release();
  }

  const client2 = await pool.connect();
  try {
    await client2.query("BEGIN");
    await createAttendanceAndMarks(client2);
    await createAssignmentsAndSubmissions(client2);
    await createStudentPerformance(client2);
    await createNotificationsSample(client2);
    await client2.query(
      `INSERT INTO app_seed_meta (key) VALUES ($1) ON CONFLICT (key) DO NOTHING`,
      [SEED_KEY]
    );
    await client2.query("COMMIT");
    console.log("[seed-cbse] CBSE India dataset applied. Demo password for new users:", DEMO_PASSWORD);
  } catch (e) {
    try {
      await client2.query("ROLLBACK");
    } catch (_) {}
    console.error("[seed-cbse] Post-seed phase failed:", e.message || e);
    throw e;
  } finally {
    client2.release();
  }
}

function runCbseSeedIfNeeded() {
  if (process.env.SKIP_CBSE_SEED === "true") {
    console.log("[seed-cbse] SKIP_CBSE_SEED=true");
    return Promise.resolve();
  }
  return runCbseSeedInternal().catch((err) => {
    console.error("[seed-cbse] Failed:", err.message || err);
  });
}

if (require.main === module) {
  runCbseSeedInternal()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runCbseSeedIfNeeded, runCbseSeedInternal };

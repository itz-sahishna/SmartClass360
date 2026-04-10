const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { pool, withTransaction } = require("../src/db");

const schemaPath = path.join(__dirname, "schema.sql");

function insert(table, rows, client) {
  if (!rows.length) return Promise.resolve();
  const columns = Object.keys(rows[0]);
  const values = [];
  const params = [];

  rows.forEach((row, rowIndex) => {
    const placeholders = columns.map((column, columnIndex) => {
      params.push(row[column]);
      return `$${rowIndex * columns.length + columnIndex + 1}`;
    });
    values.push(`(${placeholders.join(", ")})`);
  });

  const text = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values.join(
    ", "
  )}`;
  return client.query(text, params);
}

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const departments = [
    { id: "d-cse", name: "Computer Science" },
    { id: "d-ece", name: "Electronics" },
  ];

  const academicYears = [
    { id: "y-cse-1", department_id: "d-cse", year_number: 1, academic_year: "2025-26" },
    { id: "y-cse-2", department_id: "d-cse", year_number: 2, academic_year: "2025-26" },
    { id: "y-cse-3", department_id: "d-cse", year_number: 3, academic_year: "2025-26" },
    { id: "y-cse-4", department_id: "d-cse", year_number: 4, academic_year: "2025-26" },
    { id: "y-ece-1", department_id: "d-ece", year_number: 1, academic_year: "2025-26" },
  ];

  const sections = [
    { id: "sec-cse2-a", year_id: "y-cse-2", class_name: "B.Tech CSE", name: "A" },
    { id: "sec-cse2-b", year_id: "y-cse-2", class_name: "B.Tech CSE", name: "B" },
    { id: "sec-cse3-a", year_id: "y-cse-3", class_name: "B.Tech CSE", name: "A" },
    { id: "sec-cse1-a", year_id: "y-cse-1", class_name: "B.Tech CSE", name: "A" },
  ];

  const users = [
    {
      id: "u1",
      name: "Admin One",
      email: "admin@smartclass.com",
      phone: "1234500001",
      password_hash: passwordHash,
      role: "admin",
      is_blocked: false,
      profile: JSON.stringify({
        designation: "Principal Admin",
        bio: "Oversees institute operations and approvals.",
        timezone: "Asia/Kolkata",
        location: "Hyderabad Campus",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u2",
      name: "Teacher John",
      email: "teacher@smartclass.com",
      phone: "1234500002",
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      profile: JSON.stringify({
        designation: "Assistant Professor",
        bio: "Handles AI, maths, and mentoring.",
        timezone: "Asia/Kolkata",
        location: "Block B",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u5",
      name: "Prof. Clara",
      email: "clara@smartclass.com",
      phone: "1234500005",
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      profile: JSON.stringify({
        designation: "Senior Lecturer",
        bio: "Teaches communication and humanities.",
        timezone: "Asia/Kolkata",
        location: "Block A",
        theme: "light",
        notifications: { email: true, push: false },
      }),
    },
    {
      id: "u3",
      name: "Student Alice",
      email: "student@smartclass.com",
      phone: "1234500003",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Interested in machine learning and product design.",
        timezone: "Asia/Kolkata",
        location: "Hostel A",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u4",
      name: "Student Bob",
      email: "bob@smartclass.com",
      phone: "1234500004",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Enjoys mathematics and database systems.",
        timezone: "Asia/Kolkata",
        location: "Hostel B",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u6",
      name: "Student Carol",
      email: "carol@smartclass.com",
      phone: "1234500006",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Strong analytical reasoning and peer support.",
        timezone: "Asia/Kolkata",
        location: "Day Scholar",
        theme: "light",
        notifications: { email: false, push: true },
      }),
    },
    {
      id: "u7",
      name: "Student David",
      email: "david@smartclass.com",
      phone: "1234500007",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Needs nudges on attendance and deadlines.",
        timezone: "Asia/Kolkata",
        location: "Hostel C",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u8",
      name: "Student Eva",
      email: "eva@smartclass.com",
      phone: "1234500008",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Consistent performer with strong assignment quality.",
        timezone: "Asia/Kolkata",
        location: "Hostel A",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u9",
      name: "Student Frank",
      email: "frank@smartclass.com",
      phone: "1234500009",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Adapting well to first-year coursework.",
        timezone: "Asia/Kolkata",
        location: "Hostel D",
        theme: "light",
        notifications: { email: true, push: false },
      }),
    },
    {
      id: "u10",
      name: "Student Grace",
      email: "grace@smartclass.com",
      phone: "1234500010",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Excellent attendance and fast concept uptake.",
        timezone: "Asia/Kolkata",
        location: "Day Scholar",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u11",
      name: "Student Henry",
      email: "henry@smartclass.com",
      phone: "1234500011",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      profile: JSON.stringify({
        bio: "Requires intervention support for attendance and consistency.",
        timezone: "Asia/Kolkata",
        location: "Hostel E",
        theme: "light",
        notifications: { email: false, push: true },
      }),
    },
  ];

  const admins = [{ id: "admin-1", user_id: "u1" }];

  const teachers = [
    { id: "t1", user_id: "u2", department_id: "d-cse", designation: "Assistant Professor" },
    { id: "t2", user_id: "u5", department_id: "d-cse", designation: "Senior Lecturer" },
  ];

  const students = [
    { id: "s-u3", user_id: "u3", roll_number: "CS-2023-01", section_id: "sec-cse2-a" },
    { id: "s-u4", user_id: "u4", roll_number: "CS-2023-02", section_id: "sec-cse2-a" },
    { id: "s-u6", user_id: "u6", roll_number: "CS-2023-03", section_id: "sec-cse2-a" },
    { id: "s-u7", user_id: "u7", roll_number: "CS-2023-04", section_id: "sec-cse2-a" },
    { id: "s-u8", user_id: "u8", roll_number: "CS-2023-05", section_id: "sec-cse2-b" },
    { id: "s-u9", user_id: "u9", roll_number: "CS-2024-01", section_id: "sec-cse1-a" },
    { id: "s-u10", user_id: "u10", roll_number: "CS-2024-02", section_id: "sec-cse1-a" },
    { id: "s-u11", user_id: "u11", roll_number: "CS-2022-10", section_id: "sec-cse3-a" },
  ];

  const subjects = [
    {
      id: "sub-cs",
      name: "Computer Science",
      code: "CS201",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "Semester 4",
      syllabus: "Data structures, algorithms, problem solving, and practical labs.",
      credits: 4,
    },
    {
      id: "sub-math",
      name: "Mathematics",
      code: "MA201",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "Semester 4",
      syllabus: "Calculus, matrices, numerical methods, and applications.",
      credits: 4,
    },
    {
      id: "sub-db",
      name: "Database Systems",
      code: "DB301",
      department_id: "d-cse",
      year_id: "y-cse-3",
      semester: "Semester 6",
      syllabus: "ER modeling, SQL, normalization, and transactions.",
      credits: 3,
    },
    {
      id: "sub-eng",
      name: "Professional Communication",
      code: "EN201",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "Semester 4",
      syllabus: "Academic writing, presentations, and communication practice.",
      credits: 2,
    },
  ];

  const teacherAssignments = [
    { id: "ta-1", teacher_id: "t1", subject_id: "sub-cs", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-2", teacher_id: "t1", subject_id: "sub-math", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-3", teacher_id: "t1", subject_id: "sub-db", section_id: "sec-cse3-a", academic_year: "2025-26" },
    { id: "ta-4", teacher_id: "t2", subject_id: "sub-eng", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-5", teacher_id: "t1", subject_id: "sub-cs", section_id: "sec-cse2-b", academic_year: "2025-26" },
    { id: "ta-6", teacher_id: "t1", subject_id: "sub-math", section_id: "sec-cse1-a", academic_year: "2025-26" },
  ];

  const timetables = [
    { id: "tt1", teacher_assignment_id: "ta-1", day_of_week: "Monday", start_time: "09:00", end_time: "10:00", room: "Lab 2" },
    { id: "tt2", teacher_assignment_id: "ta-2", day_of_week: "Tuesday", start_time: "10:15", end_time: "11:15", room: "Room 301" },
    { id: "tt3", teacher_assignment_id: "ta-4", day_of_week: "Wednesday", start_time: "11:15", end_time: "12:00", room: "Room 205" },
    { id: "tt4", teacher_assignment_id: "ta-3", day_of_week: "Thursday", start_time: "14:00", end_time: "15:00", room: "Lab 1" },
    { id: "tt5", teacher_assignment_id: "ta-5", day_of_week: "Friday", start_time: "09:00", end_time: "10:00", room: "Lab 3" },
    { id: "tt6", teacher_assignment_id: "ta-6", day_of_week: "Friday", start_time: "10:15", end_time: "11:15", room: "Room 210" },
  ];

  const attendanceSessions = [
    { id: "as-1", teacher_assignment_id: "ta-1", timetable_id: "tt1", date: "2026-04-07", created_by: "t1" },
    { id: "as-2", teacher_assignment_id: "ta-2", timetable_id: "tt2", date: "2026-04-08", created_by: "t1" },
    { id: "as-3", teacher_assignment_id: "ta-4", timetable_id: "tt3", date: "2026-04-08", created_by: "t2" },
    { id: "as-4", teacher_assignment_id: "ta-3", timetable_id: "tt4", date: "2026-04-09", created_by: "t1" },
  ];

  const attendanceRecords = [
    { id: "ar1", session_id: "as-1", student_id: "s-u3", status: "present" },
    { id: "ar2", session_id: "as-1", student_id: "s-u4", status: "present" },
    { id: "ar3", session_id: "as-1", student_id: "s-u6", status: "present" },
    { id: "ar4", session_id: "as-1", student_id: "s-u7", status: "absent" },
    { id: "ar5", session_id: "as-2", student_id: "s-u3", status: "present" },
    { id: "ar6", session_id: "as-2", student_id: "s-u4", status: "present" },
    { id: "ar7", session_id: "as-2", student_id: "s-u6", status: "present" },
    { id: "ar8", session_id: "as-2", student_id: "s-u7", status: "late" },
    { id: "ar9", session_id: "as-3", student_id: "s-u3", status: "present" },
    { id: "ar10", session_id: "as-4", student_id: "s-u11", status: "present" },
  ];

  const marks = [
    { id: "m1", student_id: "s-u3", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 88, max_marks: 100, is_online: false, date: "2026-03-10" },
    { id: "m2", student_id: "s-u3", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "assignment", marks_obtained: 18, max_marks: 20, is_online: false, date: "2026-04-04" },
    { id: "m3", student_id: "s-u3", subject_id: "sub-math", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 95, max_marks: 100, is_online: false, date: "2026-03-11" },
    { id: "m4", student_id: "s-u4", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 71, max_marks: 100, is_online: false, date: "2026-03-10" },
    { id: "m5", student_id: "s-u4", subject_id: "sub-math", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 68, max_marks: 100, is_online: false, date: "2026-03-11" },
    { id: "m6", student_id: "s-u6", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 94, max_marks: 100, is_online: false, date: "2026-03-10" },
    { id: "m7", student_id: "s-u7", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 55, max_marks: 100, is_online: false, date: "2026-03-10" },
    { id: "m8", student_id: "s-u8", subject_id: "sub-cs", teacher_id: "t1", section_id: "sec-cse2-b", exam_type: "mid", marks_obtained: 82, max_marks: 100, is_online: false, date: "2026-03-10" },
    { id: "m9", student_id: "s-u9", subject_id: "sub-math", teacher_id: "t1", section_id: "sec-cse1-a", exam_type: "quiz", marks_obtained: 14, max_marks: 20, is_online: true, date: "2026-04-02" },
    { id: "m10", student_id: "s-u10", subject_id: "sub-math", teacher_id: "t1", section_id: "sec-cse1-a", exam_type: "online_quiz", marks_obtained: 18, max_marks: 20, is_online: true, date: "2026-04-02" },
    { id: "m11", student_id: "s-u11", subject_id: "sub-db", teacher_id: "t1", section_id: "sec-cse3-a", exam_type: "final", marks_obtained: 40, max_marks: 100, is_online: false, date: "2026-03-20" },
  ];

  const assignments = [
    { id: "a1", title: "AI Algorithms Implementation", description: "Build and compare search and optimization algorithms.", subject_id: "sub-cs", teacher_assignment_id: "ta-1", type: "assignment", due_date: "2026-04-10 17:00:00", scheduled_at: "2026-04-01 09:00:00", max_marks: 20 },
    { id: "a2", title: "Calculus Integration Quiz", description: "Timed quiz covering advanced integration problems.", subject_id: "sub-math", teacher_assignment_id: "ta-2", type: "quiz", due_date: "2026-04-11 12:00:00", scheduled_at: "2026-04-09 10:00:00", max_marks: 20 },
    { id: "a3", title: "Normalization Walkthrough", description: "Normalize the supplied schema to 3NF.", subject_id: "sub-db", teacher_assignment_id: "ta-3", type: "assignment", due_date: "2026-04-15 17:00:00", scheduled_at: "2026-04-10 14:00:00", max_marks: 15 },
  ];

  const assignmentQuestions = [
    { id: "q-a2-1", assignment_id: "a2", question_text: "What is the integral of x^2?", question_type: "mcq", correct_option_index: 1, marks: 5, display_order: 1 },
    { id: "q-a2-2", assignment_id: "a2", question_text: "Which technique helps solve integral of sin(x)cos(x)?", question_type: "mcq", correct_option_index: 0, marks: 5, display_order: 2 },
  ];

  const assignmentQuestionOptions = [
    { id: "qo-a2-1-1", question_id: "q-a2-1", option_text: "x^2 / 2 + C", display_order: 0 },
    { id: "qo-a2-1-2", question_id: "q-a2-1", option_text: "x^3 / 3 + C", display_order: 1 },
    { id: "qo-a2-1-3", question_id: "q-a2-1", option_text: "2x + C", display_order: 2 },
    { id: "qo-a2-1-4", question_id: "q-a2-1", option_text: "x^4 / 4 + C", display_order: 3 },
    { id: "qo-a2-2-1", question_id: "q-a2-2", option_text: "Use substitution", display_order: 0 },
    { id: "qo-a2-2-2", question_id: "q-a2-2", option_text: "Use partial fractions", display_order: 1 },
    { id: "qo-a2-2-3", question_id: "q-a2-2", option_text: "Use integration by parts only", display_order: 2 },
    { id: "qo-a2-2-4", question_id: "q-a2-2", option_text: "No technique is needed", display_order: 3 },
  ];

  const materials = [
    { id: "mat-1", title: "AI Search Notes", description: "Reference notes for uninformed and informed search strategies.", subject_id: "sub-cs", teacher_assignment_id: "ta-1", created_by: "t1", file_url: "https://example.com/materials/ai-search-notes.pdf", material_type: "note" },
    { id: "mat-2", title: "Calculus Formula Sheet", description: "Common integration identities and substitution patterns.", subject_id: "sub-math", teacher_assignment_id: "ta-2", created_by: "t1", file_url: "https://example.com/materials/calculus-formulas.pdf", material_type: "pdf" },
  ];

  const submissions = [
    { id: "subm1", assignment_id: "a1", student_id: "s-u3", file_url: null, submitted_at: null, marks: null, status: "pending" },
    { id: "subm2", assignment_id: "a1", student_id: "s-u4", file_url: "https://example.com/u4-a1.pdf", submitted_at: "2026-04-08 18:00:00", marks: null, status: "submitted" },
    { id: "subm3", assignment_id: "a1", student_id: "s-u6", file_url: "https://example.com/u6-a1.pdf", submitted_at: "2026-04-08 17:00:00", marks: 19, status: "graded" },
    { id: "subm4", assignment_id: "a2", student_id: "s-u3", file_url: null, submitted_at: "2026-04-10 10:05:00", marks: 18, status: "graded" },
    { id: "subm5", assignment_id: "a3", student_id: "s-u11", file_url: "https://example.com/u11-db.pdf", submitted_at: "2026-04-12 15:00:00", marks: 10, status: "graded" },
  ];

  const exams = [
    { id: "e1", subject_id: "sub-cs", section_id: "sec-cse2-a", exam_type: "mid", date: "2026-04-20", max_marks: 25 },
    { id: "e2", subject_id: "sub-math", section_id: "sec-cse2-a", exam_type: "mid", date: "2026-04-22", max_marks: 25 },
    { id: "e3", subject_id: "sub-db", section_id: "sec-cse3-a", exam_type: "final", date: "2026-04-25", max_marks: 100 },
  ];

  const notifications = [
    { id: "n1", user_id: "u2", title: "Pending Submission Review", message: "2 assignment submissions still need grading.", type: "alert", is_read: false, action_url: "/teacher/assignments" },
    { id: "n2", user_id: "u2", title: "Attendance Change Request", message: "Alice requested an attendance correction in Computer Science.", type: "request", is_read: false, action_url: "/teacher/attendance" },
    { id: "n3", user_id: "u3", title: "New Assignment Posted", message: "AI Algorithms Implementation has been assigned to your class.", type: "assignment", is_read: false, action_url: "/student/assignments?id=a1" },
    { id: "n4", user_id: "u3", title: "Reminder: Mid Quiz", message: "Calculus Integration Quiz is scheduled tomorrow.", type: "reminder", is_read: false, action_url: "/student/exams" },
    { id: "n5", user_id: "u1", title: "Teacher Profile Request", message: "Teacher John submitted a profile update request.", type: "request", is_read: false, action_url: "/admin/dashboard" },
  ];

  const requests = [
    {
      id: "r1",
      user_id: "u3",
      type: "attendance_change",
      target_id: "ar1",
      old_value: JSON.stringify({ subject: "Computer Science", date: "2026-04-07", status: "present" }),
      new_value: JSON.stringify({ attendance_record_id: "ar1", subject: "Computer Science", date: "2026-04-07", status: "late", note: "Reached a few minutes after the bell." }),
      status: "pending",
      reviewed_by: null,
    },
    {
      id: "r2",
      user_id: "u2",
      type: "profile_update",
      target_id: "u2",
      old_value: JSON.stringify({ location: "Block B" }),
      new_value: JSON.stringify({ profile: { location: "Block B, Room 204" } }),
      status: "pending",
      reviewed_by: null,
    },
  ];

  const performanceRows = [
    {
      id: "perf1",
      student_id: "s-u3",
      subject_id: "sub-cs",
      avg_marks: 88,
      attendance_percentage: 86,
      assignment_score: 90,
      exam_score: 88,
      final_marks: 89,
      past_performance: 84,
      predicted_performance: "Good",
      predicted_grade: "A",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Strong assignment quality", "Stable attendance", "Above-class mid scores"],
        improvements: ["Push database revision further", "Maintain quiz rhythm"],
      }),
    },
    {
      id: "perf2",
      student_id: "s-u7",
      subject_id: "sub-cs",
      avg_marks: 55,
      attendance_percentage: 62,
      assignment_score: 48,
      exam_score: 55,
      final_marks: 52,
      past_performance: 58,
      predicted_performance: "At Risk",
      predicted_grade: "C",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Low attendance trend", "Missed assignment deadlines"],
        improvements: ["Attend all remaining lab sessions", "Complete revision plan with weekly quizzes"],
      }),
    },
  ];

  const auditLogs = [
    {
      id: "log1",
      user_id: "u1",
      action: "seed_database",
      entity: "system",
      old_data: null,
      new_data: JSON.stringify({ status: "initialized" }),
    },
  ];

  await withTransaction(async (client) => {
    await client.query(schemaSql);
    await insert("departments", departments, client);
    await insert("academic_years", academicYears, client);
    await insert("sections", sections, client);
    await insert("users", users, client);
    await insert("admins", admins, client);
    await insert("teachers", teachers, client);
    await insert("students", students, client);
    await insert("subjects", subjects, client);
    await insert("teacher_assignments", teacherAssignments, client);
    await insert("timetables", timetables, client);
    await insert("attendance_sessions", attendanceSessions, client);
    await insert("attendance_records", attendanceRecords, client);
    await insert("marks", marks, client);
    await insert("assignments", assignments, client);
    await insert("assignment_questions", assignmentQuestions, client);
    await insert("assignment_question_options", assignmentQuestionOptions, client);
    await insert("materials", materials, client);
    await insert("submissions", submissions, client);
    await insert("exams", exams, client);
    await insert("notifications", notifications, client);
    await insert("requests", requests, client);
    await insert("student_performance", performanceRows, client);
    await insert("audit_logs", auditLogs, client);
  });

  console.log("Database schema created and seeded.");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

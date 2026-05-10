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

  const text = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${values.join(", ")}`;
  return client.query(text, params);
}

async function main() {
  const passwordHash = await bcrypt.hash("password@123", 10);
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const departments = [
    { id: "d-cse", name: "Computer Science and Engineering" },
    { id: "d-ece", name: "Electronics and Communication Engineering" },
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
    { id: "sec-ece1-a", year_id: "y-ece-1", class_name: "B.Tech ECE", name: "A" },
  ];

  const users = [
    {
      id: "u1",
      name: "Dr. S. Kavitha",
      email: "admin@gmail.com",
      phone: "9849011101",
      password_hash: passwordHash,
      role: "admin",
      is_blocked: false,
      created_at: "2024-06-18 09:00:00",
      profile: JSON.stringify({
        designation: "Principal",
        bio: "Oversees academics, approvals, and institutional operations for the campus.",
        timezone: "Asia/Kolkata",
        location: "Hyderabad",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u2",
      name: "Prof. M. Harish Reddy",
      email: "teacher@gmail.com",
      phone: "9849011102",
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      created_at: "2023-07-02 09:00:00",
      profile: JSON.stringify({
        designation: "Assistant Professor",
        bio: "Handles Data Structures, Java, and mentoring for II Year CSE.",
        timezone: "Asia/Kolkata",
        location: "CSE Block Room 304",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u5",
      name: "Ms. P. Anusha",
      email: "anusha.faculty@smartclass360.edu",
      phone: "9849011105",
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      created_at: "2023-07-10 09:00:00",
      profile: JSON.stringify({
        designation: "Assistant Professor",
        bio: "Teaches DBMS and maintains lab schedules for III Year CSE.",
        timezone: "Asia/Kolkata",
        location: "IT Lab 2",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u12",
      name: "Mrs. K. Deepthi",
      email: "deepthi.faculty@smartclass360.edu",
      phone: "9849011112",
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      created_at: "2024-01-05 09:00:00",
      profile: JSON.stringify({
        designation: "Senior Lecturer",
        bio: "Leads English and soft-skills support for engineering students.",
        timezone: "Asia/Kolkata",
        location: "Humanities Block",
        theme: "light",
        notifications: { email: true, push: false },
      }),
    },
    {
      id: "u3",
      name: "Sai Teja Reddy",
      email: "student@gmail.com",
      phone: "9849011103",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2023-08-18 09:00:00",
      profile: JSON.stringify({
        bio: "Day scholar from Kukatpally, focused on coding contests and full-stack development.",
        timezone: "Asia/Kolkata",
        location: "Hyderabad",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u4",
      name: "Keerthana Nair",
      email: "keerthana.nair23@smartclass360.edu",
      phone: "9849011104",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2023-08-18 09:02:00",
      profile: JSON.stringify({
        bio: "Hosteller with strong performance in mathematics and presentation skills.",
        timezone: "Asia/Kolkata",
        location: "Girls Hostel Block A",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u6",
      name: "Mounika Yadav",
      email: "mounika.yadav23@smartclass360.edu",
      phone: "9849011106",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2023-08-18 09:04:00",
      profile: JSON.stringify({
        bio: "Consistent lab performer who enjoys Java and peer-learning sessions.",
        timezone: "Asia/Kolkata",
        location: "Girls Hostel Block B",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u7",
      name: "Abhinav Goud",
      email: "abhinav.goud23@smartclass360.edu",
      phone: "9849011107",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2023-08-18 09:06:00",
      profile: JSON.stringify({
        bio: "Needs regular attendance follow-up but shows promise in programming labs.",
        timezone: "Asia/Kolkata",
        location: "Boys Hostel Block C",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u8",
      name: "Likhitha Reddy",
      email: "likhitha.reddy23@smartclass360.edu",
      phone: "9849011108",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2023-08-18 09:08:00",
      profile: JSON.stringify({
        bio: "Strong communication and clean note-taking, active in class seminars.",
        timezone: "Asia/Kolkata",
        location: "Warangal",
        theme: "light",
        notifications: { email: true, push: false },
      }),
    },
    {
      id: "u9",
      name: "Vamshi Krishna",
      email: "vamshi.krishna24@smartclass360.edu",
      phone: "9849011109",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2024-08-10 09:00:00",
      profile: JSON.stringify({
        bio: "First-year student adapting well to the CSE foundation subjects.",
        timezone: "Asia/Kolkata",
        location: "Nizamabad",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u10",
      name: "Pranavi Chowdary",
      email: "pranavi.chowdary24@smartclass360.edu",
      phone: "9849011110",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2024-08-10 09:03:00",
      profile: JSON.stringify({
        bio: "Excellent classroom attendance and quick concept uptake in first-year maths.",
        timezone: "Asia/Kolkata",
        location: "Karimnagar",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
    {
      id: "u11",
      name: "Rohith Sai",
      email: "rohith.sai22@smartclass360.edu",
      phone: "9849011111",
      password_hash: passwordHash,
      role: "student",
      is_blocked: false,
      created_at: "2022-08-12 09:00:00",
      profile: JSON.stringify({
        bio: "III Year student preparing for placements while balancing DBMS and OS labs.",
        timezone: "Asia/Kolkata",
        location: "Siddipet",
        theme: "light",
        notifications: { email: true, push: true },
      }),
    },
  ];

  const admins = [{ id: "admin-1", user_id: "u1" }];

  const teachers = [
    { id: "t1", user_id: "u2", department_id: "d-cse", designation: "Assistant Professor" },
    { id: "t2", user_id: "u5", department_id: "d-cse", designation: "Assistant Professor" },
    { id: "t3", user_id: "u12", department_id: "d-cse", designation: "Senior Lecturer" },
  ];

  const students = [
    { id: "s-u3", user_id: "u3", roll_number: "23MH1A05A1", section_id: "sec-cse2-a" },
    { id: "s-u4", user_id: "u4", roll_number: "23MH1A05A2", section_id: "sec-cse2-a" },
    { id: "s-u6", user_id: "u6", roll_number: "23MH1A05A3", section_id: "sec-cse2-a" },
    { id: "s-u7", user_id: "u7", roll_number: "23MH1A05A4", section_id: "sec-cse2-a" },
    { id: "s-u8", user_id: "u8", roll_number: "23MH1A05B1", section_id: "sec-cse2-b" },
    { id: "s-u9", user_id: "u9", roll_number: "24MH1A0501", section_id: "sec-cse1-a" },
    { id: "s-u10", user_id: "u10", roll_number: "24MH1A0502", section_id: "sec-cse1-a" },
    { id: "s-u11", user_id: "u11", roll_number: "22MH1A0561", section_id: "sec-cse3-a" },
  ];

  const subjects = [
    {
      id: "sub-ds",
      name: "Data Structures",
      code: "CS203",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "II-II",
      syllabus: "Stacks, queues, trees, graphs, searching, sorting, and problem solving based on R22 syllabus.",
      credits: 4,
    },
    {
      id: "sub-java",
      name: "Object Oriented Programming through Java",
      code: "CS204",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "II-II",
      syllabus: "Classes, inheritance, collections, exceptions, JDBC basics, and mini-programming exercises.",
      credits: 4,
    },
    {
      id: "sub-db",
      name: "Database Management Systems",
      code: "CS305",
      department_id: "d-cse",
      year_id: "y-cse-3",
      semester: "III-I",
      syllabus: "ER modeling, relational algebra, SQL, normalization, transactions, and PL/SQL.",
      credits: 4,
    },
    {
      id: "sub-eng",
      name: "Professional English",
      code: "HS202",
      department_id: "d-cse",
      year_id: "y-cse-2",
      semester: "II-II",
      syllabus: "Technical communication, presentations, group discussion, and campus-placement communication practice.",
      credits: 2,
    },
    {
      id: "sub-m1",
      name: "Engineering Mathematics-I",
      code: "MA101",
      department_id: "d-cse",
      year_id: "y-cse-1",
      semester: "I-I",
      syllabus: "Matrices, differential equations, multivariable calculus, and engineering applications.",
      credits: 4,
    },
  ];

  const teacherAssignments = [
    { id: "ta-1", teacher_id: "t1", subject_id: "sub-ds", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-2", teacher_id: "t1", subject_id: "sub-java", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-3", teacher_id: "t2", subject_id: "sub-db", section_id: "sec-cse3-a", academic_year: "2025-26" },
    { id: "ta-4", teacher_id: "t3", subject_id: "sub-eng", section_id: "sec-cse2-a", academic_year: "2025-26" },
    { id: "ta-5", teacher_id: "t1", subject_id: "sub-ds", section_id: "sec-cse2-b", academic_year: "2025-26" },
    { id: "ta-6", teacher_id: "t3", subject_id: "sub-m1", section_id: "sec-cse1-a", academic_year: "2025-26" },
  ];

  const timetables = [
    { id: "tt1", teacher_assignment_id: "ta-1", day_of_week: "Monday", start_time: "09:30", end_time: "10:20", room: "CSE-302" },
    { id: "tt2", teacher_assignment_id: "ta-2", day_of_week: "Monday", start_time: "10:20", end_time: "11:10", room: "CSE-302" },
    { id: "tt3", teacher_assignment_id: "ta-4", day_of_week: "Tuesday", start_time: "11:20", end_time: "12:10", room: "Seminar Hall 2" },
    { id: "tt4", teacher_assignment_id: "ta-3", day_of_week: "Wednesday", start_time: "13:00", end_time: "13:50", room: "IT Lab 2" },
    { id: "tt5", teacher_assignment_id: "ta-5", day_of_week: "Thursday", start_time: "09:30", end_time: "10:20", room: "CSE-204" },
    { id: "tt6", teacher_assignment_id: "ta-6", day_of_week: "Friday", start_time: "10:20", end_time: "11:10", room: "Block A-105" },
    { id: "tt7", teacher_assignment_id: "ta-1", day_of_week: "Friday", start_time: "14:40", end_time: "15:30", room: "DS Lab 1" },
  ];

  const attendanceSessions = [
    { id: "as-1", teacher_assignment_id: "ta-1", timetable_id: "tt1", date: "2026-05-04", created_by: "t1" },
    { id: "as-2", teacher_assignment_id: "ta-2", timetable_id: "tt2", date: "2026-05-04", created_by: "t1" },
    { id: "as-3", teacher_assignment_id: "ta-4", timetable_id: "tt3", date: "2026-05-05", created_by: "t3" },
    { id: "as-4", teacher_assignment_id: "ta-3", timetable_id: "tt4", date: "2026-05-06", created_by: "t2" },
    { id: "as-5", teacher_assignment_id: "ta-6", timetable_id: "tt6", date: "2026-05-09", created_by: "t3" },
  ];

  const attendanceRecords = [
    { id: "ar1", session_id: "as-1", student_id: "s-u3", status: "present" },
    { id: "ar2", session_id: "as-1", student_id: "s-u4", status: "present" },
    { id: "ar3", session_id: "as-1", student_id: "s-u6", status: "present" },
    { id: "ar4", session_id: "as-1", student_id: "s-u7", status: "absent" },
    { id: "ar5", session_id: "as-2", student_id: "s-u3", status: "present" },
    { id: "ar6", session_id: "as-2", student_id: "s-u4", status: "late" },
    { id: "ar7", session_id: "as-2", student_id: "s-u6", status: "present" },
    { id: "ar8", session_id: "as-2", student_id: "s-u7", status: "absent" },
    { id: "ar9", session_id: "as-3", student_id: "s-u3", status: "present" },
    { id: "ar10", session_id: "as-3", student_id: "s-u4", status: "present" },
    { id: "ar11", session_id: "as-4", student_id: "s-u11", status: "present" },
    { id: "ar12", session_id: "as-5", student_id: "s-u9", status: "present" },
    { id: "ar13", session_id: "as-5", student_id: "s-u10", status: "present" },
  ];

  const marks = [
    { id: "m1", student_id: "s-u3", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 27, max_marks: 30, is_online: false, date: "2026-03-18" },
    { id: "m2", student_id: "s-u3", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "assignment", marks_obtained: 18, max_marks: 20, is_online: false, date: "2026-04-10" },
    { id: "m3", student_id: "s-u3", subject_id: "sub-java", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 26, max_marks: 30, is_online: false, date: "2026-03-20" },
    { id: "m4", student_id: "s-u4", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 22, max_marks: 30, is_online: false, date: "2026-03-18" },
    { id: "m5", student_id: "s-u4", subject_id: "sub-java", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 21, max_marks: 30, is_online: false, date: "2026-03-20" },
    { id: "m6", student_id: "s-u6", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 28, max_marks: 30, is_online: false, date: "2026-03-18" },
    { id: "m7", student_id: "s-u7", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-a", exam_type: "mid", marks_obtained: 16, max_marks: 30, is_online: false, date: "2026-03-18" },
    { id: "m8", student_id: "s-u8", subject_id: "sub-ds", teacher_id: "t1", section_id: "sec-cse2-b", exam_type: "mid", marks_obtained: 25, max_marks: 30, is_online: false, date: "2026-03-18" },
    { id: "m9", student_id: "s-u9", subject_id: "sub-m1", teacher_id: "t3", section_id: "sec-cse1-a", exam_type: "quiz", marks_obtained: 14, max_marks: 20, is_online: true, date: "2026-04-12" },
    { id: "m10", student_id: "s-u10", subject_id: "sub-m1", teacher_id: "t3", section_id: "sec-cse1-a", exam_type: "online_quiz", marks_obtained: 18, max_marks: 20, is_online: true, date: "2026-04-12" },
    { id: "m11", student_id: "s-u11", subject_id: "sub-db", teacher_id: "t2", section_id: "sec-cse3-a", exam_type: "final", marks_obtained: 72, max_marks: 100, is_online: false, date: "2026-03-28" },
  ];

  const assignments = [
    {
      id: "a1",
      title: "R22 Data Structures Record Submission",
      description: "Submit the record for linked lists, stack applications, and binary tree traversals as per the lab manual.",
      subject_id: "sub-ds",
      teacher_assignment_id: "ta-1",
      type: "assignment",
      due_date: "2026-05-15 17:00:00",
      scheduled_at: "2026-05-10 09:30:00",
      max_marks: 20,
    },
    {
      id: "a2",
      title: "Java Internal Quiz - Collections Framework",
      description: "Timed quiz on ArrayList, HashMap, exception handling, and basic file I/O.",
      subject_id: "sub-java",
      teacher_assignment_id: "ta-2",
      type: "quiz",
      due_date: "2026-05-13 12:00:00",
      scheduled_at: "2026-05-12 10:20:00",
      max_marks: 20,
    },
    {
      id: "a3",
      title: "DBMS Mini Assignment - Normalization and SQL",
      description: "Normalize the given student-result schema to 3NF and write SQL queries for reports.",
      subject_id: "sub-db",
      teacher_assignment_id: "ta-3",
      type: "assignment",
      due_date: "2026-05-18 17:00:00",
      scheduled_at: "2026-05-11 13:00:00",
      max_marks: 15,
    },
  ];

  const assignmentQuestions = [
    {
      id: "q-a2-1",
      assignment_id: "a2",
      question_text: "Which Java collection maintains insertion order and allows duplicates?",
      question_type: "mcq",
      correct_option_index: 0,
      marks: 5,
      display_order: 1,
    },
    {
      id: "q-a2-2",
      assignment_id: "a2",
      question_text: "Which block is always executed whether an exception occurs or not?",
      question_type: "mcq",
      correct_option_index: 2,
      marks: 5,
      display_order: 2,
    },
  ];

  const assignmentQuestionOptions = [
    { id: "qo-a2-1-1", question_id: "q-a2-1", option_text: "ArrayList", display_order: 0 },
    { id: "qo-a2-1-2", question_id: "q-a2-1", option_text: "HashSet", display_order: 1 },
    { id: "qo-a2-1-3", question_id: "q-a2-1", option_text: "TreeMap", display_order: 2 },
    { id: "qo-a2-1-4", question_id: "q-a2-1", option_text: "PriorityQueue", display_order: 3 },
    { id: "qo-a2-2-1", question_id: "q-a2-2", option_text: "try", display_order: 0 },
    { id: "qo-a2-2-2", question_id: "q-a2-2", option_text: "catch", display_order: 1 },
    { id: "qo-a2-2-3", question_id: "q-a2-2", option_text: "finally", display_order: 2 },
    { id: "qo-a2-2-4", question_id: "q-a2-2", option_text: "throw", display_order: 3 },
  ];

  const materials = [
    {
      id: "mat-1",
      title: "Data Structures Unit-III Notes",
      description: "Linked list operations, stack applications, and tree traversals based on the classroom handout.",
      subject_id: "sub-ds",
      teacher_assignment_id: "ta-1",
      created_by: "t1",
      file_url: "https://example.com/materials/jntuh-ds-unit3-notes.pdf",
      material_type: "pdf",
    },
    {
      id: "mat-2",
      title: "Java Collections Quick Revision Sheet",
      description: "Short revision notes for lists, maps, sets, and common interview questions.",
      subject_id: "sub-java",
      teacher_assignment_id: "ta-2",
      created_by: "t1",
      file_url: "https://example.com/materials/java-collections-revision.pdf",
      material_type: "note",
    },
    {
      id: "mat-3",
      title: "DBMS SQL Lab Manual",
      description: "Lab manual with SQL joins, aggregate functions, subqueries, and normalization tasks.",
      subject_id: "sub-db",
      teacher_assignment_id: "ta-3",
      created_by: "t2",
      file_url: "https://example.com/materials/dbms-sql-lab-manual.pdf",
      material_type: "pdf",
    },
  ];

  const submissions = [
    { id: "subm1", assignment_id: "a1", student_id: "s-u3", file_url: null, submitted_at: null, marks: null, status: "pending" },
    { id: "subm2", assignment_id: "a1", student_id: "s-u4", file_url: "https://example.com/submissions/keerthana-ds-record.pdf", submitted_at: "2026-05-12 18:10:00", marks: null, status: "submitted" },
    { id: "subm3", assignment_id: "a1", student_id: "s-u6", file_url: "https://example.com/submissions/mounika-ds-record.pdf", submitted_at: "2026-05-12 16:45:00", marks: 19, status: "graded" },
    { id: "subm4", assignment_id: "a2", student_id: "s-u3", file_url: null, submitted_at: "2026-05-12 10:32:00", marks: 10, status: "graded" },
    { id: "subm5", assignment_id: "a3", student_id: "s-u11", file_url: "https://example.com/submissions/rohith-dbms-mini.pdf", submitted_at: "2026-05-14 15:05:00", marks: 12, status: "graded" },
  ];

  const exams = [
    { id: "e1", subject_id: "sub-ds", section_id: "sec-cse2-a", exam_type: "mid", date: "2026-05-20", max_marks: 30 },
    { id: "e2", subject_id: "sub-java", section_id: "sec-cse2-a", exam_type: "mid", date: "2026-05-23", max_marks: 30 },
    { id: "e3", subject_id: "sub-db", section_id: "sec-cse3-a", exam_type: "final", date: "2026-05-28", max_marks: 100 },
  ];

  const notifications = [
    { id: "n1", user_id: "u2", title: "Pending Record Review", message: "2 Data Structures record submissions are waiting for grading.", type: "alert", is_read: false, action_url: "/teacher/assignments" },
    { id: "n2", user_id: "u2", title: "Attendance Correction Request", message: "Sai Teja Reddy requested an attendance correction for Data Structures.", type: "request", is_read: false, action_url: "/teacher/attendance" },
    { id: "n3", user_id: "u3", title: "New Record Submission Posted", message: "R22 Data Structures Record Submission has been assigned to your section.", type: "assignment", is_read: false, action_url: "/student/assignments?id=a1" },
    { id: "n4", user_id: "u3", title: "Reminder: Java Quiz", message: "Java Internal Quiz - Collections Framework is scheduled for tomorrow during 2nd period.", type: "reminder", is_read: false, action_url: "/student/exams" },
    { id: "n5", user_id: "u1", title: "Teacher Profile Request", message: "Prof. M. Harish Reddy submitted a profile update request.", type: "request", is_read: false, action_url: "/admin/dashboard" },
  ];

  const requests = [
    {
      id: "r1",
      user_id: "u3",
      type: "attendance_change",
      target_id: "ar1",
      old_value: JSON.stringify({ subject: "Data Structures", date: "2026-05-04", status: "present" }),
      new_value: JSON.stringify({ attendance_record_id: "ar1", subject: "Data Structures", date: "2026-05-04", status: "late", note: "Reached class after the morning bus delay." }),
      status: "pending",
      reviewed_by: null,
    },
    {
      id: "r2",
      user_id: "u2",
      type: "profile_update",
      target_id: "u2",
      old_value: JSON.stringify({ location: "CSE Block Room 304" }),
      new_value: JSON.stringify({ profile: { location: "CSE Block Room 306" } }),
      status: "pending",
      reviewed_by: null,
    },
  ];

  const performanceRows = [
    {
      id: "perf1",
      student_id: "s-u3",
      subject_id: "sub-ds",
      avg_marks: 88,
      attendance_percentage: 92,
      assignment_score: 90,
      exam_score: 88,
      final_marks: 86,
      past_performance: 84,
      predicted_performance: "Good",
      predicted_grade: "A",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Strong record work", "High class attendance", "Stable internal marks"],
        improvements: ["Continue weekly coding practice", "Attempt one extra DS problem set every weekend"],
      }),
    },
    {
      id: "perf2",
      student_id: "s-u4",
      subject_id: "sub-ds",
      avg_marks: 72,
      attendance_percentage: 80,
      assignment_score: 74,
      exam_score: 72,
      final_marks: 70,
      past_performance: 71,
      predicted_performance: "Average",
      predicted_grade: "B",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Decent attendance", "Average internal consistency"],
        improvements: ["Focus on graph problems", "Revise stack and queue applications before the next mid"],
      }),
    },
    {
      id: "perf3",
      student_id: "s-u7",
      subject_id: "sub-ds",
      avg_marks: 54,
      attendance_percentage: 63,
      assignment_score: 48,
      exam_score: 53,
      final_marks: 52,
      past_performance: 57,
      predicted_performance: "At Risk",
      predicted_grade: "C",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Low attendance trend", "Incomplete assignment preparation", "Below-section average in internals"],
        improvements: ["Attend every remaining period", "Complete the record with mentor review", "Take one practice quiz every three days"],
      }),
    },
    {
      id: "perf4",
      student_id: "s-u11",
      subject_id: "sub-db",
      avg_marks: 74,
      attendance_percentage: 83,
      assignment_score: 78,
      exam_score: 71,
      final_marks: 72,
      past_performance: 69,
      predicted_performance: "Average",
      predicted_grade: "B",
      pass_prediction: true,
      insights: JSON.stringify({
        factors: ["Improved SQL practice", "Regular lab participation"],
        improvements: ["Strengthen transaction-management concepts", "Revise normalization and indexing before placement tests"],
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
      new_data: JSON.stringify({ status: "initialized_with_telangana_style_seed_data" }),
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

  console.log("Database schema created and seeded with Telangana-style academic data.");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

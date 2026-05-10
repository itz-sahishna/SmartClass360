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

function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) return 0;
  return Number(
    (values.reduce((total, value) => total + Number(value || 0), 0) / values.length).toFixed(2)
  );
}

function toFriendlyGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getPerformanceBand(index) {
  if (index < 5) return "good";
  if (index < 15) return "average";
  return "atrisk";
}

function statusForBand(band, subjectIndex, sessionIndex, studentIndex) {
  const pivot = (studentIndex + subjectIndex + sessionIndex) % 10;
  if (band === "good") {
    return pivot < 8 ? "present" : "late";
  }
  if (band === "average") {
    if (pivot < 6) return "present";
    if (pivot < 8) return "late";
    return "absent";
  }
  if (pivot < 4) return "present";
  if (pivot < 6) return "late";
  return "absent";
}

function scoreSeed(band, subjectIndex, studentIndex) {
  const wobble = ((studentIndex + 1) * (subjectIndex + 3)) % 5;
  if (band === "good") return 84 + wobble * 2;
  if (band === "average") return 66 + wobble * 2;
  return 46 + wobble * 2;
}

function subjectDescription(subjectName) {
  if (subjectName.includes("Data Structures")) return "Core programming and problem-solving based on the JNTUH R22 structure.";
  if (subjectName.includes("Java")) return "Object oriented programming, collections, exceptions, and file handling.";
  if (subjectName.includes("Discrete")) return "Logic, relations, graphs, and combinatorics for computing.";
  if (subjectName.includes("Computer Organization")) return "Instruction formats, memory, processor logic, and I/O organization.";
  if (subjectName.includes("English")) return "Technical communication, presentations, and placement readiness.";
  if (subjectName.includes("Database")) return "SQL, normalization, transactions, indexing, and PL/SQL.";
  if (subjectName.includes("Operating Systems")) return "Processes, synchronization, memory management, and file systems.";
  if (subjectName.includes("Algorithms")) return "Greedy, divide and conquer, dynamic programming, and complexity analysis.";
  if (subjectName.includes("Networks")) return "OSI layers, routing, transport, and network applications.";
  if (subjectName.includes("Software Engineering")) return "Requirement analysis, UML, testing, maintenance, and project planning.";
  if (subjectName.includes("Signals")) return "Signal classification, transforms, and communication-system applications.";
  if (subjectName.includes("Network Theory")) return "Circuit laws, theorems, transient analysis, and AC network models.";
  if (subjectName.includes("Electronic Devices")) return "Diodes, BJTs, FETs, biasing, and amplifier basics.";
  if (subjectName.includes("Digital Logic")) return "Boolean algebra, combinational logic, sequential circuits, and FSMs.";
  return "Probability, random variables, and statistical methods for engineering.";
}

async function main() {
  const passwordHash = await bcrypt.hash("password@123", 10);
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  const departments = [
    { id: "d-cse", name: "Computer Science and Engineering" },
    { id: "d-ece", name: "Electronics and Communication Engineering" },
  ];

  const academicYears = [
    { id: "y-cse-2", department_id: "d-cse", year_number: 2, academic_year: "2025-26" },
    { id: "y-cse-3", department_id: "d-cse", year_number: 3, academic_year: "2025-26" },
    { id: "y-ece-2", department_id: "d-ece", year_number: 2, academic_year: "2025-26" },
  ];

  const subjectGroups = {
    cse2: [
      { name: "Data Structures", code: "CS203", semester: "II-II", credits: 4 },
      { name: "Object Oriented Programming through Java", code: "CS204", semester: "II-II", credits: 4 },
      { name: "Discrete Mathematics", code: "MA203", semester: "II-II", credits: 4 },
      { name: "Computer Organization", code: "CS205", semester: "II-II", credits: 3 },
      { name: "Professional English", code: "HS202", semester: "II-II", credits: 2 },
    ],
    cse3: [
      { name: "Database Management Systems", code: "CS301", semester: "III-I", credits: 4 },
      { name: "Operating Systems", code: "CS302", semester: "III-I", credits: 4 },
      { name: "Design and Analysis of Algorithms", code: "CS303", semester: "III-I", credits: 4 },
      { name: "Computer Networks", code: "CS304", semester: "III-I", credits: 4 },
      { name: "Software Engineering", code: "CS305", semester: "III-I", credits: 3 },
    ],
    ece2: [
      { name: "Signals and Systems", code: "EC203", semester: "II-II", credits: 4 },
      { name: "Network Theory", code: "EC204", semester: "II-II", credits: 4 },
      { name: "Electronic Devices and Circuits", code: "EC205", semester: "II-II", credits: 4 },
      { name: "Digital Logic Design", code: "EC206", semester: "II-II", credits: 3 },
      { name: "Probability and Random Variables", code: "MA204", semester: "II-II", credits: 3 },
    ],
  };

  const sectionConfigs = [
    {
      id: "sec-cse2-a",
      year_id: "y-cse-2",
      class_name: "B.Tech CSE",
      name: "A",
      programCode: "05",
      admissionYear: "24",
      rollStart: 1,
      groupKey: "cse2",
      departmentId: "d-cse",
      label: "CSE II-A",
    },
    {
      id: "sec-cse2-b",
      year_id: "y-cse-2",
      class_name: "B.Tech CSE",
      name: "B",
      programCode: "05",
      admissionYear: "24",
      rollStart: 21,
      groupKey: "cse2",
      departmentId: "d-cse",
      label: "CSE II-B",
    },
    {
      id: "sec-cse3-a",
      year_id: "y-cse-3",
      class_name: "B.Tech CSE",
      name: "A",
      programCode: "05",
      admissionYear: "23",
      rollStart: 41,
      groupKey: "cse3",
      departmentId: "d-cse",
      label: "CSE III-A",
    },
    {
      id: "sec-cse3-b",
      year_id: "y-cse-3",
      class_name: "B.Tech CSE",
      name: "B",
      programCode: "05",
      admissionYear: "23",
      rollStart: 61,
      groupKey: "cse3",
      departmentId: "d-cse",
      label: "CSE III-B",
    },
    {
      id: "sec-ece2-a",
      year_id: "y-ece-2",
      class_name: "B.Tech ECE",
      name: "A",
      programCode: "04",
      admissionYear: "24",
      rollStart: 1,
      groupKey: "ece2",
      departmentId: "d-ece",
      label: "ECE II-A",
    },
    {
      id: "sec-ece2-b",
      year_id: "y-ece-2",
      class_name: "B.Tech ECE",
      name: "B",
      programCode: "04",
      admissionYear: "24",
      rollStart: 21,
      groupKey: "ece2",
      departmentId: "d-ece",
      label: "ECE II-B",
    },
  ];

  const sections = sectionConfigs.map(({ id, year_id, class_name, name }) => ({
    id,
    year_id,
    class_name,
    name,
  }));

  const teacherRoster = [
    { name: "Prof. M. Harish Reddy", email: "teacher@gmail.com", designation: "Assistant Professor", department_id: "d-cse", location: "CSE Block Room 304" },
    { name: "Dr. P. Anusha", email: "p.anusha@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "CSE Block Room 207" },
    { name: "Dr. K. Srinivas", email: "k.srinivas@smartclass360.edu", designation: "Associate Professor", department_id: "d-cse", location: "CSE Block Room 311" },
    { name: "Ms. T. Niharika", email: "t.niharika@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "CSE Block Room 209" },
    { name: "Mrs. S. Deepthi", email: "s.deepthi@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-cse", location: "Humanities Block" },
    { name: "Dr. V. Sandeep", email: "v.sandeep@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "CSE Block Room 306" },
    { name: "Prof. J. Madhavi", email: "j.madhavi@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "CSE Block Room 210" },
    { name: "Mr. R. Chaitanya", email: "r.chaitanya@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "Maths Wing" },
    { name: "Dr. A. Naveen Kumar", email: "a.naveen@smartclass360.edu", designation: "Associate Professor", department_id: "d-cse", location: "CSE Block Room 319" },
    { name: "Ms. P. Bhavani", email: "p.bhavani@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-cse", location: "Language Lab" },
    { name: "Dr. Y. Praveen", email: "y.praveen@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "DBMS Lab" },
    { name: "Mrs. M. Soujanya", email: "m.soujanya@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "OS Lab" },
    { name: "Prof. N. Rajashekar", email: "n.rajashekar@smartclass360.edu", designation: "Associate Professor", department_id: "d-cse", location: "Algorithms Room" },
    { name: "Mr. D. Kiran", email: "d.kiran@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "Networks Lab" },
    { name: "Ms. G. Meghana", email: "g.meghana@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-cse", location: "Project Hall" },
    { name: "Dr. P. Ravali", email: "p.ravali@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "DBMS Lab 2" },
    { name: "Mr. T. Harsha", email: "t.harsha@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "Systems Lab" },
    { name: "Mrs. B. Sindhu", email: "b.sindhu@smartclass360.edu", designation: "Assistant Professor", department_id: "d-cse", location: "Algorithms Lab" },
    { name: "Dr. C. Mahender", email: "c.mahender@smartclass360.edu", designation: "Associate Professor", department_id: "d-cse", location: "Networks Hall" },
    { name: "Ms. L. Swathi", email: "l.swathi@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-cse", location: "Placement Block" },
    { name: "Dr. N. Rajeshwari", email: "n.rajeshwari@smartclass360.edu", designation: "Associate Professor", department_id: "d-ece", location: "ECE Block Room 101" },
    { name: "Prof. M. Venkatesh", email: "m.venkatesh@smartclass360.edu", designation: "Assistant Professor", department_id: "d-ece", location: "ECE Block Room 103" },
    { name: "Mr. K. Uday", email: "k.uday@smartclass360.edu", designation: "Assistant Professor", department_id: "d-ece", location: "ECE Block Room 105" },
    { name: "Mrs. T. Sirisha", email: "t.sirisha@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-ece", location: "ECE Block Room 110" },
    { name: "Dr. P. Yaswanth", email: "p.yaswanth@smartclass360.edu", designation: "Associate Professor", department_id: "d-ece", location: "ECE Block Room 115" },
    { name: "Ms. R. Harini", email: "r.harini@smartclass360.edu", designation: "Assistant Professor", department_id: "d-ece", location: "Signals Lab" },
    { name: "Prof. D. Prasad", email: "d.prasad@smartclass360.edu", designation: "Assistant Professor", department_id: "d-ece", location: "Circuits Lab" },
    { name: "Mrs. A. Keerthi", email: "a.keerthi@smartclass360.edu", designation: "Senior Lecturer", department_id: "d-ece", location: "Digital Lab" },
    { name: "Dr. S. Ramesh", email: "s.ramesh@smartclass360.edu", designation: "Associate Professor", department_id: "d-ece", location: "ECE Block Room 121" },
    { name: "Mr. V. Lokesh", email: "v.lokesh@smartclass360.edu", designation: "Assistant Professor", department_id: "d-ece", location: "Maths Room E2" },
  ];

  const users = [
    {
      id: "u-admin-1",
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
  ];

  const admins = [{ id: "admin-1", user_id: "u-admin-1" }];
  const teachers = [];

  teacherRoster.forEach((teacher, index) => {
    const userId = index === 0 ? "u-teacher-default" : `u-teacher-${String(index + 1).padStart(2, "0")}`;
    const teacherId = index === 0 ? "t-default" : `t-${String(index + 1).padStart(2, "0")}`;
    users.push({
      id: userId,
      name: teacher.name,
      email: teacher.email,
      phone: String(9849011200 + index),
      password_hash: passwordHash,
      role: "teacher",
      is_blocked: false,
      created_at: `2023-07-${String((index % 20) + 1).padStart(2, "0")} 09:00:00`,
      profile: JSON.stringify({
        designation: teacher.designation,
        bio: `${teacher.designation} handling academic delivery for ${teacher.department_id === "d-cse" ? "CSE" : "ECE"} classes.`,
        timezone: "Asia/Kolkata",
        location: teacher.location,
        theme: "light",
        notifications: { email: true, push: true },
      }),
    });
    teachers.push({
      id: teacherId,
      user_id: userId,
      department_id: teacher.department_id,
      designation: teacher.designation,
    });
    teacher.user_id = userId;
    teacher.teacher_id = teacherId;
  });

  const subjects = [];
  const subjectMap = new Map();
  Object.entries(subjectGroups).forEach(([groupKey, groupSubjects]) => {
    const yearId = groupKey === "cse2" ? "y-cse-2" : groupKey === "cse3" ? "y-cse-3" : "y-ece-2";
    const departmentId = groupKey.startsWith("cse") ? "d-cse" : "d-ece";
    groupSubjects.forEach((subject, index) => {
      const id = `sub-${groupKey}-${index + 1}`;
      const row = {
        id,
        name: subject.name,
        code: subject.code,
        department_id: departmentId,
        year_id: yearId,
        semester: subject.semester,
        syllabus: subjectDescription(subject.name),
        credits: subject.credits,
      };
      subjects.push(row);
      subjectMap.set(`${groupKey}:${index}`, row);
    });
  });

  const studentFirstNames = [
    "Sai Teja",
    "Keerthana",
    "Mounika",
    "Abhinav",
    "Likhitha",
    "Vamshi Krishna",
    "Pranavi",
    "Rohith Sai",
    "Nikhil",
    "Sravani",
    "Harsha Vardhan",
    "Bhavya Sri",
    "Manideep",
    "Sneha",
    "Akshay",
    "Divya",
    "Chaitanya",
    "Ananya",
    "Karthikeya",
    "Lasya",
  ];
  const sectionSurnames = ["Reddy", "Naik", "Yadav", "Goud", "Chowdary", "Begum"];
  const locationPool = ["Hyderabad", "Warangal", "Karimnagar", "Nizamabad", "Siddipet", "Khammam"];

  const students = [];
  const studentUsersMeta = [];

  sectionConfigs.forEach((section, sectionIndex) => {
    for (let i = 0; i < 20; i += 1) {
      const globalIndex = sectionIndex * 20 + i + 1;
      const userId = globalIndex === 1 ? "u-student-default" : `u-student-${String(globalIndex).padStart(3, "0")}`;
      const studentId = globalIndex === 1 ? "s-default" : `s-${String(globalIndex).padStart(3, "0")}`;
      const rollNumber = `${section.admissionYear}MH1A${section.programCode}${String(section.rollStart + i).padStart(2, "0")}`;
      const name = globalIndex === 1
        ? "Sai Teja Reddy"
        : `${studentFirstNames[i]} ${sectionSurnames[sectionIndex]}`;
      const email = globalIndex === 1
        ? "student@gmail.com"
        : `${slug(studentFirstNames[i])}.${slug(sectionSurnames[sectionIndex])}${section.admissionYear}${String(i + 1).padStart(2, "0")}@smartclass360.edu`;
      const phone = String(9700000000 + globalIndex);
      const location = locationPool[(sectionIndex + i) % locationPool.length];
      const band = getPerformanceBand(i);

      users.push({
        id: userId,
        name,
        email,
        phone,
        password_hash: passwordHash,
        role: "student",
        is_blocked: false,
        created_at: `${section.admissionYear}-08-${String((i % 20) + 1).padStart(2, "0")} 09:${String((i % 6) * 5).padStart(2, "0")}:00`,
        profile: JSON.stringify({
          bio: `${section.label} student preparing through the Telangana engineering curriculum with focus on labs and internals.`,
          timezone: "Asia/Kolkata",
          location,
          theme: "light",
          notifications: { email: true, push: true },
        }),
      });

      students.push({
        id: studentId,
        user_id: userId,
        roll_number: rollNumber,
        section_id: section.id,
      });

      studentUsersMeta.push({
        user_id: userId,
        student_id: studentId,
        section_id: section.id,
        section_label: section.label,
        groupKey: section.groupKey,
        localIndex: i,
        globalIndex,
        band,
        roll_number: rollNumber,
        name,
      });
    }
  });

  const teacherAssignments = [];
  const teacherAssignmentMeta = [];
  let teacherCursor = 0;

  sectionConfigs.forEach((section) => {
    subjectGroups[section.groupKey].forEach((subjectTemplate, subjectIndex) => {
      const teacher = teacherRoster[teacherCursor];
      const subject = subjectMap.get(`${section.groupKey}:${subjectIndex}`);
      const assignmentId = `ta-${String(teacherCursor + 1).padStart(2, "0")}`;
      const row = {
        id: assignmentId,
        teacher_id: teacher.teacher_id,
        subject_id: subject.id,
        section_id: section.id,
        academic_year: "2025-26",
      };
      teacherAssignments.push(row);
      teacherAssignmentMeta.push({
        ...row,
        subject,
        section,
        teacher,
        subjectIndex,
      });
      teacherCursor += 1;
    });
  });

  const timetableSlots = [
    { day: "Monday", start: "09:30", end: "10:20" },
    { day: "Tuesday", start: "10:20", end: "11:10" },
    { day: "Wednesday", start: "11:20", end: "12:10" },
    { day: "Thursday", start: "13:00", end: "13:50" },
    { day: "Friday", start: "14:40", end: "15:30" },
  ];
  const dayDates = {
    Monday: ["2026-04-27", "2026-05-04"],
    Tuesday: ["2026-04-28", "2026-05-05"],
    Wednesday: ["2026-04-29", "2026-05-06"],
    Thursday: ["2026-04-30", "2026-05-07"],
    Friday: ["2026-05-01", "2026-05-08"],
  };

  const timetables = [];
  const attendanceSessions = [];
  const attendanceRecords = [];
  const materials = [];
  const assignments = [];
  const assignmentQuestions = [];
  const assignmentQuestionOptions = [];
  const submissions = [];
  const exams = [];
  const notifications = [
    {
      id: "n-admin-1",
      user_id: "u-admin-1",
      title: "Faculty setup complete",
      message: "Teacher assignments and section mapping are loaded for the semester.",
      type: "alert",
      is_read: false,
      action_url: "/admin/users",
    },
  ];
  const requests = [
    {
      id: "r1",
      user_id: "u-student-default",
      type: "attendance_change",
      target_id: "ar-0001",
      old_value: JSON.stringify({ subject: "Data Structures", status: "present", date: "2026-04-27" }),
      new_value: JSON.stringify({ attendance_record_id: "ar-0001", status: "late", note: "Requested correction after transport delay." }),
      status: "pending",
      reviewed_by: null,
    },
    {
      id: "r2",
      user_id: "u-teacher-default",
      type: "profile_update",
      target_id: "u-teacher-default",
      old_value: JSON.stringify({ location: "CSE Block Room 304" }),
      new_value: JSON.stringify({ profile: { location: "CSE Block Room 306" } }),
      status: "pending",
      reviewed_by: null,
    },
  ];

  teacherAssignmentMeta.forEach((item, assignmentIndex) => {
    const slot = timetableSlots[item.subjectIndex];
    const timetableId = `tt-${String(assignmentIndex + 1).padStart(2, "0")}`;
    timetables.push({
      id: timetableId,
      teacher_assignment_id: item.id,
      day_of_week: slot.day,
      start_time: slot.start,
      end_time: slot.end,
      room: `${item.section.class_name.includes("ECE") ? "ECE" : "CSE"}-${item.section.name}${item.subjectIndex + 1}`,
    });

    dayDates[slot.day].forEach((date, sessionIndex) => {
      const sessionId = `as-${String(attendanceSessions.length + 1).padStart(4, "0")}`;
      attendanceSessions.push({
        id: sessionId,
        teacher_assignment_id: item.id,
        timetable_id: timetableId,
        date,
        created_by: item.teacher.teacher_id,
      });

      const sectionStudents = studentUsersMeta.filter((student) => student.section_id === item.section.id);
      sectionStudents.forEach((student) => {
        attendanceRecords.push({
          id: `ar-${String(attendanceRecords.length + 1).padStart(4, "0")}`,
          session_id: sessionId,
          student_id: student.student_id,
          status: statusForBand(student.band, item.subjectIndex, sessionIndex, student.localIndex),
        });
      });
    });

    materials.push({
      id: `mat-${String(materials.length + 1).padStart(3, "0")}`,
      title: `${item.subject.name} Handout - ${item.section.label}`,
      description: `${item.subject.name} study material prepared according to the JNTUH style internal syllabus flow.`,
      subject_id: item.subject.id,
      teacher_assignment_id: item.id,
      created_by: item.teacher.teacher_id,
      file_url: `https://example.com/materials/${slug(item.subject.name)}-${slug(item.section.label)}.pdf`,
      material_type: item.subjectIndex % 2 === 0 ? "pdf" : "note",
    });

    const assignmentId = `a-${String(assignments.length + 1).padStart(3, "0")}`;
    const assignmentType = item.subjectIndex % 2 === 0 ? "assignment" : "quiz";
    assignments.push({
      id: assignmentId,
      title: assignmentType === "quiz"
        ? `${item.subject.name} Internal Quiz - ${item.section.label}`
        : `${item.subject.name} Record / Assignment - ${item.section.label}`,
      description: assignmentType === "quiz"
        ? `Timed internal quiz for ${item.subject.name} aligned to the current unit plan.`
        : `Prepare and submit the written assignment/record for ${item.subject.name} as per the faculty instructions.`,
      subject_id: item.subject.id,
      teacher_assignment_id: item.id,
      type: assignmentType,
      due_date: `2026-05-${String(12 + item.subjectIndex).padStart(2, "0")} 17:00:00`,
      scheduled_at: `2026-05-${String(8 + item.subjectIndex).padStart(2, "0")} 09:00:00`,
      max_marks: assignmentType === "quiz" ? 20 : 20,
    });

    if (assignmentType === "quiz") {
      for (let questionIndex = 0; questionIndex < 2; questionIndex += 1) {
        const questionId = `q-${assignmentId}-${questionIndex + 1}`;
        assignmentQuestions.push({
          id: questionId,
          assignment_id: assignmentId,
          question_text: `${item.subject.name}: question ${questionIndex + 1} for ${item.section.label}`,
          question_type: "mcq",
          correct_option_index: questionIndex % 4,
          marks: 5,
          display_order: questionIndex + 1,
        });
        ["Option A", "Option B", "Option C", "Option D"].forEach((label, optionIndex) => {
          assignmentQuestionOptions.push({
            id: `qo-${questionId}-${optionIndex + 1}`,
            question_id: questionId,
            option_text: `${label} - ${item.subject.name}`,
            display_order: optionIndex,
          });
        });
      }
    }

    exams.push({
      id: `e-${String(exams.length + 1).padStart(3, "0")}`,
      subject_id: item.subject.id,
      section_id: item.section.id,
      exam_type: item.section.groupKey === "cse3" ? "final" : "mid",
      date: `2026-05-${String(20 + item.subjectIndex).padStart(2, "0")}`,
      max_marks: item.section.groupKey === "cse3" ? 100 : 30,
    });

    const sectionStudents = studentUsersMeta.filter((student) => student.section_id === item.section.id);
    sectionStudents.forEach((student) => {
      const submissionStatus = assignmentType === "quiz"
        ? (student.localIndex < 14 ? "graded" : student.localIndex < 18 ? "submitted" : "pending")
        : (student.localIndex < 12 ? "graded" : student.localIndex < 17 ? "submitted" : "pending");
      const submissionMarks = submissionStatus === "graded"
        ? clamp(Math.round(scoreSeed(student.band, item.subjectIndex, student.localIndex) / 5), 8, 20)
        : null;
      submissions.push({
        id: `subm-${String(submissions.length + 1).padStart(4, "0")}`,
        assignment_id: assignmentId,
        student_id: student.student_id,
        file_url: assignmentType === "assignment" && submissionStatus !== "pending"
          ? `https://example.com/submissions/${slug(student.roll_number)}-${slug(item.subject.name)}.pdf`
          : null,
        submitted_text: assignmentType === "assignment" && submissionStatus !== "pending"
          ? `${item.subject.name} record submitted by ${student.name}.`
          : null,
        answers: JSON.stringify(assignmentType === "quiz" ? { [`q-${assignmentId}-1`]: 0, [`q-${assignmentId}-2`]: 1 } : {}),
        submitted_at: submissionStatus === "pending"
          ? null
          : `2026-05-${String(10 + item.subjectIndex).padStart(2, "0")} 15:${String((student.localIndex % 6) * 5).padStart(2, "0")}:00`,
        marks: submissionMarks,
        status: submissionStatus,
      });
    });
  });

  const marks = [];
  const markSummary = new Map();

  function pushMark(mark) {
    marks.push(mark);
    const key = `${mark.student_id}:${mark.subject_id}`;
    const current = markSummary.get(key) || [];
    current.push(mark);
    markSummary.set(key, current);
  }

  studentUsersMeta.forEach((student) => {
    const section = sectionConfigs.find((item) => item.id === student.section_id);
    subjectGroups[section.groupKey].forEach((subjectTemplate, subjectIndex) => {
      const subject = subjectMap.get(`${section.groupKey}:${subjectIndex}`);
      const teacherAssignment = teacherAssignmentMeta.find(
        (item) => item.section.id === section.id && item.subject.id === subject.id
      );
      const baseScore = scoreSeed(student.band, subjectIndex, student.localIndex);
      const midMarks = clamp(Math.round((baseScore / 100) * 30), 11, 30);
      const assignmentMarks = clamp(Math.round((baseScore / 100) * 20), 7, 20);

      pushMark({
        id: `m-${String(marks.length + 1).padStart(5, "0")}`,
        student_id: student.student_id,
        subject_id: subject.id,
        teacher_id: teacherAssignment.teacher.teacher_id,
        section_id: section.id,
        exam_type: "mid",
        marks_obtained: midMarks,
        max_marks: 30,
        is_online: false,
        date: "2026-03-18",
      });

      pushMark({
        id: `m-${String(marks.length + 1).padStart(5, "0")}`,
        student_id: student.student_id,
        subject_id: subject.id,
        teacher_id: teacherAssignment.teacher.teacher_id,
        section_id: section.id,
        exam_type: "assignment",
        marks_obtained: assignmentMarks,
        max_marks: 20,
        is_online: false,
        date: "2026-04-10",
      });

      if (section.groupKey === "cse3") {
        pushMark({
          id: `m-${String(marks.length + 1).padStart(5, "0")}`,
          student_id: student.student_id,
          subject_id: subject.id,
          teacher_id: teacherAssignment.teacher.teacher_id,
          section_id: section.id,
          exam_type: "final",
          marks_obtained: clamp(Math.round((baseScore / 100) * 100), 40, 96),
          max_marks: 100,
          is_online: false,
          date: "2026-03-28",
        });
      }

      if (subjectIndex % 2 === 1) {
        pushMark({
          id: `m-${String(marks.length + 1).padStart(5, "0")}`,
          student_id: student.student_id,
          subject_id: subject.id,
          teacher_id: teacherAssignment.teacher.teacher_id,
          section_id: section.id,
          exam_type: "online_quiz",
          marks_obtained: clamp(Math.round((baseScore / 100) * 20), 6, 20),
          max_marks: 20,
          is_online: true,
          date: "2026-04-22",
        });
      }
    });
  });

  const performanceRows = [];
  markSummary.forEach((studentSubjectMarks, key) => {
    const [studentId, subjectId] = key.split(":");
    const student = studentUsersMeta.find((item) => item.student_id === studentId);
    const attendanceForSubject = attendanceRecords.filter((record) => {
      const session = attendanceSessions.find((item) => item.id === record.session_id);
      const assignment = teacherAssignmentMeta.find((item) => item.id === session.teacher_assignment_id);
      return record.student_id === studentId && assignment.subject.id === subjectId;
    });
    const presentCount = attendanceForSubject.filter((record) => record.status === "present").length;
    const attendancePct = attendanceForSubject.length
      ? Number(((presentCount / attendanceForSubject.length) * 100).toFixed(2))
      : 0;
    const assignmentScore = average(
      studentSubjectMarks
        .filter((mark) => ["assignment", "quiz", "online_quiz"].includes(mark.exam_type))
        .map((mark) => (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100)
    );
    const examScore = average(
      studentSubjectMarks
        .filter((mark) => mark.exam_type === "mid")
        .map((mark) => (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100)
    );
    const finalScore = average(
      studentSubjectMarks
        .filter((mark) => mark.exam_type === "final")
        .map((mark) => (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100)
    ) || average(
      studentSubjectMarks.map((mark) => (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100)
    );
    const avgMarks = average(
      studentSubjectMarks.map((mark) => (Number(mark.marks_obtained) / Number(mark.max_marks)) * 100)
    );
    const predictedPerformance = avgMarks >= 80 ? "Good" : avgMarks >= 60 ? "Average" : "At Risk";
    performanceRows.push({
      id: `perf-${String(performanceRows.length + 1).padStart(4, "0")}`,
      student_id: studentId,
      subject_id: subjectId,
      avg_marks: avgMarks,
      attendance_percentage: attendancePct,
      assignment_score: assignmentScore,
      exam_score: examScore,
      final_marks: finalScore,
      past_performance: clamp(avgMarks - (student.band === "good" ? 3 : student.band === "average" ? 1 : -2), 35, 95),
      predicted_performance: predictedPerformance,
      predicted_grade: toFriendlyGrade(avgMarks),
      pass_prediction: avgMarks >= 50,
      insights: JSON.stringify({
        factors:
          predictedPerformance === "Good"
            ? ["High internal marks", "Strong attendance discipline", "Consistent classroom engagement"]
            : predictedPerformance === "Average"
            ? ["Moderate consistency", "Needs sharper revision before internals", "Attendance is serviceable but can improve"]
            : ["Low attendance trend", "Weak assignment completion", "Needs structured faculty follow-up"],
        improvements:
          predictedPerformance === "Good"
            ? ["Keep solving previous internal papers", "Maintain lab record quality"]
            : predictedPerformance === "Average"
            ? ["Revise unit-wise notes weekly", "Attend extra problem-solving sessions"]
            : ["Improve attendance immediately", "Use mentor-led revision and complete every pending record"],
      }),
    });
  });

  const auditLogs = [
    {
      id: "log1",
      user_id: "u-admin-1",
      action: "seed_database",
      entity: "system",
      old_data: null,
      new_data: JSON.stringify({
        total_students: students.length,
        total_teachers: teachers.length,
        sections: sectionConfigs.length,
        note: "Telangana engineering college style dataset loaded",
      }),
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

  console.log("Database schema created and seeded with 120 students, 30 teachers, and Telangana-style academic data.");
  await pool.end();
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});

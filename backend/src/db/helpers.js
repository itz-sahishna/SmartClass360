const { randomUUID } = require("crypto");
const { query } = require("./index");

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function getUserByIdentifier(identifier) {
  const result = await query(
    `
      SELECT u.*,
             s.roll_number,
             s.section_id,
             sec.name AS section_name,
             sec.class_name,
             ay.year_number,
             ay.academic_year,
             d_student.id AS student_department_id,
             d_student.name AS student_department_name,
             s.id AS student_id,
             t.id AS teacher_id,
             t.department_id AS teacher_department_id,
             t.designation,
             d_teacher.name AS teacher_department_name,
             a.id AS admin_id
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN academic_years ay ON ay.id = sec.year_id
      LEFT JOIN departments d_student ON d_student.id = ay.department_id
      LEFT JOIN teachers t ON t.user_id = u.id
      LEFT JOIN departments d_teacher ON d_teacher.id = t.department_id
      LEFT JOIN admins a ON a.user_id = u.id
      WHERE u.email = $1 OR u.phone = $1 OR s.roll_number = $1
      LIMIT 1
    `,
    [identifier]
  );

  return normalizeUser(result.rows[0] || null);
}

async function getUserById(userId) {
  const result = await query(
    `
      SELECT u.*,
             s.roll_number,
             s.section_id,
             sec.name AS section_name,
             sec.class_name,
             ay.year_number,
             ay.academic_year,
             d_student.id AS student_department_id,
             d_student.name AS student_department_name,
             s.id AS student_id,
             t.id AS teacher_id,
             t.department_id AS teacher_department_id,
             t.designation,
             d_teacher.name AS teacher_department_name,
             a.id AS admin_id
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN sections sec ON sec.id = s.section_id
      LEFT JOIN academic_years ay ON ay.id = sec.year_id
      LEFT JOIN departments d_student ON d_student.id = ay.department_id
      LEFT JOIN teachers t ON t.user_id = u.id
      LEFT JOIN departments d_teacher ON d_teacher.id = t.department_id
      LEFT JOIN admins a ON a.user_id = u.id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  return normalizeUser(result.rows[0] || null);
}

async function getTeacherByUserId(userId) {
  const result = await query(
    `
      SELECT t.*, d.name AS department_name
      FROM teachers t
      JOIN departments d ON d.id = t.department_id
      WHERE t.user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
}

async function getStudentByUserId(userId) {
  const result = await query(
    `
      SELECT s.*,
             sec.name AS section_name,
             sec.class_name,
             ay.year_number,
             ay.academic_year,
             d.name AS department_name
      FROM students s
      JOIN sections sec ON sec.id = s.section_id
      JOIN academic_years ay ON ay.id = sec.year_id
      JOIN departments d ON d.id = ay.department_id
      WHERE s.user_id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
}

function normalizeUser(row) {
  if (!row) return null;

  const profile = parseJson(row.profile, {
    notifications: { email: true, push: true },
    theme: "light",
  });

  return {
    ...row,
    department: row.teacher_department_name || row.student_department_name || null,
    department_id: row.teacher_department_id || row.student_department_id || null,
    profile: {
      notifications: { email: true, push: true },
      theme: "light",
      ...profile,
    },
  };
}

function toFriendlyGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function average(values) {
  if (!values.length) return 0;
  return Number(
    (values.reduce((total, value) => total + Number(value || 0), 0) / values.length).toFixed(2)
  );
}

module.exports = {
  randomUUID,
  parseJson,
  getUserByIdentifier,
  getUserById,
  getTeacherByUserId,
  getStudentByUserId,
  normalizeUser,
  toFriendlyGrade,
  average,
};

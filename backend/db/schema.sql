DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS student_performance CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS assignment_question_options CASCADE;
DROP TABLE IF EXISTS assignment_questions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS timetables CASCADE;
DROP TABLE IF EXISTS teacher_assignments CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE academic_years (
  id TEXT PRIMARY KEY,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  year_number INTEGER NOT NULL CHECK (year_number BETWEEN 1 AND 6),
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (department_id, year_number, academic_year)
);

CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  year_id TEXT NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_name VARCHAR(40) NOT NULL,
  name VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (year_id, class_name, name)
);

CREATE TABLE teachers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id),
  designation VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  roll_number VARCHAR(50) NOT NULL UNIQUE,
  section_id TEXT NOT NULL REFERENCES sections(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(30) NOT NULL UNIQUE,
  department_id TEXT NOT NULL REFERENCES departments(id),
  year_id TEXT NOT NULL REFERENCES academic_years(id),
  semester VARCHAR(30),
  syllabus TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  academic_year VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (teacher_id, subject_id, section_id, academic_year)
);

CREATE TABLE timetables (
  id TEXT PRIMARY KEY,
  teacher_assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
  day_of_week VARCHAR(12) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(60),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE attendance_sessions (
  id TEXT PRIMARY KEY,
  teacher_assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
  timetable_id TEXT NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  created_by TEXT NOT NULL REFERENCES teachers(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (timetable_id, date)
);

CREATE TABLE attendance_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, student_id)
);

CREATE TABLE marks (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES teachers(id),
  section_id TEXT NOT NULL REFERENCES sections(id),
  exam_type VARCHAR(30) NOT NULL CHECK (exam_type IN ('mid', 'final', 'assignment', 'quiz', 'online_quiz')),
  marks_obtained NUMERIC(6,2) NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL,
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, subject_id, teacher_id, section_id, exam_type, date)
);

CREATE TABLE assignments (
  id TEXT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('assignment', 'quiz')),
  due_date TIMESTAMP NOT NULL,
  scheduled_at TIMESTAMP,
  max_marks NUMERIC(6,2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_questions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq')),
  correct_option_index INTEGER,
  marks NUMERIC(6,2) NOT NULL DEFAULT 1,
  display_order INTEGER NOT NULL
);

CREATE TABLE assignment_question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

CREATE TABLE materials (
  id TEXT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_assignment_id TEXT NOT NULL REFERENCES teacher_assignments(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  file_url TEXT,
  material_type VARCHAR(40) NOT NULL DEFAULT 'note',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  file_url TEXT,
  submitted_text TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMP,
  marks NUMERIC(6,2),
  status VARCHAR(30) NOT NULL CHECK (status IN ('submitted', 'pending', 'graded')),
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL CHECK (type IN ('profile_update', 'attendance_change')),
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE TABLE student_performance (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  avg_marks NUMERIC(6,2) NOT NULL,
  attendance_percentage NUMERIC(6,2) NOT NULL,
  assignment_score NUMERIC(6,2) NOT NULL,
  exam_score NUMERIC(6,2) NOT NULL,
  final_marks NUMERIC(6,2) NOT NULL,
  past_performance NUMERIC(6,2) NOT NULL,
  predicted_performance VARCHAR(20) NOT NULL,
  predicted_grade VARCHAR(5) NOT NULL,
  pass_prediction BOOLEAN NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (student_id, subject_id)
);

CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('mid', 'final')),
  date DATE NOT NULL,
  max_marks NUMERIC(6,2) NOT NULL
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity VARCHAR(120) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_section ON students(section_id);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_assignments(subject_id);
CREATE INDEX idx_timetables_assignment_day ON timetables(teacher_assignment_id, day_of_week);
CREATE INDEX idx_attendance_sessions_assignment_date ON attendance_sessions(teacher_assignment_id, date DESC);
CREATE INDEX idx_marks_student_subject ON marks(student_id, subject_id);
CREATE INDEX idx_marks_subject_section_type ON marks(subject_id, section_id, exam_type);
CREATE INDEX idx_assignments_assignment_lookup ON assignments(teacher_assignment_id, due_date DESC);
CREATE INDEX idx_materials_assignment_created ON materials(teacher_assignment_id, created_at DESC);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_requests_status ON requests(status, created_at DESC);
CREATE INDEX idx_student_performance_student_generated ON student_performance(student_id, generated_at DESC);

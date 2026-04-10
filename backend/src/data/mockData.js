const bcrypt = require("bcrypt");

const mockPasswordHash = bcrypt.hashSync("password123", 10);

const users = [
  {
    id: "u1",
    name: "Admin One",
    email: "admin@smartclass.com",
    password_hash: mockPasswordHash,
    role: "admin",
    phone: "1234500001",
    roll_number: null,
    is_blocked: false,
    department: "Administration",
    year: null,
    joined_at: "2023-06-05",
    profile: {
      designation: "Principal Admin",
      bio: "Oversees institutional planning, operations, and academic delivery.",
      timezone: "Asia/Kolkata",
      location: "Hyderabad Campus",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u2",
    name: "Teacher John",
    email: "teacher@smartclass.com",
    password_hash: mockPasswordHash,
    role: "teacher",
    phone: "1234500002",
    roll_number: null,
    is_blocked: false,
    department: "Computer Science",
    year: null,
    joined_at: "2024-01-10",
    profile: {
      designation: "Assistant Professor",
      bio: "Focuses on AI, algorithms, and student mentoring.",
      timezone: "Asia/Kolkata",
      location: "Block B, Room 204",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u5",
    name: "Prof. Clara",
    email: "clara@smartclass.com",
    password_hash: mockPasswordHash,
    role: "teacher",
    phone: "1234500005",
    roll_number: null,
    is_blocked: false,
    department: "Humanities",
    year: null,
    joined_at: "2023-08-19",
    profile: {
      designation: "Senior Lecturer",
      bio: "Teaches academic writing and communication skills.",
      timezone: "Asia/Kolkata",
      location: "Block A, Room 112",
      theme: "light",
      notifications: {
        email: true,
        push: false,
      },
    },
  },
  {
    id: "u3",
    name: "Student Alice",
    email: "student@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500003",
    roll_number: "CS-2023-01",
    is_blocked: false,
    department: "Computer Science",
    year: 2023,
    joined_at: "2023-07-02",
    profile: {
      designation: "Student",
      bio: "Interested in machine learning and product design.",
      timezone: "Asia/Kolkata",
      location: "Hostel A",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u4",
    name: "Student Bob",
    email: "bob@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500004",
    roll_number: "CS-2023-02",
    is_blocked: false,
    department: "Computer Science",
    year: 2023,
    joined_at: "2023-07-02",
    profile: {
      designation: "Student",
      bio: "Enjoys mathematics and database systems.",
      timezone: "Asia/Kolkata",
      location: "Hostel B",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u6",
    name: "Student Carol",
    email: "carol@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500006",
    roll_number: "CS-2023-03",
    is_blocked: false,
    department: "Computer Science",
    year: 2023,
    joined_at: "2023-07-02",
    profile: {
      designation: "Student",
      bio: "Strong in analytical reasoning and tutoring peers.",
      timezone: "Asia/Kolkata",
      location: "Day Scholar",
      theme: "light",
      notifications: {
        email: false,
        push: true,
      },
    },
  },
  {
    id: "u7",
    name: "Student David",
    email: "david@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500007",
    roll_number: "CS-2023-04",
    is_blocked: false,
    department: "Computer Science",
    year: 2023,
    joined_at: "2023-07-02",
    profile: {
      designation: "Student",
      bio: "Needs regular nudges on attendance and deadlines.",
      timezone: "Asia/Kolkata",
      location: "Hostel C",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u8",
    name: "Student Eva",
    email: "eva@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500008",
    roll_number: "CS-2023-05",
    is_blocked: false,
    department: "Computer Science",
    year: 2023,
    joined_at: "2023-07-02",
    profile: {
      designation: "Student",
      bio: "Consistent performer with strong assignment quality.",
      timezone: "Asia/Kolkata",
      location: "Hostel A",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u9",
    name: "Student Frank",
    email: "frank@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500009",
    roll_number: "CS-2024-01",
    is_blocked: false,
    department: "Computer Science",
    year: 2024,
    joined_at: "2024-07-01",
    profile: {
      designation: "Student",
      bio: "Adapting well to first-year coursework.",
      timezone: "Asia/Kolkata",
      location: "Hostel D",
      theme: "light",
      notifications: {
        email: true,
        push: false,
      },
    },
  },
  {
    id: "u10",
    name: "Student Grace",
    email: "grace@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500010",
    roll_number: "CS-2024-02",
    is_blocked: false,
    department: "Computer Science",
    year: 2024,
    joined_at: "2024-07-01",
    profile: {
      designation: "Student",
      bio: "Excellent attendance and fast concept uptake.",
      timezone: "Asia/Kolkata",
      location: "Day Scholar",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  },
  {
    id: "u11",
    name: "Student Henry",
    email: "henry@smartclass.com",
    password_hash: mockPasswordHash,
    role: "student",
    phone: "1234500011",
    roll_number: "CS-2022-10",
    is_blocked: false,
    department: "Computer Science",
    year: 2022,
    joined_at: "2022-07-02",
    profile: {
      designation: "Student",
      bio: "Requires intervention support for attendance and consistency.",
      timezone: "Asia/Kolkata",
      location: "Hostel E",
      theme: "light",
      notifications: {
        email: false,
        push: true,
      },
    },
  },
];

const subjects = [
  {
    id: "s1",
    name: "Computer Science",
    code: "CS101",
    teacher_id: "u2",
    credits: 4,
    schedule: "Mon, Wed, Thu",
    room: "Lab 2",
  },
  {
    id: "s2",
    name: "Mathematics",
    code: "MA101",
    teacher_id: "u2",
    credits: 4,
    schedule: "Tue, Thu",
    room: "Room 301",
  },
  {
    id: "s3",
    name: "Database Systems",
    code: "DB201",
    teacher_id: "u2",
    credits: 3,
    schedule: "Mon, Fri",
    room: "Lab 1",
  },
  {
    id: "s4",
    name: "English",
    code: "EN101",
    teacher_id: "u5",
    credits: 2,
    schedule: "Wed, Fri",
    room: "Room 205",
  },
];

const enrollments = [
  { student_id: "u3", subject_id: "s1" },
  { student_id: "u3", subject_id: "s2" },
  { student_id: "u3", subject_id: "s3" },
  { student_id: "u3", subject_id: "s4" },
  { student_id: "u4", subject_id: "s1" },
  { student_id: "u4", subject_id: "s2" },
  { student_id: "u4", subject_id: "s3" },
  { student_id: "u6", subject_id: "s1" },
  { student_id: "u6", subject_id: "s2" },
  { student_id: "u6", subject_id: "s3" },
  { student_id: "u7", subject_id: "s1" },
  { student_id: "u7", subject_id: "s2" },
  { student_id: "u7", subject_id: "s3" },
  { student_id: "u8", subject_id: "s1" },
  { student_id: "u8", subject_id: "s2" },
  { student_id: "u8", subject_id: "s3" },
  { student_id: "u9", subject_id: "s1" },
  { student_id: "u9", subject_id: "s2" },
  { student_id: "u10", subject_id: "s1" },
  { student_id: "u10", subject_id: "s2" },
  { student_id: "u11", subject_id: "s1" },
  { student_id: "u11", subject_id: "s3" },
];

const attendance = [
  {
    student_id: "u3",
    monthly: [
      { month: "Aug", percentage: 78 },
      { month: "Sep", percentage: 82 },
      { month: "Oct", percentage: 88 },
      { month: "Nov", percentage: 75 },
      { month: "Dec", percentage: 84 },
      { month: "Jan", percentage: 90 },
      { month: "Feb", percentage: 82 },
      { month: "Mar", percentage: 85 },
    ],
    subjects: [
      { subject_id: "s1", present: 42, total: 48 },
      { subject_id: "s2", present: 45, total: 50 },
      { subject_id: "s3", present: 28, total: 40 },
      { subject_id: "s4", present: 38, total: 44 },
    ],
  },
  {
    student_id: "u4",
    monthly: [
      { month: "Aug", percentage: 72 },
      { month: "Sep", percentage: 74 },
      { month: "Oct", percentage: 79 },
      { month: "Nov", percentage: 76 },
      { month: "Dec", percentage: 78 },
      { month: "Jan", percentage: 81 },
      { month: "Feb", percentage: 75 },
      { month: "Mar", percentage: 77 },
    ],
    subjects: [
      { subject_id: "s1", present: 36, total: 48 },
      { subject_id: "s2", present: 41, total: 50 },
      { subject_id: "s3", present: 27, total: 40 },
    ],
  },
  {
    student_id: "u6",
    monthly: [
      { month: "Aug", percentage: 84 },
      { month: "Sep", percentage: 87 },
      { month: "Oct", percentage: 89 },
      { month: "Nov", percentage: 90 },
      { month: "Dec", percentage: 92 },
      { month: "Jan", percentage: 93 },
      { month: "Feb", percentage: 94 },
      { month: "Mar", percentage: 95 },
    ],
    subjects: [
      { subject_id: "s1", present: 44, total: 48 },
      { subject_id: "s2", present: 47, total: 50 },
      { subject_id: "s3", present: 37, total: 40 },
    ],
  },
  {
    student_id: "u7",
    monthly: [
      { month: "Aug", percentage: 60 },
      { month: "Sep", percentage: 58 },
      { month: "Oct", percentage: 65 },
      { month: "Nov", percentage: 61 },
      { month: "Dec", percentage: 59 },
      { month: "Jan", percentage: 63 },
      { month: "Feb", percentage: 62 },
      { month: "Mar", percentage: 60 },
    ],
    subjects: [
      { subject_id: "s1", present: 29, total: 48 },
      { subject_id: "s2", present: 31, total: 50 },
      { subject_id: "s3", present: 22, total: 40 },
    ],
  },
  {
    student_id: "u8",
    monthly: [
      { month: "Aug", percentage: 80 },
      { month: "Sep", percentage: 82 },
      { month: "Oct", percentage: 85 },
      { month: "Nov", percentage: 84 },
      { month: "Dec", percentage: 86 },
      { month: "Jan", percentage: 88 },
      { month: "Feb", percentage: 89 },
      { month: "Mar", percentage: 90 },
    ],
    subjects: [
      { subject_id: "s1", present: 43, total: 48 },
      { subject_id: "s2", present: 46, total: 50 },
      { subject_id: "s3", present: 34, total: 40 },
    ],
  },
  {
    student_id: "u9",
    monthly: [
      { month: "Aug", percentage: 76 },
      { month: "Sep", percentage: 78 },
      { month: "Oct", percentage: 79 },
      { month: "Nov", percentage: 81 },
      { month: "Dec", percentage: 82 },
      { month: "Jan", percentage: 84 },
      { month: "Feb", percentage: 83 },
      { month: "Mar", percentage: 85 },
    ],
    subjects: [
      { subject_id: "s1", present: 37, total: 48 },
      { subject_id: "s2", present: 42, total: 50 },
    ],
  },
  {
    student_id: "u10",
    monthly: [
      { month: "Aug", percentage: 85 },
      { month: "Sep", percentage: 88 },
      { month: "Oct", percentage: 90 },
      { month: "Nov", percentage: 92 },
      { month: "Dec", percentage: 91 },
      { month: "Jan", percentage: 93 },
      { month: "Feb", percentage: 95 },
      { month: "Mar", percentage: 94 },
    ],
    subjects: [
      { subject_id: "s1", present: 45, total: 48 },
      { subject_id: "s2", present: 48, total: 50 },
    ],
  },
  {
    student_id: "u11",
    monthly: [
      { month: "Aug", percentage: 55 },
      { month: "Sep", percentage: 53 },
      { month: "Oct", percentage: 51 },
      { month: "Nov", percentage: 57 },
      { month: "Dec", percentage: 49 },
      { month: "Jan", percentage: 54 },
      { month: "Feb", percentage: 52 },
      { month: "Mar", percentage: 50 },
    ],
    subjects: [
      { subject_id: "s1", present: 25, total: 48 },
      { subject_id: "s3", present: 20, total: 40 },
    ],
  },
];

const marks = [
  { student_id: "u3", subject_id: "s1", marks: 88, class_average: 74 },
  { student_id: "u3", subject_id: "s2", marks: 95, class_average: 70 },
  { student_id: "u3", subject_id: "s3", marks: 71, class_average: 66 },
  { student_id: "u3", subject_id: "s4", marks: 87, class_average: 72 },
  { student_id: "u4", subject_id: "s1", marks: 71, class_average: 74 },
  { student_id: "u4", subject_id: "s2", marks: 68, class_average: 70 },
  { student_id: "u4", subject_id: "s3", marks: 63, class_average: 66 },
  { student_id: "u6", subject_id: "s1", marks: 94, class_average: 74 },
  { student_id: "u6", subject_id: "s2", marks: 96, class_average: 70 },
  { student_id: "u6", subject_id: "s3", marks: 89, class_average: 66 },
  { student_id: "u7", subject_id: "s1", marks: 55, class_average: 74 },
  { student_id: "u7", subject_id: "s2", marks: 58, class_average: 70 },
  { student_id: "u7", subject_id: "s3", marks: 49, class_average: 66 },
  { student_id: "u8", subject_id: "s1", marks: 82, class_average: 74 },
  { student_id: "u8", subject_id: "s2", marks: 84, class_average: 70 },
  { student_id: "u8", subject_id: "s3", marks: 76, class_average: 66 },
  { student_id: "u9", subject_id: "s1", marks: 73, class_average: 74 },
  { student_id: "u9", subject_id: "s2", marks: 69, class_average: 70 },
  { student_id: "u10", subject_id: "s1", marks: 91, class_average: 74 },
  { student_id: "u10", subject_id: "s2", marks: 93, class_average: 70 },
  { student_id: "u11", subject_id: "s1", marks: 42, class_average: 74 },
  { student_id: "u11", subject_id: "s3", marks: 40, class_average: 66 },
];

const progressHistory = {
  u3: [
    { month: "Aug", cs: 75, math: 80, db: 60, english: 78 },
    { month: "Sep", cs: 78, math: 85, db: 62, english: 80 },
    { month: "Oct", cs: 82, math: 88, db: 65, english: 82 },
    { month: "Nov", cs: 80, math: 90, db: 68, english: 84 },
    { month: "Dec", cs: 84, math: 92, db: 70, english: 85 },
    { month: "Jan", cs: 86, math: 93, db: 70, english: 86 },
    { month: "Feb", cs: 87, math: 94, db: 71, english: 86 },
    { month: "Mar", cs: 88, math: 95, db: 71, english: 87 },
  ],
};

const assignments = [
  {
    id: "a1",
    title: "AI Algorithms Implementation",
    subject_id: "s1",
    due_date: "2026-04-10",
    created_by: "u2",
    max_marks: 20,
    description: "Build and compare search and optimization algorithms.",
  },
  {
    id: "a2",
    title: "Calculus Integration Problems",
    subject_id: "s2",
    due_date: "2026-04-05",
    created_by: "u2",
    max_marks: 20,
    description: "Solve advanced integration sets and explain each method used.",
  },
  {
    id: "a3",
    title: "ER Diagram Design",
    subject_id: "s3",
    due_date: "2026-03-28",
    created_by: "u2",
    max_marks: 15,
    description: "Design an ER model for a library management system.",
  },
  {
    id: "a4",
    title: "Essay: Technology in Education",
    subject_id: "s4",
    due_date: "2026-03-20",
    created_by: "u5",
    max_marks: 15,
    description: "Write a structured essay on how AI changes classrooms.",
  },
];

const submissions = [
  { assignment_id: "a1", student_id: "u3", status: "pending", marks: null, submitted_at: null },
  { assignment_id: "a1", student_id: "u4", status: "submitted", marks: null, submitted_at: "2026-04-08" },
  { assignment_id: "a1", student_id: "u6", status: "submitted", marks: null, submitted_at: "2026-04-08" },
  { assignment_id: "a1", student_id: "u7", status: "pending", marks: null, submitted_at: null },
  { assignment_id: "a1", student_id: "u8", status: "graded", marks: 18, submitted_at: "2026-04-07" },
  { assignment_id: "a2", student_id: "u3", status: "submitted", marks: 18, submitted_at: "2026-04-04" },
  { assignment_id: "a2", student_id: "u4", status: "graded", marks: 16, submitted_at: "2026-04-04" },
  { assignment_id: "a3", student_id: "u3", status: "graded", marks: 12, submitted_at: "2026-03-27" },
  { assignment_id: "a4", student_id: "u3", status: "graded", marks: 14, submitted_at: "2026-03-19" },
];

const materials = [
  { id: "m1", subject_id: "s1", title: "Greedy vs Dynamic Programming", type: "PDF", uploaded_by: "u2", posted_at: "2026-04-01" },
  { id: "m2", subject_id: "s2", title: "Integration Cheat Sheet", type: "Notes", uploaded_by: "u2", posted_at: "2026-03-30" },
  { id: "m3", subject_id: "s3", title: "Normalization Walkthrough", type: "Slides", uploaded_by: "u2", posted_at: "2026-03-26" },
  { id: "m4", subject_id: "s4", title: "Essay Structure Examples", type: "PDF", uploaded_by: "u5", posted_at: "2026-03-15" },
];

const exams = [
  { id: "e1", subject_id: "s1", type: "Midterm", date: "2026-04-20", status: "upcoming", max_marks: 25 },
  { id: "e2", subject_id: "s2", type: "Midterm", date: "2026-04-22", status: "upcoming", max_marks: 25 },
  { id: "e3", subject_id: "s3", type: "Unit Test 1", date: "2026-03-12", status: "completed", max_marks: 25 },
];

const notifications = [
  {
    id: "n1",
    audience: "teacher",
    user_id: "u2",
    type: "submission",
    title: "New Assignment Submission",
    message: "8 students submitted AI Algorithms Implementation.",
    time: "1 hour ago",
    read: false,
  },
  {
    id: "n2",
    audience: "teacher",
    user_id: "u2",
    type: "alert",
    title: "At-Risk Student Alert",
    message: "Henry (CS-2022-10) shows declining attendance and marks.",
    time: "3 hours ago",
    read: false,
  },
  {
    id: "n3",
    audience: "student",
    user_id: "u3",
    type: "assignment",
    title: "New Assignment Posted",
    message: "AI Algorithms Implementation has been posted for Computer Science.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n4",
    audience: "student",
    user_id: "u3",
    type: "result",
    title: "Exam Result Published",
    message: "Your Mathematics Unit Test 1 result is now available.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "n5",
    audience: "student",
    user_id: "u3",
    type: "attendance",
    title: "Attendance Alert",
    message: "Your attendance in Database Systems is below 75%.",
    time: "2 days ago",
    read: true,
  },
];

const profileRequests = [
  {
    id: "r1",
    user_id: "u3",
    user_name: "Student Alice",
    role: "student",
    type: "Profile Update",
    request: "Update phone number and hostel address",
    status: "pending",
    created_at: "2026-04-08",
  },
  {
    id: "r2",
    user_id: "u2",
    user_name: "Teacher John",
    role: "teacher",
    type: "Subject Allocation",
    request: "Add AI elective to next semester workload",
    status: "reviewing",
    created_at: "2026-04-07",
  },
];

const teacherSchedule = {
  u2: [
    { slot: "09:00 - 10:00", subject: "Computer Science", room: "Lab 2", day: "Today" },
    { slot: "10:15 - 11:15", subject: "Mathematics", room: "Room 301", day: "Today" },
    { slot: "14:00 - 15:00", subject: "Database Systems", room: "Lab 1", day: "Tomorrow" },
  ],
};

const teacherReminders = {
  u2: [
    { id: "tr1", title: "Review 8 pending submissions", priority: "high" },
    { id: "tr2", title: "Finalize midterm paper by Friday", priority: "medium" },
    { id: "tr3", title: "Call guardian for Henry", priority: "high" },
  ],
};

const studentReminders = {
  u3: [
    { id: "sr1", title: "Submit AI Assignment", due: "Tomorrow", subject: "Computer Science" },
    { id: "sr2", title: "Midterm Exam Registration", due: "Next Week", subject: "All Subjects" },
    { id: "sr3", title: "Revise normalization before quiz", due: "Today", subject: "Database Systems" },
  ],
};

const timetable = {
  u3: {
    Monday: [
      { time: "09:00 - 10:00", subject: "Computer Science", teacher: "Teacher John", room: "Lab 2" },
      { time: "10:00 - 11:00", subject: "Mathematics", teacher: "Teacher John", room: "Room 301" },
      { time: "11:00 - 12:00", subject: "English", teacher: "Prof. Clara", room: "Room 205" },
      { time: "14:00 - 15:00", subject: "Database Systems", teacher: "Teacher John", room: "Lab 1" },
    ],
    Tuesday: [
      { time: "09:00 - 10:00", subject: "Mathematics", teacher: "Teacher John", room: "Room 301" },
      { time: "14:00 - 15:00", subject: "Computer Science", teacher: "Teacher John", room: "Lab 2" },
    ],
    Wednesday: [
      { time: "09:00 - 10:00", subject: "Computer Science", teacher: "Teacher John", room: "Lab 2" },
      { time: "10:00 - 11:00", subject: "Database Systems", teacher: "Teacher John", room: "Lab 1" },
      { time: "11:00 - 12:00", subject: "English", teacher: "Prof. Clara", room: "Room 205" },
    ],
    Thursday: [
      { time: "09:00 - 10:00", subject: "Mathematics", teacher: "Teacher John", room: "Room 301" },
      { time: "14:00 - 15:00", subject: "Computer Science", teacher: "Teacher John", room: "Lab 2" },
    ],
    Friday: [
      { time: "09:00 - 10:00", subject: "Database Systems", teacher: "Teacher John", room: "Lab 1" },
      { time: "11:00 - 12:00", subject: "English", teacher: "Prof. Clara", room: "Room 205" },
    ],
  },
};

function sanitizeUser(user) {
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function findUserById(userId) {
  return users.find((user) => user.id === userId);
}

function findUserByIdentifier(identifier) {
  return users.find(
    (user) =>
      user.email === identifier ||
      user.phone === identifier ||
      user.roll_number === identifier
  );
}

function createUser(payload) {
  const id = `u${users.length + 1}`;
  const newUser = {
    id,
    name: payload.name,
    email: payload.email,
    password_hash: bcrypt.hashSync(payload.password || "password123", 10),
    role: payload.role,
    phone: payload.phone || "",
    roll_number: payload.roll_number || null,
    is_blocked: false,
    department: payload.department || "General",
    year: payload.year || null,
    joined_at: new Date().toISOString().slice(0, 10),
    profile: {
      designation: payload.role === "teacher" ? "Faculty" : payload.role === "admin" ? "Administrator" : "Student",
      bio: payload.bio || "",
      timezone: "Asia/Kolkata",
      location: payload.location || "",
      theme: "light",
      notifications: {
        email: true,
        push: true,
      },
    },
  };

  users.push(newUser);
  return sanitizeUser(newUser);
}

function updateUser(userId, payload) {
  const user = findUserById(userId);
  if (!user) return null;

  user.name = payload.name ?? user.name;
  user.email = payload.email ?? user.email;
  user.phone = payload.phone ?? user.phone;
  user.role = payload.role ?? user.role;
  user.roll_number = payload.roll_number ?? user.roll_number;
  user.department = payload.department ?? user.department;
  user.year = payload.year ?? user.year;

  if (payload.password) {
    user.password_hash = bcrypt.hashSync(payload.password, 10);
  }

  return sanitizeUser(user);
}

function deleteUser(userId) {
  const index = users.findIndex((user) => user.id === userId);
  if (index === -1) return false;
  users.splice(index, 1);
  return true;
}

function toggleUserBlock(userId) {
  const user = findUserById(userId);
  if (!user) return null;
  user.is_blocked = !user.is_blocked;
  return sanitizeUser(user);
}

function updateProfile(userId, payload) {
  const user = findUserById(userId);
  if (!user) return null;

  user.name = payload.name ?? user.name;
  user.email = payload.email ?? user.email;
  user.phone = payload.phone ?? user.phone;
  user.department = payload.department ?? user.department;
  user.roll_number = payload.roll_number ?? user.roll_number;
  user.year = payload.year ?? user.year;
  user.profile = {
    ...user.profile,
    ...payload.profile,
    notifications: {
      ...user.profile.notifications,
      ...(payload.profile?.notifications || {}),
    },
  };

  return sanitizeUser(user);
}

function createRequest({ user_id, user_name, role, type, target_id, old_value, new_value, request }) {
  const newRequest = {
    id: `r${profileRequests.length + 1}`,
    user_id,
    user_name,
    role,
    type,
    target_id: target_id || user_id,
    old_value: old_value || null,
    new_value: new_value || null,
    request: request || `${type} request submitted`,
    status: "pending",
    reviewed_by: null,
    created_at: new Date().toISOString().slice(0, 10),
  };

  profileRequests.unshift(newRequest);
  return newRequest;
}

function reviewRequest(requestId, status, reviewedBy) {
  const request = profileRequests.find((item) => item.id === requestId);
  if (!request) return null;

  request.status = status;
  request.reviewed_by = reviewedBy;

  if (status === "approved") {
    if (request.type === "profile_update" && request.target_id) {
      updateProfile(request.target_id, request.new_value || {});
    }

    if (request.type === "attendance_change" && request.target_id) {
      const [studentId, subjectId] = String(request.target_id).split(":");
      const attendanceRow = attendance.find((record) => record.student_id === studentId);
      const subjectRow = attendanceRow?.subjects.find((row) => row.subject_id === subjectId);
      if (subjectRow && request.new_value) {
        subjectRow.present = request.new_value.present ?? subjectRow.present;
        subjectRow.total = request.new_value.total ?? subjectRow.total;
      }
    }
  }

  return request;
}

module.exports = {
  users,
  subjects,
  enrollments,
  attendance,
  marks,
  progressHistory,
  assignments,
  submissions,
  materials,
  exams,
  notifications,
  profileRequests,
  teacherSchedule,
  teacherReminders,
  studentReminders,
  timetable,
  sanitizeUser,
  findUserById,
  findUserByIdentifier,
  createUser,
  updateUser,
  deleteUser,
  toggleUserBlock,
  updateProfile,
  createRequest,
  reviewRequest,
};

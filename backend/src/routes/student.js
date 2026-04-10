const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

router.use(auth, roleGuard('student'));

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      reminders: [
        { id: 1, title: 'Submit AI Assignment', due: 'Tomorrow', subject: 'Computer Science' },
        { id: 2, title: 'Midterm Exam Registration', due: 'Next Week', subject: 'All Subjects' },
        { id: 3, title: 'Lab Report Submission', due: 'In 3 days', subject: 'Physics' },
      ],
      currentAnalysis: {
        topicUnderstanding: 85,
        strengths: ['Mathematics', 'Algorithms'],
        weaknesses: ['Database Systems', 'Physics Lab'],
        progress: 75
      }
    }
  });
});

// ── Attendance ─────────────────────────────────────────────────────────────
router.get('/attendance', (req, res) => {
  res.json({
    success: true,
    data: {
      overall: 82,
      subjects: [
        { subject: 'Computer Science', present: 42, total: 48, percentage: 87.5 },
        { subject: 'Mathematics', present: 45, total: 50, percentage: 90.0 },
        { subject: 'Physics', present: 35, total: 46, percentage: 76.1 },
        { subject: 'English', present: 38, total: 44, percentage: 86.4 },
        { subject: 'Database Systems', present: 28, total: 40, percentage: 70.0 },
      ],
      monthly: [
        { month: 'Aug', percentage: 78 },
        { month: 'Sep', percentage: 82 },
        { month: 'Oct', percentage: 88 },
        { month: 'Nov', percentage: 75 },
        { month: 'Dec', percentage: 84 },
        { month: 'Jan', percentage: 90 },
        { month: 'Feb', percentage: 82 },
        { month: 'Mar', percentage: 85 },
      ]
    }
  });
});

// ── Subjects ───────────────────────────────────────────────────────────────
router.get('/subjects', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 's1', name: 'Computer Science', code: 'CS101', teacher: 'Teacher John', credits: 4, grade: 'A', marks: 88 },
      { id: 's2', name: 'Mathematics', code: 'MA101', teacher: 'Teacher John', credits: 4, grade: 'A+', marks: 95 },
      { id: 's3', name: 'Physics', code: 'PH101', teacher: 'Dr. Smith', credits: 3, grade: 'B+', marks: 76 },
      { id: 's4', name: 'English', code: 'EN101', teacher: 'Prof. Clara', credits: 2, grade: 'A', marks: 87 },
      { id: 's5', name: 'Database Systems', code: 'DB201', teacher: 'Teacher John', credits: 3, grade: 'B', marks: 71 },
    ]
  });
});

// ── Assignments ────────────────────────────────────────────────────────────
router.get('/assignments', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'a1', title: 'AI Algorithms Implementation', subject: 'Computer Science', dueDate: '2026-04-10', status: 'pending', marks: null, maxMarks: 20 },
      { id: 'a2', title: 'Calculus Integration Problems', subject: 'Mathematics', dueDate: '2026-04-05', status: 'submitted', marks: 18, maxMarks: 20 },
      { id: 'a3', title: 'Physics Lab Report', subject: 'Physics', dueDate: '2026-04-12', status: 'pending', marks: null, maxMarks: 15 },
      { id: 'a4', title: 'ER Diagram Design', subject: 'Database Systems', dueDate: '2026-03-28', status: 'graded', marks: 12, maxMarks: 15 },
      { id: 'a5', title: 'Essay: Technology in Education', subject: 'English', dueDate: '2026-03-20', status: 'graded', marks: 14, maxMarks: 15 },
    ]
  });
});

// ── Exams / Results ────────────────────────────────────────────────────────
router.get('/exams', (req, res) => {
  res.json({
    success: true,
    data: {
      upcoming: [
        { id: 'ex1', subject: 'Computer Science', type: 'Midterm', date: '2026-04-20', time: '10:00 AM', room: 'Hall A' },
        { id: 'ex2', subject: 'Mathematics', type: 'Midterm', date: '2026-04-22', time: '2:00 PM', room: 'Hall B' },
        { id: 'ex3', subject: 'Physics', type: 'Unit Test', date: '2026-04-15', time: '11:00 AM', room: 'Hall C' },
      ],
      results: [
        { id: 'r1', subject: 'Computer Science', type: 'Unit Test 1', maxMarks: 25, obtainedMarks: 22, grade: 'A', date: '2026-03-05' },
        { id: 'r2', subject: 'Mathematics', type: 'Unit Test 1', maxMarks: 25, obtainedMarks: 24, grade: 'A+', date: '2026-03-07' },
        { id: 'r3', subject: 'Physics', type: 'Unit Test 1', maxMarks: 25, obtainedMarks: 18, grade: 'B+', date: '2026-03-10' },
        { id: 'r4', subject: 'Database Systems', type: 'Unit Test 1', maxMarks: 25, obtainedMarks: 17, grade: 'B', date: '2026-03-12' },
        { id: 'r5', subject: 'English', type: 'Unit Test 1', maxMarks: 25, obtainedMarks: 22, grade: 'A', date: '2026-03-14' },
      ]
    }
  });
});

// ── Performance Analytics ──────────────────────────────────────────────────
router.get('/analysis', (req, res) => {
  res.json({
    success: true,
    data: {
      overallScore: 83,
      trend: '+5%',
      prediction: 'Good',
      confidence: 0.87,
      subjectMarks: [
        { subject: 'CS', marks: 88, avg: 74 },
        { subject: 'Math', marks: 95, avg: 70 },
        { subject: 'Physics', marks: 76, avg: 68 },
        { subject: 'English', marks: 87, avg: 72 },
        { subject: 'DB', marks: 71, avg: 66 },
      ],
      marksOverTime: [
        { month: 'Aug', cs: 75, math: 80, physics: 65, english: 78, db: 60 },
        { month: 'Sep', cs: 78, math: 85, physics: 68, english: 80, db: 62 },
        { month: 'Oct', cs: 82, math: 88, physics: 70, english: 82, db: 65 },
        { month: 'Nov', cs: 80, math: 90, physics: 72, english: 84, db: 68 },
        { month: 'Dec', cs: 84, math: 92, physics: 74, english: 85, db: 70 },
        { month: 'Jan', cs: 86, math: 93, physics: 75, english: 86, db: 70 },
        { month: 'Feb', cs: 87, math: 94, physics: 76, english: 86, db: 71 },
        { month: 'Mar', cs: 88, math: 95, physics: 76, english: 87, db: 71 },
      ],
      radarData: [
        { metric: 'Attendance', score: 82 },
        { metric: 'Assignments', score: 88 },
        { metric: 'Exam Scores', score: 83 },
        { metric: 'Participation', score: 75 },
        { metric: 'Consistency', score: 80 },
      ],
      factors: ['Strong Mathematical foundation', 'Good assignment completion', 'Needs improvement in Physics Lab']
    }
  });
});

// ── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'n1', type: 'assignment', title: 'New Assignment Posted', message: 'AI Algorithms Implementation has been posted for Computer Science.', time: '2 hours ago', read: false },
      { id: 'n2', type: 'result', title: 'Exam Result Published', message: 'Your Mathematics Unit Test 1 result is now available.', time: '1 day ago', read: false },
      { id: 'n3', type: 'attendance', title: 'Attendance Alert', message: 'Your attendance in Database Systems is below 75%. Please attend classes regularly.', time: '2 days ago', read: true },
      { id: 'n4', type: 'announcement', title: 'Holiday Announcement', message: 'College will remain closed on April 14th for Dr. Ambedkar Jayanti.', time: '3 days ago', read: true },
      { id: 'n5', type: 'reminder', title: 'Exam Registration Open', message: 'Midterm exam registration is now open. Last date: April 15th.', time: '4 days ago', read: true },
    ]
  });
});

// ── Timetable ──────────────────────────────────────────────────────────────
router.get('/timetable', (req, res) => {
  res.json({
    success: true,
    data: {
      Monday: [
        { time: '9:00 - 10:00', subject: 'Computer Science', teacher: 'Teacher John', room: 'Lab 2' },
        { time: '10:00 - 11:00', subject: 'Mathematics', teacher: 'Teacher John', room: 'Room 301' },
        { time: '11:00 - 12:00', subject: 'English', teacher: 'Prof. Clara', room: 'Room 205' },
        { time: '2:00 - 3:00', subject: 'Database Systems', teacher: 'Teacher John', room: 'Lab 1' },
      ],
      Tuesday: [
        { time: '9:00 - 10:00', subject: 'Physics', teacher: 'Dr. Smith', room: 'Lab 3' },
        { time: '10:00 - 11:00', subject: 'Mathematics', teacher: 'Teacher John', room: 'Room 301' },
        { time: '2:00 - 4:00', subject: 'Physics Lab', teacher: 'Dr. Smith', room: 'Physics Lab' },
      ],
      Wednesday: [
        { time: '9:00 - 10:00', subject: 'Computer Science', teacher: 'Teacher John', room: 'Lab 2' },
        { time: '10:00 - 11:00', subject: 'Database Systems', teacher: 'Teacher John', room: 'Lab 1' },
        { time: '11:00 - 12:00', subject: 'English', teacher: 'Prof. Clara', room: 'Room 205' },
      ],
      Thursday: [
        { time: '9:00 - 10:00', subject: 'Mathematics', teacher: 'Teacher John', room: 'Room 301' },
        { time: '10:00 - 11:00', subject: 'Physics', teacher: 'Dr. Smith', room: 'Room 202' },
        { time: '2:00 - 3:00', subject: 'Computer Science', teacher: 'Teacher John', room: 'Lab 2' },
      ],
      Friday: [
        { time: '9:00 - 10:00', subject: 'Database Systems', teacher: 'Teacher John', room: 'Lab 1' },
        { time: '10:00 - 11:00', subject: 'Mathematics', teacher: 'Teacher John', room: 'Room 301' },
        { time: '11:00 - 12:00', subject: 'English', teacher: 'Prof. Clara', room: 'Room 205' },
      ],
    }
  });
});

module.exports = router;

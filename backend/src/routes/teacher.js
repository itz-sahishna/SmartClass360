const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { mockUsers } = require('../data/mockData');
const axios = require('axios');

router.use(auth, roleGuard('teacher'));

// ── Students list ──────────────────────────────────────────────────────────
router.get('/students', (req, res) => {
  const students = mockUsers.filter(u => u.role === 'student');
  const studentsData = students.map(({ password_hash, ...rest }) => rest);
  res.json({ success: true, count: studentsData.length, data: studentsData });
});

// ── Attendance Management ──────────────────────────────────────────────────
router.get('/attendance', (req, res) => {
  res.json({
    success: true,
    data: {
      subjects: [
        { id: 's1', name: 'Computer Science', totalClasses: 48, avgAttendance: 82 },
        { id: 's2', name: 'Mathematics', totalClasses: 50, avgAttendance: 88 },
        { id: 's3', name: 'Database Systems', totalClasses: 40, avgAttendance: 71 },
      ],
      students: [
        { name: 'Alice', roll: 'CS-2023-01', cs: 87, math: 90, db: 70, overall: 82 },
        { name: 'Bob', roll: 'CS-2023-02', cs: 75, math: 82, db: 68, overall: 75 },
        { name: 'Carol', roll: 'CS-2023-03', cs: 92, math: 94, db: 88, overall: 91 },
        { name: 'David', roll: 'CS-2023-04', cs: 60, math: 65, db: 55, overall: 60 },
        { name: 'Eva', roll: 'CS-2023-05', cs: 88, math: 91, db: 76, overall: 85 },
      ],
      monthly: [
        { month: 'Aug', attendance: 78 }, { month: 'Sep', attendance: 82 },
        { month: 'Oct', attendance: 85 }, { month: 'Nov', attendance: 79 },
        { month: 'Dec', attendance: 83 }, { month: 'Jan', attendance: 87 },
        { month: 'Feb', attendance: 84 }, { month: 'Mar', attendance: 86 },
      ]
    }
  });
});

// ── Subjects ───────────────────────────────────────────────────────────────
router.get('/subjects', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 's1', name: 'Computer Science', code: 'CS101', students: 42, schedule: 'Mon, Wed, Thu' },
      { id: 's2', name: 'Mathematics', code: 'MA101', students: 45, schedule: 'Mon, Tue, Thu, Fri' },
      { id: 's3', name: 'Database Systems', code: 'DB201', students: 38, schedule: 'Mon, Wed, Fri' },
    ]
  });
});

// ── Assignments ────────────────────────────────────────────────────────────
router.get('/assignments', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'a1', title: 'AI Algorithms Implementation', subject: 'Computer Science', dueDate: '2026-04-10', totalSubmissions: 30, pendingReview: 8, maxMarks: 20 },
      { id: 'a2', title: 'Calculus Integration Problems', subject: 'Mathematics', dueDate: '2026-04-05', totalSubmissions: 42, pendingReview: 0, maxMarks: 20 },
      { id: 'a3', title: 'ER Diagram Design', subject: 'Database Systems', dueDate: '2026-03-28', totalSubmissions: 35, pendingReview: 0, maxMarks: 15 },
    ]
  });
});

// ── Exams / Marks ──────────────────────────────────────────────────────────
router.get('/exams', (req, res) => {
  res.json({
    success: true,
    data: {
      exams: [
        { id: 'e1', subject: 'Computer Science', type: 'Midterm', date: '2026-04-20', status: 'upcoming', avgScore: null },
        { id: 'e2', subject: 'Mathematics', type: 'Midterm', date: '2026-04-22', status: 'upcoming', avgScore: null },
        { id: 'e3', subject: 'Computer Science', type: 'Unit Test 1', date: '2026-03-05', status: 'completed', avgScore: 20.2 },
        { id: 'e4', subject: 'Mathematics', type: 'Unit Test 1', date: '2026-03-07', status: 'completed', avgScore: 22.1 },
        { id: 'e5', subject: 'Database Systems', type: 'Unit Test 1', date: '2026-03-12', status: 'completed', avgScore: 17.5 },
      ],
      topStudents: [
        { name: 'Carol', subject: 'Mathematics', score: 24 },
        { name: 'Alice', subject: 'Computer Science', score: 22 },
        { name: 'Eva', subject: 'Database Systems', score: 20 },
      ]
    }
  });
});

// ── Reports & Analytics (ML-powered) ──────────────────────────────────────
router.get('/analytics', async (req, res, next) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

    // Rich student dataset for ML predictions (500+ records represented as 8 students with full metrics)
    const studentsRaw = [
      { name: 'Alice', roll: 'CS-2023-01', avg_attendance: 87.5, attendance_trend: 5, avg_marks: 88, marks_trend: 8, assignment_completion_rate: 0.95, consistency_score: 0.90, days_since_last_submission: 1 },
      { name: 'Bob', roll: 'CS-2023-02', avg_attendance: 75, attendance_trend: -2, avg_marks: 71, marks_trend: -3, assignment_completion_rate: 0.75, consistency_score: 0.65, days_since_last_submission: 5 },
      { name: 'Carol', roll: 'CS-2023-03', avg_attendance: 91, attendance_trend: 3, avg_marks: 94, marks_trend: 6, assignment_completion_rate: 0.98, consistency_score: 0.95, days_since_last_submission: 0 },
      { name: 'David', roll: 'CS-2023-04', avg_attendance: 60, attendance_trend: -8, avg_marks: 55, marks_trend: -10, assignment_completion_rate: 0.50, consistency_score: 0.40, days_since_last_submission: 12 },
      { name: 'Eva', roll: 'CS-2023-05', avg_attendance: 85, attendance_trend: 4, avg_marks: 82, marks_trend: 5, assignment_completion_rate: 0.90, consistency_score: 0.85, days_since_last_submission: 2 },
      { name: 'Frank', roll: 'CS-2023-06', avg_attendance: 68, attendance_trend: 1, avg_marks: 63, marks_trend: 2, assignment_completion_rate: 0.70, consistency_score: 0.60, days_since_last_submission: 7 },
      { name: 'Grace', roll: 'CS-2023-07', avg_attendance: 93, attendance_trend: 6, avg_marks: 91, marks_trend: 7, assignment_completion_rate: 0.97, consistency_score: 0.93, days_since_last_submission: 0 },
      { name: 'Henry', roll: 'CS-2023-08', avg_attendance: 52, attendance_trend: -12, avg_marks: 42, marks_trend: -15, assignment_completion_rate: 0.35, consistency_score: 0.25, days_since_last_submission: 14 },
    ];

    const students = await Promise.all(
      studentsRaw.map(async (s) => {
        const { name, roll, ...features } = s;
        let prediction = { prediction: 'Average', confidence: 0.75, factors: [] };
        try {
          const mlResp = await axios.post(`${mlUrl}/predict`, features, { timeout: 5000 });
          prediction = mlResp.data;
        } catch (e) {
          // fallback heuristic
          if (features.avg_marks > 80 && features.avg_attendance > 80) prediction.prediction = 'Good';
          else if (features.avg_marks < 55 || features.avg_attendance < 65) prediction.prediction = 'At Risk';
        }
        return { name, roll, ...features, ...prediction };
      })
    );

    // Aggregate stats
    const counts = { 'Good': 0, 'Average': 0, 'At Risk': 0 };
    students.forEach(s => { if (counts[s.prediction] !== undefined) counts[s.prediction]++; });

    const marksOverTime = [
      { month: 'Aug', avg: 68 }, { month: 'Sep', avg: 71 }, { month: 'Oct', avg: 74 },
      { month: 'Nov', avg: 72 }, { month: 'Dec', avg: 76 }, { month: 'Jan', avg: 79 },
      { month: 'Feb', avg: 81 }, { month: 'Mar', avg: 83 },
    ];
    const attendanceVsMarks = students.map(s => ({ name: s.name, attendance: s.avg_attendance, marks: s.avg_marks }));

    res.json({
      success: true,
      data: {
        students,
        distribution: [
          { name: 'Good', value: counts['Good'], color: '#10b981' },
          { name: 'Average', value: counts['Average'], color: '#f59e0b' },
          { name: 'At Risk', value: counts['At Risk'], color: '#ef4444' },
        ],
        marksOverTime,
        attendanceVsMarks,
        summary: {
          totalStudents: students.length,
          atRisk: counts['At Risk'],
          avgClassScore: Math.round(students.reduce((a, s) => a + s.avg_marks, 0) / students.length),
          avgAttendance: Math.round(students.reduce((a, s) => a + s.avg_attendance, 0) / students.length),
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// ── ML Predict (individual student) ───────────────────────────────────────
router.post('/predict', async (req, res, next) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    let predictionData = { prediction: 'Average', confidence: 0.75, factors: ['Marginal performance across metrics'] };
    try {
      const mlResponse = await axios.post(`${mlUrl}/predict`, req.body, { timeout: 5000 });
      predictionData = mlResponse.data;
    } catch (err) {
      // fallback
      const { avg_marks, avg_attendance } = req.body;
      if (avg_marks > 75 && avg_attendance > 80) predictionData.prediction = 'Good';
      else if (avg_marks < 50 || avg_attendance < 60) predictionData.prediction = 'At Risk';
    }
    res.json({ success: true, data: predictionData });
  } catch (err) {
    next(err);
  }
});

// ── Notifications ──────────────────────────────────────────────────────────
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'n1', type: 'submission', title: 'New Assignment Submission', message: '8 students submitted AI Algorithms Implementation.', time: '1 hour ago', read: false },
      { id: 'n2', type: 'alert', title: 'At-Risk Student Alert', message: 'Henry (CS-2023-08) has very low attendance (52%) and marks (42%). Intervention recommended.', time: '3 hours ago', read: false },
      { id: 'n3', type: 'announcement', title: 'Upcoming Exam Schedule', message: 'Midterm exams are scheduled for April 20-25. Please prepare question papers.', time: '1 day ago', read: true },
      { id: 'n4', type: 'system', title: 'Marks Entry Deadline', message: 'Unit Test 2 marks must be submitted by April 18th.', time: '2 days ago', read: true },
    ]
  });
});

module.exports = router;

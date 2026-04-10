const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { query } = require('../db');

router.use(auth);

// Lazily initialize Gemini so missing key doesn't crash the server
function getGeminiModel() {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'YOUR_GEMINI_API_KEY_HERE') return null;
  const genAI = new GoogleGenerativeAI(key);
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
}

const SYSTEM_PROMPT = `You are SmartClass AI, a helpful educational assistant for students at SmartClass 360 — an intelligent school management platform.
You help students with:
- Understanding course topics (Math, Science, Computer Science, etc.)
- Summarizing study material they paste
- Answering questions about assignments, exams, and performance
- Giving study tips and learning strategies
- Motivating students and providing academic guidance

Be concise, friendly, and student-focused. Format your responses clearly with bullet points when listing things.
Never refuse to help with academic topics. If you don't know something specific, give a general helpful answer.
When SmartClass context is provided, use it for questions about the student's own attendance, assignments, exams, marks, subjects, and teachers. Do not invent student data that is not in the context.`;

async function buildSmartClassContext(user) {
  if (user.role === 'student') {
    const [profile, subjects, assignments, attendance, exams] = await Promise.all([
      query(
        `
          SELECT u.name, st.roll_number, sec.class_name, sec.name AS section_name,
                 ay.year_number, ay.academic_year, d.name AS department
          FROM users u
          JOIN students st ON st.user_id = u.id
          JOIN sections sec ON sec.id = st.section_id
          JOIN academic_years ay ON ay.id = sec.year_id
          JOIN departments d ON d.id = ay.department_id
          WHERE u.id = $1
          LIMIT 1
        `,
        [user.id]
      ),
      query(
        `
          SELECT sub.name, sub.code, u_teacher.name AS teacher_name
          FROM students st
          JOIN teacher_assignments ta ON ta.section_id = st.section_id
          JOIN subjects sub ON sub.id = ta.subject_id
          JOIN teachers t ON t.id = ta.teacher_id
          JOIN users u_teacher ON u_teacher.id = t.user_id
          WHERE st.user_id = $1
          ORDER BY sub.name
        `,
        [user.id]
      ),
      query(
        `
          SELECT a.title, a.type, a.due_date, sub.name AS subject_name, s.status, s.marks
          FROM students st
          JOIN submissions s ON s.student_id = st.id
          JOIN assignments a ON a.id = s.assignment_id
          JOIN subjects sub ON sub.id = a.subject_id
          WHERE st.user_id = $1
          ORDER BY a.due_date
          LIMIT 8
        `,
        [user.id]
      ),
      query(
        `
          SELECT sub.name AS subject_name,
                 COUNT(ar.id) AS total,
                 COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present
          FROM students st
          JOIN attendance_records ar ON ar.student_id = st.id
          JOIN attendance_sessions sess ON sess.id = ar.session_id
          JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
          JOIN subjects sub ON sub.id = ta.subject_id
          WHERE st.user_id = $1
          GROUP BY sub.name
          ORDER BY sub.name
        `,
        [user.id]
      ),
      query(
        `
          SELECT sub.name AS subject_name, e.exam_type, e.date, e.max_marks
          FROM students st
          JOIN exams e ON e.section_id = st.section_id
          JOIN subjects sub ON sub.id = e.subject_id
          WHERE st.user_id = $1
          ORDER BY e.date
          LIMIT 8
        `,
        [user.id]
      ),
    ]);

    const profileRow = profile.rows[0];
    const subjectText = subjects.rows.map((row) => `${row.name} (${row.code}) with ${row.teacher_name}`).join('; ') || 'No subjects found';
    const assignmentText = assignments.rows.map((row) => {
      const due = row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : 'no due date';
      return `${row.title} [${row.type}] for ${row.subject_name}, due ${due}, status ${row.status}, marks ${row.marks ?? 'pending'}`;
    }).join('; ') || 'No assignments found';
    const attendanceText = attendance.rows.map((row) => {
      const total = Number(row.total || 0);
      const present = Number(row.present || 0);
      const pct = total ? Math.round((present / total) * 100) : 0;
      return `${row.subject_name}: ${present}/${total} (${pct}%)`;
    }).join('; ') || 'No attendance records found';
    const examText = exams.rows.map((row) => `${row.subject_name} ${row.exam_type} on ${new Date(row.date).toISOString().slice(0, 10)} (${row.max_marks} marks)`).join('; ') || 'No exams found';

    return [
      `Student: ${profileRow?.name ?? user.name}, roll ${profileRow?.roll_number ?? 'unknown'}, ${profileRow?.department ?? 'department unknown'}, ${profileRow?.class_name ?? 'class unknown'} Section ${profileRow?.section_name ?? 'unknown'}, Year ${profileRow?.year_number ?? 'unknown'} (${profileRow?.academic_year ?? 'unknown'}).`,
      `Subjects: ${subjectText}.`,
      `Assignments/quizzes: ${assignmentText}.`,
      `Attendance: ${attendanceText}.`,
      `Upcoming exams: ${examText}.`,
    ].join('\n');
  }

  if (user.role === 'teacher') {
    const subjects = await query(
      `
        SELECT sub.name, sec.class_name, sec.name AS section_name
        FROM teachers t
        JOIN teacher_assignments ta ON ta.teacher_id = t.id
        JOIN subjects sub ON sub.id = ta.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        WHERE t.user_id = $1
        ORDER BY sub.name
      `,
      [user.id]
    );
    return `Teacher: ${user.name}. Teaching load: ${subjects.rows.map((row) => `${row.name} for ${row.class_name} Section ${row.section_name}`).join('; ') || 'No assigned subjects found'}.`;
  }

  return `User: ${user.name}, role: ${user.role}.`;
}

function buildContextFallbackAnswer(question, context) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('assignment') || lowerQuestion.includes('quiz') || lowerQuestion.includes('attendance') || lowerQuestion.includes('exam')) {
    return `I could not reach Gemini right now, so here is the live SmartClass context I can safely use:\n\n${context}`;
  }
  return `I could not reach Gemini right now, but I can still help from the SmartClass portal context available to me:\n\n${context}\n\nAsk about your assignments, quizzes, attendance, exams, subjects, or marks and I will answer from this data.`;
}

router.post('/ask', async (req, res, next) => {
  try {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required' });
    }

    const model = getGeminiModel();

    if (!model) {
      // Fallback responses when no API key
      let answer = "I'm your SmartClass AI assistant! To enable full AI responses, please configure the GEMINI_API_KEY in the backend .env file. For now, here's a tip: consistent study habits and attending all classes are the best predictors of academic success!";
      const lowerQ = question.toLowerCase();
      if (lowerQ.includes('hello') || lowerQ.includes('hi')) {
        answer = "Hello! I'm SmartClass AI. I'm currently running in demo mode. Set up the Gemini API key to unlock full AI responses!";
      } else if (lowerQ.includes('grade') || lowerQ.includes('marks') || lowerQ.includes('performance')) {
        answer = "To check your grades and performance, navigate to the Performance Analytics section in the sidebar. It shows detailed charts of your attendance, marks, and progress over time.";
      } else if (lowerQ.includes('assignment')) {
        answer = "Check the Assignments section in the sidebar to view all your pending and submitted assignments with their due dates.";
      } else if (lowerQ.includes('exam') || lowerQ.includes('test')) {
        answer = "Your exam schedule and results are available in the Exams / Results section. Remember to review past papers and practice regularly!";
      }
      return res.json({ success: true, answer });
    }

    const smartClassContext = await buildSmartClassContext(req.user);

    // Build conversation history for context
    const chatHistory = [];
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) { // last 10 messages for context
        if (msg.role === 'user') {
          chatHistory.push({ role: 'user', parts: [{ text: msg.content }] });
        } else if (msg.role === 'ai') {
          chatHistory.push({ role: 'model', parts: [{ text: msg.content }] });
        }
      }
    }

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: "Understood! I'm SmartClass AI, ready to help students with their academic journey." }] },
        ...chatHistory.slice(0, -1) // exclude the last user message we're about to send
      ]
    });

    try {
      const result = await chat.sendMessage(`SmartClass context:\n${smartClassContext}\n\nUser question:\n${question}`);
      const answer = result.response.text();
      return res.json({ success: true, answer });
    } catch (modelError) {
      return res.json({
        success: true,
        answer: buildContextFallbackAnswer(question, smartClassContext),
        providerStatus: 'gemini_unavailable',
      });
    }
  } catch (err) {
    next(err);
  }
});

router.post('/summarize', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required for summarization' });
    }

    const model = getGeminiModel();

    if (!model) {
      const summary = `📝 Summary of your text:\n\nThe provided content covers key academic concepts. Main points include the foundational principles discussed, practical applications, and areas requiring further study.\n\n💡 Tip: Set up the Gemini API key for AI-powered smart summaries!`;
      return res.json({ success: true, summary });
    }

    const prompt = `Please summarize the following study material in a clear, student-friendly format. Use bullet points for key points. Keep it concise but comprehensive:\n\n${text}`;
    try {
      const result = await model.generateContent(prompt);
      const summary = result.response.text();
      return res.json({ success: true, summary });
    } catch (modelError) {
      const compact = text.length > 700 ? `${text.slice(0, 700)}...` : text;
      return res.json({
        success: true,
        summary: `Gemini is currently unavailable, so here is a basic fallback summary:\n\n${compact}`,
        providerStatus: 'gemini_unavailable',
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;

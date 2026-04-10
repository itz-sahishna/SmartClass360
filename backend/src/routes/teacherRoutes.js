const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const { query, withTransaction } = require("../db");
const {
  randomUUID,
  parseJson,
  getTeacherByUserId,
  getUserById,
  average,
  toFriendlyGrade,
} = require("../db/helpers");

const router = express.Router();

router.use(auth, roleGuard("teacher"));

async function getTeacherAssignments(userId) {
  return query(
    `
      SELECT
        ta.*,
        sub.name AS subject_name,
        sub.code AS subject_code,
        sub.semester,
        sub.syllabus,
        sec.id AS section_id,
        sec.class_name,
        sec.name AS section_name,
        ay.year_number,
        ay.academic_year,
        d.name AS department_name,
        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
              'id', tt.id,
              'day', tt.day_of_week,
              'start', to_char(tt.start_time, 'HH24:MI'),
              'end', to_char(tt.end_time, 'HH24:MI'),
              'room', tt.room
            )
            )
            FROM timetables tt
            WHERE tt.teacher_assignment_id = ta.id
          ),
          '[]'::json
        ) AS timetable
      FROM teachers t
      JOIN teacher_assignments ta ON ta.teacher_id = t.id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN sections sec ON sec.id = ta.section_id
      JOIN academic_years ay ON ay.id = sec.year_id
      JOIN departments d ON d.id = sub.department_id
      WHERE t.user_id = $1
      GROUP BY ta.id, sub.name, sub.code, sub.semester, sub.syllabus, sec.id, sec.class_name, sec.name, ay.year_number, ay.academic_year, d.name
      ORDER BY sub.name, sec.class_name, sec.name
    `,
    [userId]
  );
}

function createNotification(client, { userId, title, message, type, actionUrl = null }) {
  return client.query(
    `
      INSERT INTO notifications (id, user_id, title, message, type, action_url)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [randomUUID(), userId, title, message, type, actionUrl]
  );
}

async function buildTeacherDashboard(user) {
  const teacher = await getTeacherByUserId(user.id);
  const assignmentsResult = await getTeacherAssignments(user.id);
  const assignmentIds = assignmentsResult.rows.map((row) => row.id);
  const sectionIds = [...new Set(assignmentsResult.rows.map((row) => row.section_id))];

  const [notifications, requests, pendingSubmissions, latestPrediction, studentCount] = await Promise.all([
    query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 8`,
      [user.id]
    ),
    query(
      `
        SELECT
          r.*,
          u.name AS student_name,
          st.roll_number,
          sub.name AS subject_name,
          sec.class_name,
          sec.name AS section_name,
          sess.date AS attendance_date
        FROM requests r
        JOIN attendance_records ar ON ar.id = r.target_id
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        JOIN subjects sub ON sub.id = ta.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        JOIN students st ON st.id = ar.student_id
        JOIN users u ON u.id = r.user_id
        WHERE r.status = 'pending'
          AND r.type = 'attendance_change'
          AND ta.teacher_id = $1
        ORDER BY r.created_at DESC
      `,
      [teacher.id]
    ),
    assignmentIds.length
      ? query(
          `
            SELECT COUNT(*) AS count
            FROM submissions s
            JOIN assignments a ON a.id = s.assignment_id
            WHERE a.teacher_assignment_id = ANY($1::text[])
              AND s.status = 'submitted'
          `,
          [assignmentIds]
        )
      : { rows: [{ count: 0 }] },
    teacher
      ? query(
          `
            SELECT sp.*
            FROM student_performance sp
            JOIN teacher_assignments ta ON ta.subject_id = sp.subject_id
            WHERE ta.teacher_id = $1
            ORDER BY sp.generated_at DESC
            LIMIT 1
          `,
          [teacher.id]
        )
      : { rows: [] },
    sectionIds.length
      ? query(`SELECT COUNT(*) AS count FROM students WHERE section_id = ANY($1::text[])`, [sectionIds])
      : { rows: [{ count: 0 }] },
  ]);

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const nowTime = new Date().toTimeString().slice(0, 5);
  const schedule = assignmentsResult.rows.flatMap((row) =>
    (row.timetable || [])
      .filter((slot) => slot.day === dayName && slot.end >= nowTime)
      .map((slot) => ({
        teacher_assignment_id: row.id,
        subject: row.subject_name,
        className: row.class_name,
        section: row.section_name,
        room: slot.room,
        slot: `${slot.start} - ${slot.end}`,
        day: slot.day,
      }))
  );

  const reminders = [
    {
      id: "rem-1",
      title: `${pendingSubmissions.rows[0]?.count || 0} submissions need grading`,
      priority: "high",
    },
    {
      id: "rem-2",
      title: `${requests.rows.length} student attendance requests are pending`,
      priority: "medium",
    },
  ];

  return {
    welcome: `Welcome back, ${user.name}`,
    schedule,
    reminders,
    notifications: notifications.rows,
    pendingRequests: requests.rows.map((row) => ({
      ...row,
      old_value: parseJson(row.old_value, null),
      new_value: parseJson(row.new_value, null),
    })),
    quickStats: {
      totalSubjects: new Set(assignmentsResult.rows.map((row) => row.subject_id)).size,
      totalStudents: Number(studentCount.rows[0]?.count || 0),
      pendingAssignments: Number(pendingSubmissions.rows[0]?.count || 0),
    },
    predictionPreview: latestPrediction.rows[0]
      ? {
          prediction: latestPrediction.rows[0].predicted_performance,
          confidence: 0.81,
          predicted_grade: latestPrediction.rows[0].predicted_grade,
          factors: parseJson(latestPrediction.rows[0].insights, {}).factors || [],
        }
      : {
          prediction: "Average",
          confidence: 0.7,
          predicted_grade: "B",
          factors: ["Analysis will appear after the first prediction run."],
        },
  };
}

async function buildPredictionPayload(student, subjectId) {
  const [marksResult, attendanceResult, submissionsResult, historicalResult] = await Promise.all([
    query(
      `SELECT * FROM marks WHERE student_id = $1 AND subject_id = $2 ORDER BY date ASC`,
      [student.student_id, subjectId]
    ),
    query(
      `
        SELECT ar.status
        FROM attendance_records ar
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        WHERE ar.student_id = $1 AND ta.subject_id = $2
      `,
      [student.student_id, subjectId]
    ),
    query(
      `
        SELECT s.marks, s.status
        FROM submissions s
        JOIN assignments a ON a.id = s.assignment_id
        WHERE s.student_id = $1 AND a.subject_id = $2
      `,
      [student.student_id, subjectId]
    ),
    query(
      `
        SELECT * FROM student_performance
        WHERE student_id = $1 AND subject_id = $2
        ORDER BY generated_at DESC
        LIMIT 1
      `,
      [student.student_id, subjectId]
    ),
  ]);

  const marks = marksResult.rows.map((row) => Number(row.marks_obtained));
  const assignmentScores = marksResult.rows
    .filter((row) => ["assignment", "quiz", "online_quiz"].includes(row.exam_type))
    .map((row) => (Number(row.marks_obtained) / Number(row.max_marks)) * 100);
  const examScores = marksResult.rows
    .filter((row) => row.exam_type === "mid")
    .map((row) => (Number(row.marks_obtained) / Number(row.max_marks)) * 100);
  const finalScores = marksResult.rows
    .filter((row) => row.exam_type === "final")
    .map((row) => (Number(row.marks_obtained) / Number(row.max_marks)) * 100);
  const presentCount = attendanceResult.rows.filter((row) => row.status === "present").length;
  const attendancePct = attendanceResult.rows.length
    ? (presentCount / attendanceResult.rows.length) * 100
    : 0;
  const pastPerformance = historicalResult.rows[0]
    ? Number(historicalResult.rows[0].avg_marks)
    : average(marks);

  return {
    student,
    payload: {
      roll_no: student.roll_number,
      assignment_score: Number(average(assignmentScores).toFixed(2)),
      exam_score: Number(average(examScores).toFixed(2)),
      final_marks: Number(average(finalScores.length ? finalScores : marks).toFixed(2)),
      avg_marks: Number(average(marks).toFixed(2)),
      attendance: Number(attendancePct.toFixed(2)),
      past_performance: Number(pastPerformance.toFixed(2)),
    },
    summary: {
      marks,
      attendancePct,
      submissionCount: submissionsResult.rows.length,
    },
  };
}

async function storePrediction(studentId, subjectId, predictionData) {
  await query(
    `
      INSERT INTO student_performance (
        id, student_id, subject_id, avg_marks, attendance_percentage,
        assignment_score, exam_score, final_marks, past_performance,
        predicted_performance, predicted_grade, pass_prediction, insights
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb
      )
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
        generated_at = NOW()
    `,
    [
      randomUUID(),
      studentId,
      subjectId,
      predictionData.avg_marks,
      predictionData.attendance,
      predictionData.assignment_score,
      predictionData.exam_score,
      predictionData.final_marks,
      predictionData.past_performance,
      predictionData.prediction,
      predictionData.predicted_grade,
      predictionData.pass_prediction,
      JSON.stringify({
        factors: predictionData.factors || [],
        confidence: predictionData.confidence || 0,
      }),
    ]
  );
}

router.get("/dashboard", async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildTeacherDashboard(req.user) });
  } catch (error) {
    next(error);
  }
});

router.get("/students", async (req, res, next) => {
  try {
    const assignments = await getTeacherAssignments(req.user.id);
    const sectionIds = [...new Set(assignments.rows.map((row) => row.section_id))];
    if (!sectionIds.length) {
      return res.json({ success: true, count: 0, data: [] });
    }
    const result = await query(
      `
        SELECT u.id, u.name, u.email, s.roll_number, sec.class_name, sec.name AS section_name
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN sections sec ON sec.id = s.section_id
        WHERE s.section_id = ANY($1::text[])
        ORDER BY u.name
      `,
      [sectionIds]
    );
    res.json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get("/subjects", async (req, res, next) => {
  try {
    const result = await getTeacherAssignments(req.user.id);
    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        subject_id: row.subject_id,
        name: row.subject_name,
        code: row.subject_code,
        semester: row.semester,
        syllabus: row.syllabus,
        class_name: row.class_name,
        section_name: row.section_name,
        year_number: row.year_number,
        academic_year: row.academic_year,
        department: row.department_name,
        timetable: row.timetable || [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/assignments", async (req, res, next) => {
  try {
    const { subject_id = "", section_id = "" } = req.query;
    const result = await query(
      `
        SELECT
          a.*,
          sub.name AS subject_name,
          sec.class_name,
          sec.name AS section_name,
          COUNT(s.id) AS total_submissions,
          COUNT(s.id) FILTER (WHERE s.status = 'submitted') AS pending_review
        FROM assignments a
        JOIN teacher_assignments ta ON ta.id = a.teacher_assignment_id
        JOIN subjects sub ON sub.id = a.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        JOIN teachers t ON t.id = ta.teacher_id
        LEFT JOIN submissions s ON s.assignment_id = a.id
        WHERE t.user_id = $1
          AND ($2 = '' OR a.subject_id = $2)
          AND ($3 = '' OR ta.section_id = $3)
        GROUP BY a.id, sub.name, sec.class_name, sec.name
        ORDER BY a.created_at DESC
      `,
      [req.user.id, String(subject_id), String(section_id)]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        teacher_assignment_id: row.teacher_assignment_id,
        title: row.title,
        description: row.description,
        subject: row.subject_name,
        className: row.class_name,
        sectionName: row.section_name,
        dueDate: row.due_date,
        scheduledAt: row.scheduled_at,
        type: row.type,
        maxMarks: Number(row.max_marks),
        totalSubmissions: Number(row.total_submissions || 0),
        pendingReview: Number(row.pending_review || 0),
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/materials", async (req, res, next) => {
  try {
    const result = await query(
      `
        SELECT
          m.*,
          sub.name AS subject_name,
          sub.code AS subject_code,
          sec.class_name,
          sec.name AS section_name
        FROM materials m
        JOIN teacher_assignments ta ON ta.id = m.teacher_assignment_id
        JOIN teachers t ON t.id = ta.teacher_id
        JOIN subjects sub ON sub.id = m.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        WHERE t.user_id = $1
        ORDER BY m.created_at DESC
      `,
      [req.user.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/materials", async (req, res, next) => {
  try {
    const { title, description = "", teacher_assignment_id, file_url = "", material_type = "note" } = req.body;
    if (!title || !teacher_assignment_id) {
      return res.status(400).json({ success: false, message: "title and teacher_assignment_id are required." });
    }

    const teacher = await getTeacherByUserId(req.user.id);
    const assignment = await query(
      `
        SELECT ta.*, sub.id AS subject_id
        FROM teacher_assignments ta
        JOIN teachers t ON t.id = ta.teacher_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ta.id = $1 AND t.user_id = $2
        LIMIT 1
      `,
      [teacher_assignment_id, req.user.id]
    );

    const row = assignment.rows[0];
    if (!row) {
      return res.status(404).json({ success: false, message: "Teaching assignment not found." });
    }

    const materialId = randomUUID();
    await withTransaction(async (client) => {
      await client.query(
        `
          INSERT INTO materials (id, title, description, subject_id, teacher_assignment_id, created_by, file_url, material_type)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [materialId, title, description, row.subject_id, teacher_assignment_id, teacher.id, file_url || null, material_type]
      );

      const students = await client.query(
        `SELECT id, user_id FROM students WHERE section_id = $1`,
        [row.section_id]
      );

      for (const student of students.rows) {
        await createNotification(client, {
          userId: student.user_id,
          title: `New material: ${title}`,
          message: "Your teacher posted a new study material for your subject.",
          type: "material",
          actionUrl: "/student/subjects",
        });
      }
    });

    res.status(201).json({ success: true, data: { id: materialId } });
  } catch (error) {
    next(error);
  }
});

router.get("/assignments/:id", async (req, res, next) => {
  try {
    const assignmentResult = await query(
      `
        SELECT
          a.*,
          sub.name AS subject_name,
          sub.code AS subject_code,
          sec.class_name,
          sec.name AS section_name
        FROM assignments a
        JOIN teacher_assignments ta ON ta.id = a.teacher_assignment_id
        JOIN teachers t ON t.id = ta.teacher_id
        JOIN subjects sub ON sub.id = a.subject_id
        JOIN sections sec ON sec.id = ta.section_id
        WHERE a.id = $1 AND t.user_id = $2
        LIMIT 1
      `,
      [req.params.id, req.user.id]
    );

    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const [submissions, questions] = await Promise.all([
      query(
      `
        SELECT
          s.id,
          s.file_url,
          s.submitted_text,
          s.answers,
          s.submitted_at,
          s.marks,
          s.status,
          st.id AS student_id,
          st.roll_number,
          u.name AS student_name
        FROM submissions s
        JOIN students st ON st.id = s.student_id
        JOIN users u ON u.id = st.user_id
        WHERE s.assignment_id = $1
        ORDER BY u.name
      `,
      [req.params.id]
      ),
      query(
        `
          SELECT
            q.id,
            q.question_text,
            q.question_type,
            q.correct_option_index,
            q.marks,
            q.display_order,
            COALESCE(
              json_agg(
                jsonb_build_object(
                  'id', qo.id,
                  'option_text', qo.option_text,
                  'display_order', qo.display_order
                )
                ORDER BY qo.display_order
              ) FILTER (WHERE qo.id IS NOT NULL),
              '[]'::json
            ) AS options
          FROM assignment_questions q
          LEFT JOIN assignment_question_options qo ON qo.question_id = q.id
          WHERE q.assignment_id = $1
          GROUP BY q.id
          ORDER BY q.display_order
        `,
        [req.params.id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject_name,
        subject_code: assignment.subject_code,
        className: assignment.class_name,
        sectionName: assignment.section_name,
        type: assignment.type,
        dueDate: assignment.due_date,
        scheduledAt: assignment.scheduled_at,
        maxMarks: Number(assignment.max_marks),
        questions: questions.rows,
        submissions: submissions.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/assignments", async (req, res, next) => {
  try {
    const {
      title,
      description,
      teacher_assignment_id,
      type = "assignment",
      due_date,
      scheduled_at,
      max_marks = 20,
      questions = [],
    } = req.body;

    if (!title || !teacher_assignment_id || !due_date) {
      return res.status(400).json({ success: false, message: "Title, class assignment, and due date are required." });
    }

    const assignmentMeta = await query(
      `
        SELECT ta.*, sub.id AS subject_id
        FROM teacher_assignments ta
        JOIN teachers t ON t.id = ta.teacher_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ta.id = $1 AND t.user_id = $2
      `,
      [teacher_assignment_id, req.user.id]
    );

    const assignmentRow = assignmentMeta.rows[0];
    if (!assignmentRow) {
      return res.status(404).json({ success: false, message: "Teacher assignment not found." });
    }

    const assignmentId = randomUUID();
    await withTransaction(async (client) => {
      await client.query(
        `
          INSERT INTO assignments (id, title, description, subject_id, teacher_assignment_id, type, due_date, scheduled_at, max_marks)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          assignmentId,
          title,
          description || "",
          assignmentRow.subject_id,
          teacher_assignment_id,
          type,
          due_date,
          scheduled_at || null,
          max_marks,
        ]
      );

      if (type === "quiz") {
        for (let index = 0; index < questions.length; index += 1) {
          const question = questions[index];
          if (!question?.question_text) continue;
          const questionId = randomUUID();
          await client.query(
            `
              INSERT INTO assignment_questions (id, assignment_id, question_text, question_type, correct_option_index, marks, display_order)
              VALUES ($1, $2, $3, 'mcq', $4, $5, $6)
            `,
            [
              questionId,
              assignmentId,
              question.question_text,
              typeof question.correct_option_index === "number" ? question.correct_option_index : null,
              Number(question.marks || 1),
              index + 1,
            ]
          );

          for (let optionIndex = 0; optionIndex < (question.options || []).length; optionIndex += 1) {
            const option = question.options[optionIndex];
            if (!option?.option_text) continue;
            await client.query(
              `
                INSERT INTO assignment_question_options (id, question_id, option_text, display_order)
                VALUES ($1, $2, $3, $4)
              `,
              [randomUUID(), questionId, option.option_text, optionIndex]
            );
          }
        }
      }

      const students = await client.query(
        `SELECT id, user_id, roll_number FROM students WHERE section_id = $1`,
        [assignmentRow.section_id]
      );

      for (const student of students.rows) {
        await client.query(
          `
            INSERT INTO submissions (id, assignment_id, student_id, status)
            VALUES ($1, $2, $3, 'pending')
          `,
          [randomUUID(), assignmentId, student.id]
        );

        await createNotification(client, {
          userId: student.user_id,
          title: `${type === "quiz" ? "New Quiz" : "New Assignment"}: ${title}`,
          message: `${title} was posted for your class and subject.`,
          type: "assignment",
          actionUrl: `/student/assignments?id=${assignmentId}`,
        });
      }
    });

    res.status(201).json({ success: true, data: { id: assignmentId } });
  } catch (error) {
    next(error);
  }
});

router.patch("/assignments/:id/submissions/:submissionId", async (req, res, next) => {
  try {
    const { marks, status } = req.body;
    const teacher = await getTeacherByUserId(req.user.id);
    const assignmentResult = await query(
      `
        SELECT
          a.*,
          ta.section_id
        FROM assignments a
        JOIN teacher_assignments ta ON ta.id = a.teacher_assignment_id
        JOIN teachers t ON t.id = ta.teacher_id
        WHERE a.id = $1 AND t.user_id = $2
        LIMIT 1
      `,
      [req.params.id, req.user.id]
    );

    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const submissionResult = await query(
      `SELECT * FROM submissions WHERE id = $1 AND assignment_id = $2 LIMIT 1`,
      [req.params.submissionId, req.params.id]
    );
    const submission = submissionResult.rows[0];
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE submissions
          SET marks = COALESCE($3, marks),
              status = COALESCE($4, status)
          WHERE id = $1 AND assignment_id = $2
        `,
        [
          req.params.submissionId,
          req.params.id,
          typeof marks === "number" ? marks : null,
          status || (typeof marks === "number" ? "graded" : null),
        ]
      );

      if (typeof marks === "number") {
        await client.query(
          `
            DELETE FROM marks
            WHERE student_id = $1
              AND subject_id = $2
              AND teacher_id = $3
              AND section_id = $4
              AND exam_type = $5
              AND date = CURRENT_DATE
          `,
          [
            submission.student_id,
            assignment.subject_id,
            teacher.id,
            assignment.section_id,
            assignment.type === "quiz" ? "online_quiz" : "assignment",
          ]
        );

        await client.query(
          `
            INSERT INTO marks (
              id, student_id, subject_id, teacher_id, section_id,
              exam_type, marks_obtained, max_marks, date, is_online
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9)
          `,
          [
            randomUUID(),
            submission.student_id,
            assignment.subject_id,
            teacher.id,
            assignment.section_id,
            assignment.type === "quiz" ? "online_quiz" : "assignment",
            marks,
            assignment.max_marks,
            assignment.type === "quiz",
          ]
        );
      }
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/attendance", async (req, res, next) => {
  try {
    const {
      teacher_assignment_id = "",
      timetable_id = "",
      date = new Date().toISOString().slice(0, 10),
      sort = "default",
    } = req.query;
    const assignments = await getTeacherAssignments(req.user.id);
    const assignmentIds = teacher_assignment_id
      ? [String(teacher_assignment_id)]
      : assignments.rows.map((row) => row.id);

    if (!assignmentIds.length) {
      return res.json({ success: true, data: { subjects: [], students: [] } });
    }

    const roster = await query(
      `
        SELECT
          u.name,
          s.id AS student_id,
          s.roll_number,
          sec.class_name,
          sec.name AS section_name,
          COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present_count,
          COUNT(ar.id) AS total_count
        FROM students s
        JOIN users u ON u.id = s.user_id
        JOIN sections sec ON sec.id = s.section_id
        JOIN teacher_assignments ta ON ta.section_id = sec.id
        LEFT JOIN attendance_sessions sess ON sess.teacher_assignment_id = ta.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = s.id
        WHERE ta.id = ANY($1::text[])
        GROUP BY u.name, s.id, s.roll_number, sec.class_name, sec.name
      `,
      [assignmentIds]
    );

    const currentSession = timetable_id
      ? await query(
          `
            SELECT ar.student_id, ar.status
            FROM attendance_sessions sess
            JOIN attendance_records ar ON ar.session_id = sess.id
            WHERE sess.timetable_id = $1 AND sess.date = $2
          `,
          [String(timetable_id), date]
        )
      : { rows: [] };
    const currentStatusMap = new Map(currentSession.rows.map((row) => [row.student_id, row.status]));

    let students = roster.rows.map((row) => {
      const overall = Number(row.total_count)
        ? Number(((Number(row.present_count) / Number(row.total_count)) * 100).toFixed(1))
        : 0;
      return {
        id: row.student_id,
        name: row.name,
        roll: row.roll_number,
        className: row.class_name,
        sectionName: row.section_name,
        presentCount: Number(row.present_count || 0),
        totalCount: Number(row.total_count || 0),
        overall,
        currentStatus: currentStatusMap.get(row.student_id) || "unmarked",
      };
    });

    if (sort === "highest") {
      students = students.sort((a, b) => b.overall - a.overall);
    } else if (sort === "lowest") {
      students = students.sort((a, b) => a.overall - b.overall);
    }

    res.json({
      success: true,
      data: {
        subjects: assignments.rows.map((row) => ({
          id: row.id,
          subject: row.subject_name,
          className: row.class_name,
          sectionName: row.section_name,
          timetable: row.timetable || [],
        })),
        selectedDate: date,
        selectedTimetableId: String(timetable_id),
        students,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/attendance", async (req, res, next) => {
  try {
    const { teacher_assignment_id, timetable_id, date, records = [] } = req.body;
    const teacher = await getTeacherByUserId(req.user.id);
    if (!teacher_assignment_id || !timetable_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "teacher_assignment_id, timetable_id, date, and records are required." });
    }

    let sessionId;
    await withTransaction(async (client) => {
      const session = await client.query(
        `
          INSERT INTO attendance_sessions (id, teacher_assignment_id, timetable_id, date, created_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (timetable_id, date)
          DO UPDATE SET created_by = EXCLUDED.created_by, teacher_assignment_id = EXCLUDED.teacher_assignment_id
          RETURNING id
        `,
        [randomUUID(), teacher_assignment_id, timetable_id, date, teacher.id]
      );
      sessionId = session.rows[0].id;

      for (const record of records) {
        await client.query(
          `
            INSERT INTO attendance_records (id, session_id, student_id, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (session_id, student_id)
            DO UPDATE SET status = EXCLUDED.status, marked_at = NOW()
          `,
          [randomUUID(), sessionId, record.student_id, record.status]
        );
      }
    });

    res.json({ success: true, data: { session_id: sessionId } });
  } catch (error) {
    next(error);
  }
});

router.patch("/requests/:id", async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected." });
    }

    const teacher = await getTeacherByUserId(req.user.id);
    const requestResult = await query(
      `
        SELECT
          r.*,
          ar.id AS attendance_record_id,
          ar.student_id,
          sess.teacher_assignment_id
        FROM requests r
        JOIN attendance_records ar ON ar.id = r.target_id
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        WHERE r.id = $1
          AND r.type = 'attendance_change'
          AND ta.teacher_id = $2
        LIMIT 1
      `,
      [req.params.id, teacher.id]
    );

    const requestRow = requestResult.rows[0];
    if (!requestRow) {
      return res.status(404).json({ success: false, message: "Request not found." });
    }

    const newValue = parseJson(requestRow.new_value, {});

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE requests
          SET status = $2,
              reviewed_by = $3,
              reviewed_at = NOW()
          WHERE id = $1
        `,
        [req.params.id, status, req.user.id]
      );

      if (status === "approved" && newValue.status) {
        await client.query(
          `UPDATE attendance_records SET status = $2, marked_at = NOW() WHERE id = $1`,
          [requestRow.attendance_record_id, newValue.status]
        );
      }

      await createNotification(client, {
        userId: requestRow.user_id,
        title: `Attendance request ${status}`,
        message:
          status === "approved"
            ? "Your attendance correction request was approved by the teacher."
            : "Your attendance correction request was rejected by the teacher.",
        type: "alert",
        actionUrl: "/student/attendance",
      });
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/marks", async (req, res, next) => {
  try {
    const { teacher_assignment_id = "", exam_type = "" } = req.query;
    const assignments = await getTeacherAssignments(req.user.id);
    const assignmentIds = teacher_assignment_id
      ? [String(teacher_assignment_id)]
      : assignments.rows.map((row) => row.id);

    if (!assignmentIds.length) {
      return res.json({ success: true, data: { board: [], exams: [] } });
    }

    const board = await query(
      `
        SELECT
          st.id AS student_id,
          u.name,
          st.roll_number,
          sec.class_name,
          sec.name AS section_name,
          sub.name AS subject_name,
          ta.id AS teacher_assignment_id,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'mark_id', m.id,
                'exam_type', m.exam_type,
                'marks_obtained', m.marks_obtained,
                'max_marks', m.max_marks,
                'date', m.date
              )
            ) FILTER (WHERE m.id IS NOT NULL),
            '[]'::json
          ) AS marks
        FROM teacher_assignments ta
        JOIN sections sec ON sec.id = ta.section_id
        JOIN students st ON st.section_id = sec.id
        JOIN users u ON u.id = st.user_id
        JOIN subjects sub ON sub.id = ta.subject_id
        LEFT JOIN marks m ON m.student_id = st.id AND m.subject_id = ta.subject_id AND ($2 = '' OR m.exam_type = $2)
        WHERE ta.id = ANY($1::text[])
        GROUP BY st.id, u.name, st.roll_number, sec.class_name, sec.name, sub.name, ta.id
        ORDER BY u.name
      `,
      [assignmentIds, String(exam_type)]
    );

    const exams = await query(
      `
        SELECT e.*, sub.name AS subject_name, sec.class_name, sec.name AS section_name
        FROM exams e
        JOIN subjects sub ON sub.id = e.subject_id
        JOIN sections sec ON sec.id = e.section_id
        JOIN teacher_assignments ta ON ta.subject_id = e.subject_id AND ta.section_id = e.section_id
        JOIN teachers t ON t.id = ta.teacher_id
        WHERE t.user_id = $1
        ORDER BY e.date
      `,
      [req.user.id]
    );

    res.json({ success: true, data: { board: board.rows, exams: exams.rows } });
  } catch (error) {
    next(error);
  }
});

router.put("/marks", async (req, res, next) => {
  try {
    const { student_id, subject_id, section_id, exam_type, marks, max_marks = 100, date, is_online = false } = req.body;
    const teacher = await getTeacherByUserId(req.user.id);
    let resolvedSectionId = section_id;

    if (!resolvedSectionId) {
      const studentSection = await query(
        `SELECT section_id FROM students WHERE id = $1 LIMIT 1`,
        [student_id]
      );
      resolvedSectionId = studentSection.rows[0]?.section_id || null;
    }

    await query(
      `
        INSERT INTO marks (id, student_id, subject_id, teacher_id, section_id, exam_type, marks_obtained, max_marks, date, is_online)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (student_id, subject_id, teacher_id, section_id, exam_type, date)
        DO UPDATE SET
          marks_obtained = EXCLUDED.marks_obtained,
          max_marks = EXCLUDED.max_marks,
          is_online = EXCLUDED.is_online
      `,
      [randomUUID(), student_id, subject_id, teacher.id, resolvedSectionId, exam_type, marks, max_marks, date, is_online]
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

async function runAnalysis(req, res, next) {
  try {
    const { teacher_assignment_id = "", roll_number = "" } = req.query;
    const assignments = await getTeacherAssignments(req.user.id);
    const selectedAssignments = teacher_assignment_id
      ? assignments.rows.filter((row) => row.id === String(teacher_assignment_id))
      : assignments.rows;

    if (!selectedAssignments.length) {
      return res.json({
        success: true,
        data: {
          students: [],
          distribution: [],
          marksOverTime: [],
          attendanceVsMarks: [],
          summary: { totalStudents: 0, atRisk: 0, avgClassScore: 0, avgAttendance: 0 },
        },
      });
    }

    const studentsResult = await query(
      `
        SELECT
          st.id AS student_id,
          st.roll_number,
          u.name,
          ta.subject_id,
          sub.name AS subject_name,
          sec.class_name,
          sec.name AS section_name
        FROM teacher_assignments ta
        JOIN sections sec ON sec.id = ta.section_id
        JOIN students st ON st.section_id = sec.id
        JOIN users u ON u.id = st.user_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ta.id = ANY($1::text[])
          AND ($2 = '' OR st.roll_number = $2)
        ORDER BY u.name
      `,
      [selectedAssignments.map((row) => row.id), String(roll_number)]
    );

    const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const predictions = [];

    for (const student of studentsResult.rows) {
      const { payload, summary } = await buildPredictionPayload(student, student.subject_id);
      let predictionData;
      try {
        const response = await axios.post(`${mlUrl}/predict`, payload, { timeout: 7000 });
        predictionData = response.data;
      } catch {
        const avgScore = payload.avg_marks;
        predictionData = {
          prediction: avgScore >= 80 ? "Good" : avgScore >= 60 ? "Average" : "At Risk",
          predicted_grade: toFriendlyGrade(avgScore),
          pass_prediction: avgScore >= 50,
          confidence: 0.72,
          factors:
            avgScore >= 80
              ? ["Stable scores", "Healthy attendance"]
              : avgScore >= 60
              ? ["Moderate consistency", "Needs stronger finals preparation"]
              : ["Low attendance", "Weak assignment follow-through"],
        };
      }

      await storePrediction(student.student_id, student.subject_id, {
        ...payload,
        ...predictionData,
      });

      predictions.push({
        id: student.student_id,
        name: student.name,
        roll: student.roll_number,
        subject: student.subject_name,
        className: student.class_name,
        sectionName: student.section_name,
        ...payload,
        ...predictionData,
        attendance: summary.attendancePct,
      });
    }

    const distributionMap = { Good: 0, Average: 0, "At Risk": 0 };
    predictions.forEach((item) => {
      distributionMap[item.prediction] += 1;
    });

    res.json({
      success: true,
      data: {
        students: predictions,
        distribution: [
          { name: "Good", value: distributionMap.Good, color: "#10b981" },
          { name: "Average", value: distributionMap.Average, color: "#f59e0b" },
          { name: "At Risk", value: distributionMap["At Risk"], color: "#ef4444" },
        ],
        marksOverTime: [
          { month: "Nov", avg: 68 },
          { month: "Dec", avg: 72 },
          { month: "Jan", avg: 75 },
          { month: "Feb", avg: 77 },
          { month: "Mar", avg: 79 },
        ],
        attendanceVsMarks: predictions.map((item) => ({
          name: item.name,
          attendance: item.attendance,
          marks: item.avg_marks,
        })),
        summary: {
          totalStudents: predictions.length,
          atRisk: distributionMap["At Risk"],
          avgClassScore: Math.round(average(predictions.map((item) => item.avg_marks))),
          avgAttendance: Math.round(average(predictions.map((item) => item.attendance))),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

router.get("/analysis", runAnalysis);
router.get("/analytics", runAnalysis);

router.post("/predict", async (req, res, next) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || "http://localhost:8000";
    const response = await axios.post(`${mlUrl}/predict`, req.body, { timeout: 7000 });
    res.json({ success: true, data: response.data });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getUserById(req.user.id) });
  } catch (error) {
    next(error);
  }
});

router.post("/profile/request", async (req, res, next) => {
  try {
    const currentUser = await getUserById(req.user.id);
    let result;
    await withTransaction(async (client) => {
      result = await client.query(
        `
          INSERT INTO requests (id, user_id, type, target_id, old_value, new_value, status)
          VALUES ($1, $2, 'profile_update', $3, $4::jsonb, $5::jsonb, 'pending')
          RETURNING *
        `,
        [
          randomUUID(),
          req.user.id,
          req.user.id,
          JSON.stringify(currentUser),
          JSON.stringify(req.body),
        ]
      );

      const admins = await client.query(`SELECT user_id FROM admins`);
      for (const admin of admins.rows) {
        await createNotification(client, {
          userId: admin.user_id,
          title: "Teacher profile update request",
          message: `${currentUser.name} submitted a profile update request.`,
          type: "request",
          actionUrl: "/admin/dashboard",
        });
      }
    });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

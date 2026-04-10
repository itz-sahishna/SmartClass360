const express = require("express");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roleGuard");
const { query, withTransaction } = require("../db");
const {
  randomUUID,
  parseJson,
  getStudentByUserId,
  getUserById,
  average,
  toFriendlyGrade,
} = require("../db/helpers");

const router = express.Router();

router.use(auth, roleGuard("student"));

async function getStudentSubjects(userId) {
  return query(
    `
      SELECT
        st.id AS student_id,
        st.roll_number,
        sec.id AS section_id,
        sec.class_name,
        sec.name AS section_name,
        ay.year_number,
        ay.academic_year,
        sub.id AS subject_id,
        sub.name AS subject_name,
        sub.code,
        sub.syllabus,
        sub.semester,
        sub.credits,
        u_teacher.name AS teacher_name,
        ta.id AS teacher_assignment_id,
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
        ) AS timetable,
        COALESCE(
          (
            SELECT json_agg(
              jsonb_build_object(
                'id', m.id,
                'title', m.title,
                'description', m.description,
                'file_url', m.file_url,
                'material_type', m.material_type,
                'created_at', m.created_at
              )
              ORDER BY m.created_at DESC
            )
            FROM materials m
            WHERE m.teacher_assignment_id = ta.id
          ),
          '[]'::json
        ) AS materials
      FROM students st
      JOIN sections sec ON sec.id = st.section_id
      JOIN academic_years ay ON ay.id = sec.year_id
      JOIN teacher_assignments ta ON ta.section_id = sec.id
      JOIN subjects sub ON sub.id = ta.subject_id
      JOIN teachers teacher ON teacher.id = ta.teacher_id
      JOIN users u_teacher ON u_teacher.id = teacher.user_id
      WHERE st.user_id = $1
      GROUP BY st.id, st.roll_number, sec.id, sec.class_name, sec.name, ay.year_number, ay.academic_year, sub.id, sub.name, sub.code, sub.syllabus, sub.semester, sub.credits, u_teacher.name, ta.id
      ORDER BY sub.name
    `,
    [userId]
  );
}

async function buildCurrentAnalysis(studentUserId) {
  const student = await getStudentByUserId(studentUserId);
  const subjects = await getStudentSubjects(studentUserId);
  const subjectIds = subjects.rows.map((row) => row.subject_id);
  const studentId = student.id;

  const [marksResult, attendanceResult, performanceResult] = await Promise.all([
    subjectIds.length
      ? query(`SELECT * FROM marks WHERE student_id = $1 AND subject_id = ANY($2::text[]) ORDER BY date`, [studentId, subjectIds])
      : { rows: [] },
    query(
      `
        SELECT ta.subject_id, ar.status, sess.date
        FROM attendance_records ar
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        WHERE ar.student_id = $1
        ORDER BY sess.date
      `,
      [studentId]
    ),
    query(
      `SELECT * FROM student_performance WHERE student_id = $1 ORDER BY generated_at DESC`,
      [studentId]
    ),
  ]);

  const marks = marksResult.rows.map((row) => Number(row.marks_obtained));
  const overallScore = average(marks);
  const presentCount = attendanceResult.rows.filter((row) => row.status === "present").length;
  const attendancePct = attendanceResult.rows.length
    ? (presentCount / attendanceResult.rows.length) * 100
    : 0;

  const subjectMarks = subjects.rows.map((subject) => {
    const rows = marksResult.rows.filter((row) => row.subject_id === subject.subject_id);
    const avg = average(rows.map((row) => Number(row.marks_obtained)));
    return {
      subject: subject.subject_name,
      code: subject.code,
      marks: avg,
      grade: toFriendlyGrade(avg),
      improvement:
        avg >= 80
          ? "Keep your revision momentum and practice advanced questions."
          : avg >= 60
          ? "Increase weekly revision and attempt more timed tests in this subject."
          : "Focus on fundamentals, attend support sessions, and complete every assignment on time.",
    };
  });

  const latestPerformance = performanceResult.rows[0]
    ? parseJson(performanceResult.rows[0].insights, {})
    : { factors: [], improvements: [] };

  return {
    overallScore: Number(overallScore.toFixed(1)),
    trend: overallScore >= 75 ? "+4%" : overallScore >= 60 ? "+1%" : "-3%",
    topicUnderstanding: Math.round((overallScore + attendancePct) / 2),
    strengths: subjectMarks.filter((item) => item.marks >= 80).map((item) => item.subject),
    weaknesses: subjectMarks.filter((item) => item.marks < 70).map((item) => item.subject),
    progress: Math.round((overallScore + attendancePct) / 2),
    subjectMarks,
    marksOverTime: marksResult.rows.map((row) => ({
      month: new Date(row.date).toLocaleDateString("en-US", { month: "short" }),
      marks: Number(row.marks_obtained),
      examType: row.exam_type,
    })),
    radarData: [
      { metric: "Attendance", score: Math.round(attendancePct) },
      { metric: "Assignments", score: Math.round(average(marksResult.rows.filter((row) => row.exam_type === "assignment").map((row) => Number(row.marks_obtained)))) },
      { metric: "Exam Scores", score: Math.round(overallScore) },
      { metric: "Consistency", score: Math.round(overallScore >= 80 ? 88 : overallScore >= 60 ? 74 : 58) },
      { metric: "Participation", score: Math.round(attendancePct >= 80 ? 84 : 65) },
    ],
    factors: latestPerformance.factors?.length
      ? latestPerformance.factors
      : [
          "Your current performance is based only on existing attendance, marks, and assignment records.",
          "Use the subject-level improvement notes below to prioritize revision.",
        ],
    improvements: subjectMarks.map((item) => ({
      subject: item.subject,
      how: item.improvement,
    })),
  };
}

async function notifyAdmins(client, title, message, actionUrl) {
  const admins = await client.query(`SELECT user_id FROM admins`);
  for (const admin of admins.rows) {
    await client.query(
      `
        INSERT INTO notifications (id, user_id, title, message, type, action_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [randomUUID(), admin.user_id, title, message, "request", actionUrl || "/admin/dashboard"]
    );
  }
}

router.get("/dashboard", async (req, res, next) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    const subjects = await getStudentSubjects(req.user.id);
    const teacherAssignmentIds = subjects.rows.map((row) => row.teacher_assignment_id);

    const [assignmentsResult, notificationsResult, analysis] = await Promise.all([
      teacherAssignmentIds.length
        ? query(
            `
              SELECT
                a.id,
                a.title,
                a.description,
                a.due_date,
                a.type,
                sub.name AS subject_name,
                s.status
              FROM assignments a
              JOIN subjects sub ON sub.id = a.subject_id
              JOIN submissions s ON s.assignment_id = a.id
              WHERE s.student_id = $1 AND a.teacher_assignment_id = ANY($2::text[])
              ORDER BY a.due_date
            `,
            [student.id, teacherAssignmentIds]
          )
        : { rows: [] },
      query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [req.user.id]
      ),
      buildCurrentAnalysis(req.user.id),
    ]);

    const reminders = notificationsResult.rows
      .filter((item) => item.type === "reminder")
      .map((item) => ({
        id: item.id,
        title: item.title,
        due: new Date(item.created_at).toLocaleDateString(),
        subject: item.message,
        actionUrl: item.action_url,
      }));

    const dueAssignments = assignmentsResult.rows.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subject_name,
      dueDate: assignment.due_date,
      status: assignment.status,
      description: assignment.description,
      type: assignment.type,
    }));

    res.json({
      success: true,
      data: {
        reminders,
        dueAssignments,
        notifications: notificationsResult.rows,
        currentAnalysis: analysis,
        quickStats: {
          enrolledSubjects: subjects.rows.length,
          pendingAssignments: dueAssignments.filter((item) => item.status === "pending").length,
          unreadNotifications: notificationsResult.rows.filter((item) => !item.is_read).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/attendance", async (req, res, next) => {
  try {
    const { subject_id = "" } = req.query;
    const student = await getStudentByUserId(req.user.id);
    const result = await query(
      `
        SELECT
          ar.id AS attendance_record_id,
          ar.status,
          sess.date,
          sess.timetable_id,
          sub.id AS subject_id,
          sub.name AS subject_name,
          sub.code,
          tt.day_of_week,
          to_char(tt.start_time, 'HH24:MI') AS start_time,
          to_char(tt.end_time, 'HH24:MI') AS end_time,
          tt.room
        FROM attendance_records ar
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        JOIN subjects sub ON sub.id = ta.subject_id
        LEFT JOIN timetables tt ON tt.id = sess.timetable_id
        WHERE ar.student_id = $1
          AND ($2 = '' OR sub.id = $2)
        ORDER BY sess.date DESC
      `,
      [student.id, String(subject_id)]
    );

    const subjectsMap = new Map();
    const dayMap = new Map();
    result.rows.forEach((row) => {
      const subjectEntry = subjectsMap.get(row.subject_id) || {
        subject_id: row.subject_id,
        subject: row.subject_name,
        code: row.code,
        present: 0,
        total: 0,
      };
      subjectEntry.total += 1;
      if (row.status === "present") subjectEntry.present += 1;
      subjectsMap.set(row.subject_id, subjectEntry);

      const dayKey = row.date.toISOString().slice(0, 10);
      const dayEntry = dayMap.get(dayKey) || { date: dayKey, attended: 0, total: 0 };
      dayEntry.total += 1;
      if (row.status === "present") dayEntry.attended += 1;
      dayMap.set(dayKey, dayEntry);
    });

    const subjects = Array.from(subjectsMap.values()).map((row) => ({
      ...row,
      percentage: row.total ? Number(((row.present / row.total) * 100).toFixed(1)) : 0,
    }));

    res.json({
      success: true,
      data: {
        overall: Math.round(average(subjects.map((row) => row.percentage))),
        subjects,
        dailyBreakdown: Array.from(dayMap.values()),
        records: result.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/attendance/request", async (req, res, next) => {
  try {
    const { attendance_record_id, status, note } = req.body;
    if (!attendance_record_id || !status) {
      return res.status(400).json({ success: false, message: "attendance_record_id and status are required." });
    }

    const record = await query(
      `
        SELECT ar.*, sess.date, sub.name AS subject_name
        FROM attendance_records ar
        JOIN attendance_sessions sess ON sess.id = ar.session_id
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        JOIN subjects sub ON sub.id = ta.subject_id
        WHERE ar.id = $1
      `,
      [attendance_record_id]
    );

    const currentRecord = record.rows[0];
    if (!currentRecord) {
      return res.status(404).json({ success: false, message: "Attendance record not found." });
    }

    let created;
    const ownerResult = await query(
      `
        SELECT ta.id, teacher.user_id
        FROM attendance_sessions sess
        JOIN teacher_assignments ta ON ta.id = sess.teacher_assignment_id
        JOIN teachers teacher ON teacher.id = ta.teacher_id
        WHERE sess.id = $1
        LIMIT 1
      `,
      [currentRecord.session_id]
    );
    const owner = ownerResult.rows[0];

    await withTransaction(async (client) => {
      created = await client.query(
          `
            INSERT INTO requests (id, user_id, type, target_id, old_value, new_value, status)
            VALUES ($1, $2, 'attendance_change', $3, $4::jsonb, $5::jsonb, 'pending')
            RETURNING *
          `,
          [
            randomUUID(),
            req.user.id,
            currentRecord.id,
            JSON.stringify(currentRecord),
            JSON.stringify({ attendance_record_id, status, note }),
          ]
      );

      if (owner?.user_id) {
        await client.query(
            `
              INSERT INTO notifications (id, user_id, title, message, type, action_url)
              VALUES ($1, $2, $3, $4, 'request', $5)
            `,
            [
              randomUUID(),
              owner.user_id,
              "Attendance correction request",
              `${req.user.name || "A student"} requested an attendance change for ${currentRecord.subject_name}.`,
              "/teacher/dashboard",
            ]
        );
      }
    });

    res.status(201).json({ success: true, data: created.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get("/subjects", async (req, res, next) => {
  try {
    const subjects = await getStudentSubjects(req.user.id);
    const marksResult = await query(
      `
        SELECT m.subject_id, AVG(m.marks_obtained) AS avg_marks
        FROM marks m
        JOIN students st ON st.id = m.student_id
        WHERE st.user_id = $1
        GROUP BY m.subject_id
      `,
      [req.user.id]
    );
    const markMap = new Map(marksResult.rows.map((row) => [row.subject_id, Number(row.avg_marks)]));

    res.json({
      success: true,
      data: subjects.rows.map((row) => ({
        id: row.subject_id,
        name: row.subject_name,
        code: row.code,
        syllabus: row.syllabus,
        semester: row.semester,
        credits: row.credits,
        teacher: row.teacher_name,
        className: row.class_name,
        sectionName: row.section_name,
        yearNumber: row.year_number,
        academicYear: row.academic_year,
        averageMarks: markMap.get(row.subject_id) || 0,
        timetable: row.timetable || [],
        materials: row.materials || [],
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/assignments", async (req, res, next) => {
  try {
    const { id = "" } = req.query;
    const student = await getStudentByUserId(req.user.id);
    const subjects = await getStudentSubjects(req.user.id);
    const assignmentIds = subjects.rows.map((row) => row.teacher_assignment_id);
    if (!assignmentIds.length) {
      return res.json({ success: true, data: [] });
    }
    const result = await query(
      `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_date,
          a.scheduled_at,
          a.type,
          a.max_marks,
          sub.name AS subject_name,
          s.status,
          s.marks,
          s.file_url,
          s.submitted_text,
          s.answers,
          s.submitted_at,
          COALESCE(
            (
              SELECT json_agg(
                jsonb_build_object(
                  'id', q.id,
                  'question_text', q.question_text,
                  'question_type', q.question_type,
                  'marks', q.marks,
                  'display_order', q.display_order,
                  'options',
                    COALESCE(
                      (
                        SELECT json_agg(
                          jsonb_build_object(
                            'id', qo.id,
                            'option_text', qo.option_text,
                            'display_order', qo.display_order
                          )
                          ORDER BY qo.display_order
                        )
                        FROM assignment_question_options qo
                        WHERE qo.question_id = q.id
                      ),
                      '[]'::json
                    )
                )
                ORDER BY q.display_order
              )
              FROM assignment_questions q
              WHERE q.assignment_id = a.id
            ),
            '[]'::json
          ) AS questions
        FROM assignments a
        JOIN subjects sub ON sub.id = a.subject_id
        JOIN submissions s ON s.assignment_id = a.id
        WHERE s.student_id = $1
          AND a.teacher_assignment_id = ANY($2::text[])
          AND ($3 = '' OR a.id = $3)
        ORDER BY a.due_date DESC
      `,
      [student.id, assignmentIds, String(id)]
    );
    res.json({ success: true, data: id ? result.rows[0] || null : result.rows });
  } catch (error) {
    next(error);
  }
});

router.post("/assignments/:id/submit", async (req, res, next) => {
  try {
    const { file_url = "", submitted_text = "", answers = {} } = req.body;
    const student = await getStudentByUserId(req.user.id);
    const assignmentResult = await query(
      `
        SELECT
          a.*,
          ta.teacher_id,
          ta.section_id,
          s.id AS submission_id,
          s.status AS submission_status
        FROM assignments a
        JOIN teacher_assignments ta ON ta.id = a.teacher_assignment_id
        JOIN submissions s ON s.assignment_id = a.id
        WHERE a.id = $1 AND s.student_id = $2
        LIMIT 1
      `,
      [req.params.id, student.id]
    );

    const assignment = assignmentResult.rows[0];
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found for this student." });
    }

    const now = new Date();
    if (assignment.scheduled_at && now < new Date(assignment.scheduled_at)) {
      return res.status(400).json({ success: false, message: "This assignment is not open yet." });
    }
    if (now > new Date(assignment.due_date)) {
      return res.status(400).json({ success: false, message: "The due date has passed. Submission is closed." });
    }

    let marks = null;
    if (assignment.type === "quiz") {
      const questions = await query(
        `SELECT id, correct_option_index, marks FROM assignment_questions WHERE assignment_id = $1`,
        [assignment.id]
      );
      marks = questions.rows.reduce((total, question) => {
        const selected = Number(answers?.[question.id]);
        return selected === Number(question.correct_option_index)
          ? total + Number(question.marks || 0)
          : total;
      }, 0);
    }

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE submissions
          SET file_url = $2,
              submitted_text = $3,
              answers = $4::jsonb,
              submitted_at = NOW(),
              marks = COALESCE($5, marks),
              status = 'submitted'
          WHERE id = $1
        `,
        [
          assignment.submission_id,
          file_url || null,
          submitted_text || null,
          JSON.stringify(answers || {}),
          marks,
        ]
      );

      if (assignment.type === "quiz" && marks !== null) {
        await client.query(
          `
            INSERT INTO marks (id, student_id, subject_id, teacher_id, section_id, exam_type, marks_obtained, max_marks, date, is_online)
            VALUES ($1, $2, $3, $4, $5, 'online_quiz', $6, $7, CURRENT_DATE, TRUE)
            ON CONFLICT (student_id, subject_id, teacher_id, section_id, exam_type, date)
            DO UPDATE SET
              marks_obtained = EXCLUDED.marks_obtained,
              max_marks = EXCLUDED.max_marks,
              is_online = TRUE
          `,
          [
            randomUUID(),
            student.id,
            assignment.subject_id,
            assignment.teacher_id,
            assignment.section_id,
            marks,
            assignment.max_marks,
          ]
        );
      }
    });

    res.json({ success: true, data: { submission_id: assignment.submission_id, marks } });
  } catch (error) {
    next(error);
  }
});

router.get("/exams", async (req, res, next) => {
  try {
    const student = await getStudentByUserId(req.user.id);
    const [upcoming, results] = await Promise.all([
      query(
        `
          SELECT e.*, sub.name AS subject_name, sec.class_name, sec.name AS section_name
          FROM exams e
          JOIN subjects sub ON sub.id = e.subject_id
          JOIN sections sec ON sec.id = e.section_id
          WHERE e.section_id = $1
          ORDER BY e.date
        `,
        [student.section_id]
      ),
      query(
        `
          SELECT m.*, sub.name AS subject_name
          FROM marks m
          JOIN subjects sub ON sub.id = m.subject_id
          WHERE m.student_id = $1
          ORDER BY m.date DESC
        `,
        [student.id]
      ),
    ]);

    res.json({
      success: true,
      data: {
        upcoming: upcoming.rows,
        results: results.rows.map((row) => ({
          ...row,
          grade: toFriendlyGrade((Number(row.marks_obtained) / Number(row.max_marks)) * 100),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/analysis", async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildCurrentAnalysis(req.user.id) });
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

router.get("/timetable", async (req, res, next) => {
  try {
    const subjects = await getStudentSubjects(req.user.id);
    const grouped = {};
    subjects.rows.forEach((subject) => {
      (subject.timetable || []).forEach((slot) => {
        if (!grouped[slot.day]) grouped[slot.day] = [];
        grouped[slot.day].push({
          time: `${slot.start} - ${slot.end}`,
          subject: subject.subject_name,
          teacher: subject.teacher_name,
          room: slot.room,
          className: subject.class_name,
          sectionName: subject.section_name,
        });
      });
    });
    res.json({ success: true, data: grouped });
  } catch (error) {
    next(error);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const [user, student] = await Promise.all([
      getUserById(req.user.id),
      getStudentByUserId(req.user.id),
    ]);
    res.json({
      success: true,
      data: {
        ...user,
        roll_number: student.roll_number,
        class_name: student.class_name,
        section_name: student.section_name,
        year: student.year_number,
        academic_year: student.academic_year,
        department: student.department_name,
        section_id: student.section_id,
      },
    });
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

      await notifyAdmins(
        client,
        "Student profile update request",
        `${currentUser.name} submitted a profile update request.`,
        "/admin/dashboard"
      );
    });
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

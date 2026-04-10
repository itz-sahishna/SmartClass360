'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { teacherApi } from '@/lib/api';

interface TeachingAssignment {
  id: string;
  name: string;
  class_name: string;
  section_name: string;
  subject_id: string;
}

interface MarksRow {
  student_id: string;
  name: string;
  roll_number: string;
  class_name: string;
  section_name: string;
  subject_name: string;
  teacher_assignment_id: string;
  marks: { mark_id: string; exam_type: string; marks_obtained: number; max_marks: number; date: string }[];
}

interface ExamRow {
  id: string;
  subject_name: string;
  class_name: string;
  section_name: string;
  exam_type: string;
  date: string;
  max_marks: number;
}

export default function TeacherMarksPage() {
  const [subjects, setSubjects] = useState<TeachingAssignment[]>([]);
  const [board, setBoard] = useState<MarksRow[]>([]);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [examType, setExamType] = useState('mid');
  const [draftMarks, setDraftMarks] = useState<Record<string, string>>({});

  const loadData = (assignment = selectedAssignment, type = examType) => {
    teacherApi.getSubjects().then((res) => setSubjects(res.data.data)).catch(console.error);
    teacherApi.getMarks({ teacher_assignment_id: assignment || undefined, exam_type: type || undefined }).then((res) => {
      setBoard(res.data.data.board);
      setExams(res.data.data.exams);
    }).catch(console.error);
  };

  useEffect(() => {
    loadData('', 'mid');
  }, []);

  const selectedSubject = subjects.find((item) => item.id === selectedAssignment);

  return (
    <AppShell
      role="teacher"
      title="Marks"
      subtitle="Select the class, subject, and exam type to enter marks, including online quiz marks stored in the database."
    >
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Marks Filters" subtitle="Choose the teaching assignment and exam type before entering marks." />
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_220px_auto]">
            <select
              value={selectedAssignment}
              onChange={(event) => {
                setSelectedAssignment(event.target.value);
                loadData(event.target.value, examType);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="">Select class + subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name} - {subject.class_name} Section {subject.section_name}</option>
              ))}
            </select>
            <select
              value={examType}
              onChange={(event) => {
                setExamType(event.target.value);
                loadData(selectedAssignment, event.target.value);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="mid">Mid</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="online_quiz">Online Quiz</option>
              <option value="final">Final</option>
            </select>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Marks Entry" subtitle="Choose marks per student for the selected exam type." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Class</th>
                  <th className="px-6 py-4 font-medium">Existing Entries</th>
                  <th className="px-6 py-4 font-medium">Add / Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {board.map((row) => (
                  <tr key={row.student_id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{row.roll_number}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{row.class_name} - Section {row.section_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      {row.marks.length ? row.marks.map((mark) => `${mark.exam_type}: ${mark.marks_obtained}/${mark.max_marks}`).join(', ') : 'No marks yet'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          value={draftMarks[row.student_id] ?? ''}
                          onChange={(event) => setDraftMarks((prev) => ({ ...prev, [row.student_id]: event.target.value }))}
                          className="w-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                          placeholder="Marks"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedSubject) return;
                            const marksValue = Number(draftMarks[row.student_id] ?? '');
                            if (Number.isNaN(marksValue)) return;
                            await teacherApi.updateMarks({
                              student_id: row.student_id,
                              subject_id: selectedSubject.subject_id,
                              exam_type: examType,
                              marks: marksValue,
                              max_marks: examType.includes('quiz') ? 20 : 100,
                              date: new Date().toISOString().slice(0, 10),
                              is_online: examType === 'online_quiz',
                            });
                            loadData(selectedAssignment, examType);
                          }}
                          className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraftMarks((prev) => ({ ...prev, [row.student_id]: '' }))}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Upcoming Exams Overview" subtitle="Upcoming exams stored for the sections and subjects you teach." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Class</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Max Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exams.map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{exam.subject_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{exam.class_name} - Section {exam.section_name}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{exam.exam_type}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(exam.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{exam.max_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

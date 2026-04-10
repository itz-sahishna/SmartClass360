'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { studentApi } from '@/lib/api';

interface ExamData {
  upcoming: { id: string; subject_name: string; exam_type: string; date: string; class_name: string; section_name: string; max_marks: number }[];
  results: { id: string; subject_name: string; exam_type: string; max_marks: number; marks_obtained: number; grade: string; date: string }[];
}

export default function StudentExamsPage() {
  const [data, setData] = useState<ExamData | null>(null);

  useEffect(() => {
    studentApi.getExams().then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title="Exams"
      subtitle="Track upcoming exams for the academic year and the marks your teachers have already posted."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <PanelHeader title="Upcoming Exams" subtitle="Scheduled assessments for your section." />
          <div className="space-y-4 p-6">
            {(data?.upcoming ?? []).map((exam) => (
              <div key={exam.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{exam.subject_name}</p>
                <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">{exam.exam_type}</p>
                <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>{new Date(exam.date).toLocaleDateString()}</p>
                  <p>{exam.class_name} - Section {exam.section_name}</p>
                  <p>Max Marks: {exam.max_marks}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Published Results" subtitle="Marks and grades that have already been posted." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Score</th>
                  <th className="px-6 py-4 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.results ?? []).map((exam) => (
                  <tr key={exam.id}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{exam.subject_name}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 capitalize">{exam.exam_type}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{exam.marks_obtained}/{exam.max_marks}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{exam.grade}</td>
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

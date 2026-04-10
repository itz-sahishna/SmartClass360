'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { teacherApi } from '@/lib/api';

interface SubjectItem {
  id: string;
  subject_id: string;
  name: string;
  code: string;
  semester: string;
  syllabus: string;
  class_name: string;
  section_name: string;
  year_number: number;
  academic_year: string;
  department: string;
  timetable: { day: string; start: string; end: string; room: string }[];
}

export default function TeacherSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    teacherApi.getSubjects().then((res) => setSubjects(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="teacher"
      title="Subjects"
      subtitle="Your assigned subjects, sections, academic year, and timetable-backed teaching schedule."
    >
      <Panel>
        <PanelHeader title="Teaching Load" subtitle="Every subject-section assignment for the current academic cycle." />
        <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{subject.name}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subject.code} | {subject.semester}</p>
                </div>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">Year {subject.year_number}</span>
              </div>
              <div className="mt-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <p>{subject.class_name} - Section {subject.section_name}</p>
                <p>{subject.department} | {subject.academic_year}</p>
                <p className="leading-6">{subject.syllabus}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-white dark:bg-slate-900 p-4 text-xs text-slate-500 dark:text-slate-400">
                {subject.timetable.map((slot) => (
                  <p key={`${subject.id}-${slot.day}-${slot.start}`}>{slot.day}: {slot.start} - {slot.end} ({slot.room})</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

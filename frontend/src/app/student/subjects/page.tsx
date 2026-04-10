'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { studentApi } from '@/lib/api';

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  teacher: string;
  credits: number;
  semester: string;
  syllabus: string;
  className: string;
  sectionName: string;
  yearNumber: number;
  academicYear: string;
  averageMarks: number;
  timetable: { id: string; day: string; start: string; end: string; room: string }[];
  materials: { id: string; title: string; description: string; file_url?: string | null; material_type: string; created_at: string }[];
}

function gradeFromAverage(score: number) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export default function StudentSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  useEffect(() => {
    studentApi.getSubjects().then((res) => setSubjects(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title="Subjects"
      subtitle="Browse the subjects in your academic year, along with faculty, syllabus, and timetable."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {subjects.map((subject) => (
          <Panel key={subject.id}>
            <PanelHeader title={subject.name} subtitle={`${subject.code} | ${subject.teacher}`} />
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span>{subject.credits} credits</span>
                <span>{subject.semester}</span>
                <span>{subject.academicYear}</span>
                <span>Grade {gradeFromAverage(subject.averageMarks)}</span>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Class Details</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {subject.className} - Section {subject.sectionName} - Year {subject.yearNumber}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Current average marks: {subject.averageMarks.toFixed(1)}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Syllabus</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{subject.syllabus}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly Timetable</p>
                <div className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {subject.timetable.map((slot) => (
                    <p key={slot.id}>
                      {slot.day}: {slot.start} - {slot.end} ({slot.room})
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Study Materials</p>
                <div className="mt-3 space-y-3 text-sm">
                  {(subject.materials ?? []).length ? (
                    subject.materials.map((material) => (
                      <div key={material.id} className="rounded-2xl bg-slate-50 dark:bg-slate-950/50 p-4">
                        <p className="font-medium text-slate-900 dark:text-slate-100">{material.title}</p>
                        <p className="mt-1 text-slate-500 dark:text-slate-400">{material.description}</p>
                        {material.file_url ? (
                          <a href={material.file_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-indigo-600 dark:text-indigo-300">
                            Open material
                          </a>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">No materials posted yet.</p>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, BrainCircuit, CalendarClock, CheckCircle2, Clock3, BellRing } from 'lucide-react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { teacherApi } from '@/lib/api';

interface DashboardData {
  welcome?: string;
  schedule: { teacher_assignment_id: string; subject: string; className: string; section: string; room: string; slot: string; day: string }[];
  reminders: { id: string; title: string; priority: string }[];
  notifications: { id: string; title: string; message: string; created_at: string }[];
  pendingRequests: { id: string; student_name: string; roll_number?: string; subject_name?: string; class_name?: string; section_name?: string; attendance_date?: string; created_at: string; new_value?: { status?: string; note?: string } }[];
  quickStats: {
    totalSubjects: number;
    totalStudents: number;
    pendingAssignments: number;
  };
  predictionPreview: {
    prediction: string;
    confidence: number;
    predicted_grade: string;
    factors: string[];
  };
}

export default function TeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    teacherApi.getDashboard().then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  const loadDashboard = () => {
    teacherApi.getDashboard().then((res) => setData(res.data.data)).catch(console.error);
  };

  const teacherName = data?.welcome?.replace('Welcome back, ', '') ?? 'Teacher';

  return (
    <AppShell
      role="teacher"
      title={`Welcome back, ${teacherName}`}
      subtitle="Track classes left for today, student alerts, pending requests, reminders, and prediction snapshots."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/teacher/subjects"><StatCard title="Subjects" value={data?.quickStats.totalSubjects ?? 0} icon={CalendarClock} color="bg-indigo-600" /></Link>
          <Link href="/teacher/attendance"><StatCard title="Assigned Sections" value={data?.quickStats.totalStudents ?? 0} icon={CheckCircle2} color="bg-emerald-600" /></Link>
          <Link href="/teacher/assignments"><StatCard title="Pending Reviews" value={data?.quickStats.pendingAssignments ?? 0} icon={Clock3} color="bg-amber-500" /></Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel>
            <PanelHeader title="Classes Left Today" subtitle="Your timetable blocks for the rest of the day." />
            <div className="space-y-4 p-6">
              {(data?.schedule ?? []).map((item) => (
                <Link key={`${item.teacher_assignment_id}-${item.slot}`} href="/teacher/subjects" className="block rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.subject}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.className} - Section {item.section}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.slot}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.day}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel className="border-slate-900 bg-slate-950 text-white">
            <PanelHeader title="Predictive Snapshot" subtitle="Teacher-only ML overview stored in the database." />
            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                  <BrainCircuit size={22} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Latest category</p>
                  <p className="text-2xl font-bold">{data?.predictionPreview.prediction ?? 'Average'}</p>
                  <p className="text-xs text-slate-400">Predicted grade {data?.predictionPreview.predicted_grade ?? 'B'}</p>
                </div>
              </div>
              <p className="text-sm text-slate-400">Confidence {Math.round((data?.predictionPreview.confidence ?? 0) * 100)}%</p>
              <div className="space-y-3">
                {(data?.predictionPreview.factors ?? []).map((factor) => (
                  <div key={factor} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">{factor}</div>
                ))}
              </div>
              <Link href="/teacher/analysis" className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">Open Full Analysis</Link>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="Pending Student Requests" subtitle="Attendance-related student requests that need teacher attention." />
            <div className="space-y-4 p-6">
              {(data?.pendingRequests ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.student_name}</p>
                    <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.subject_name} · {item.class_name} Section {item.section_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Requested status: {item.new_value?.status ?? 'Pending update'}</p>
                  {item.roll_number ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Roll No: {item.roll_number}</p> : null}
                  {item.attendance_date ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Attendance date: {new Date(item.attendance_date).toLocaleDateString()}</p> : null}
                  {item.new_value?.note ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.new_value.note}</p> : null}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        await teacherApi.reviewRequest(item.id, 'approved');
                        loadDashboard();
                      }}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await teacherApi.reviewRequest(item.id, 'rejected');
                        loadDashboard();
                      }}
                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="space-y-6">
            <Panel>
              <PanelHeader title="Reminders" subtitle="Priority actions for the rest of the week." />
              <div className="space-y-4 p-6">
                {(data?.reminders ?? []).map((item) => (
                  <Link key={item.id} href={item.title.toLowerCase().includes('submission') ? '/teacher/assignments' : '/teacher/attendance'} className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                    <AlertTriangle className={item.priority === 'high' ? 'text-red-500' : 'text-amber-500'} size={18} />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      <p className="mt-1 text-sm capitalize text-slate-500 dark:text-slate-400">{item.priority} priority</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Student Notifications" subtitle="Submissions, tests, and student-generated alerts." />
              <div className="space-y-4 p-6">
                {(data?.notifications ?? []).map((item) => (
                  <Link key={item.id} href="/teacher/notifications" className="block rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BellRing size={16} className="text-indigo-500" />
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.message}</p>
                  </Link>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bot, CalendarCheck2, ClipboardCheck, Sparkles } from 'lucide-react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { studentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardData {
  reminders: { id: string; title: string; due: string; subject: string; actionUrl?: string }[];
  dueAssignments: { id: string; title: string; subject: string; dueDate: string; status: string; description: string; type: string }[];
  notifications: { id: string; title: string; message: string; created_at: string }[];
  currentAnalysis: {
    topicUnderstanding: number;
    strengths: string[];
    weaknesses: string[];
    progress: number;
  };
  quickStats: {
    enrolledSubjects: number;
    pendingAssignments: number;
    unreadNotifications: number;
  };
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    studentApi.getDashboard().then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title={`Welcome back, ${user?.name ?? 'Student'}`}
      subtitle="Your reminders, due work, enrolled subjects, and current performance in one place."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/student/subjects"><StatCard title="Enrolled Subjects" value={data?.quickStats.enrolledSubjects ?? 0} icon={CalendarCheck2} color="bg-blue-600" /></Link>
          <Link href="/student/assignments"><StatCard title="Pending Assignments" value={data?.quickStats.pendingAssignments ?? 0} icon={ClipboardCheck} color="bg-amber-500" /></Link>
          <Link href="/student/notifications"><StatCard title="Unread Notifications" value={data?.quickStats.unreadNotifications ?? 0} icon={Sparkles} color="bg-violet-600" /></Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="Reminders" subtitle="Open the related work directly or mark it done in the relevant module." />
            <div className="space-y-4 p-6">
              {(data?.reminders ?? []).map((item) => (
                <Link key={item.id} href={item.actionUrl || '/student/notifications'} className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:border-primary">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.subject}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{item.due}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>

          <Link href="/student/analysis">
            <Panel>
              <PanelHeader title="Current Performance" subtitle="Open your detailed analysis with subject-wise improvement guidance." />
              <div className="space-y-4 p-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">Topic understanding</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{data?.currentAnalysis.topicUnderstanding ?? 0}%</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-semibold text-emerald-800">Strengths</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-700">{(data?.currentAnalysis.strengths ?? []).join(', ')}</p>
                  </div>
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-800">Needs Attention</p>
                    <p className="mt-2 text-sm leading-6 text-amber-700">{(data?.currentAnalysis.weaknesses ?? []).join(', ')}</p>
                  </div>
                </div>
              </div>
            </Panel>
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel>
            <PanelHeader title="Due Assignments" subtitle="Open an assignment to view the complete details." />
            <div className="space-y-4 p-6">
              {(data?.dueAssignments ?? []).map((assignment) => (
                <Link key={assignment.id} href={`/student/assignments?id=${assignment.id}`} className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 hover:border-primary">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{assignment.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{assignment.subject}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assignment.status === 'pending' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{assignment.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-500">Due on {new Date(assignment.dueDate).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
            <PanelHeader title="Gen AI Assistant" subtitle="Summarize notes, ask questions, and understand difficult concepts." />
            <div className="space-y-4 p-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white"><Bot size={24} /></div>
              <p className="text-sm leading-6 text-slate-600">Your assistant is ready when you are. Use the Gen AI module from the sidebar to chat, summarize uploaded study content, and ask concept questions.</p>
              <Link href="/student/ai" className="inline-flex rounded-2xl bg-violet-600 px-5 py-3 font-semibold text-white">Open Gen AI</Link>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

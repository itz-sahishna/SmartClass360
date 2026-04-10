'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';

interface DashboardData {
  analytics: {
    totalStudents: number;
    totalTeachers: number;
    totalSubjects: number;
    totalUsers: number;
    pendingRequests: number;
    studentsYearWise: { year: number; count: number }[];
    userMix: { name: string; value: number; color: string }[];
  };
  recentUsers: {
    id: string;
    name: string;
    email: string;
    role: string;
    is_blocked: boolean;
  }[];
  requests: {
    id: string;
    user_name: string;
    type: string;
    request: string;
    status: string;
    created_at: string;
  }[];
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  const loadDashboard = () => {
    adminApi
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <AppShell
      role="admin"
      title={`Welcome back, ${user?.name ?? 'Admin'}`}
      subtitle="Your institute-wide snapshot for users, requests, and academic health."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link href="/admin/analytics"><StatCard title="Total Students" value={data?.analytics.totalStudents ?? 0} icon={GraduationCap} color="bg-blue-600" /></Link>
          <Link href="/admin/users"><StatCard title="Total Teachers" value={data?.analytics.totalTeachers ?? 0} icon={Users} color="bg-teal-600" /></Link>
          <Link href="/admin/analytics"><StatCard title="Active Subjects" value={data?.analytics.totalSubjects ?? 0} icon={BookOpen} color="bg-violet-600" /></Link>
          <Link href="/admin/dashboard"><StatCard title="Pending Requests" value={data?.analytics.pendingRequests ?? 0} icon={ShieldCheck} color="bg-amber-500" /></Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Panel>
            <PanelHeader
              title="Students by Academic Year"
              subtitle="Year-wise distribution for the current registered student base."
            />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.analytics.studentsYearWise ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis stroke="#64748b" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="User Mix"
              subtitle="Quick visibility into overall platform role distribution."
            />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.analytics.userMix ?? []}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={5}
                  >
                    {(data?.analytics.userMix ?? []).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <Panel className="overflow-hidden">
            <PanelHeader
              title="Recent Users"
              subtitle="Newest accounts added to SmartClass 360."
            />
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(data?.recentUsers ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.name}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.email}</td>
                      <td className="px-6 py-4 capitalize text-slate-700 dark:text-slate-300">{item.role}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.is_blocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <PanelHeader
              title="Special Requests"
              subtitle="Recent profile and administrative requests needing review."
            />
            <div className="space-y-4 px-6 py-5">
              {(data?.requests ?? []).map((request) => (
                <div key={request.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{request.user_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{request.type}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold capitalize text-amber-700">
                      {request.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{request.request}</p>
                  <p className="mt-3 text-xs text-slate-400">{request.created_at}</p>
                  {request.status === 'pending' ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await adminApi.reviewRequest(request.id, 'approved');
                          loadDashboard();
                        }}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await adminApi.reviewRequest(request.id, 'rejected');
                          loadDashboard();
                        }}
                        className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

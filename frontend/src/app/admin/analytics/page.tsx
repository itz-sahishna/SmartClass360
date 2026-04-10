'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { adminApi } from '@/lib/api';

interface AnalyticsData {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalUsers: number;
  pendingRequests: number;
  studentsYearWise: { year: number; count: number }[];
  subjectAnalytics: {
    id: string;
    name: string;
    code: string;
    enrolledStudents: number;
    teacherCount: number;
  }[];
  userMix: { name: string; value: number; color: string }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    adminApi
      .getAnalytics()
      .then((res) => setData(res.data.data))
      .catch(console.error);
  }, []);

  return (
    <AppShell
      role="admin"
      title="Analytics"
      subtitle="Institution-wide breakdown of enrollment, subjects, and teaching distribution."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Users" value={data?.totalUsers ?? 0} icon={Users} color="bg-slate-800" />
          <StatCard title="Subjects" value={data?.totalSubjects ?? 0} icon={BookOpen} color="bg-fuchsia-600" />
          <StatCard title="Pending Requests" value={data?.pendingRequests ?? 0} icon={Users} color="bg-amber-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Panel>
            <PanelHeader
              title="Enrollment by Year"
              subtitle="Student growth across academic batches."
            />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.studentsYearWise ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" />
                  <YAxis allowDecimals={false} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#7c3aed" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Role Distribution"
              subtitle="Current split across admins, teachers, and students."
            />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.userMix ?? []} dataKey="value" nameKey="name" outerRadius={110}>
                    {(data?.userMix ?? []).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="Subject Coverage"
            subtitle="Students enrolled and teacher allocation per subject."
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Code</th>
                  <th className="px-6 py-4 font-medium">Students Enrolled</th>
                  <th className="px-6 py-4 font-medium">Teachers Assigned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.subjectAnalytics ?? []).map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{subject.name}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{subject.code}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{subject.enrolledStudents}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{subject.teacherCount}</td>
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

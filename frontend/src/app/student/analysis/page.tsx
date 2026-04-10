'use client';

import { useEffect, useState } from 'react';
import { Award, BookOpen, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { studentApi } from '@/lib/api';

interface AnalysisData {
  overallScore: number;
  trend: string;
  topicUnderstanding: number;
  strengths: string[];
  weaknesses: string[];
  progress: number;
  subjectMarks: { subject: string; code: string; marks: number; grade: string; improvement: string }[];
  marksOverTime: { month: string; marks: number; examType: string }[];
  radarData: { metric: string; score: number }[];
  factors: string[];
  improvements: { subject: string; how: string }[];
}

export default function StudentAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    studentApi.getAnalysis().then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title="Analysis"
      subtitle="Current performance only: deep visual analysis plus subject-wise improvement guidance."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Overall Score" value={`${data?.overallScore ?? 0}%`} subtitle={`Trend ${data?.trend ?? ''}`} icon={Award} color="bg-emerald-600" />
          <StatCard title="Topic Understanding" value={`${data?.topicUnderstanding ?? 0}%`} icon={BookOpen} color="bg-blue-600" />
          <StatCard title="Progress" value={`${data?.progress ?? 0}%`} icon={TrendingUp} color="bg-violet-600" />
          <StatCard title="Improvement Areas" value={(data?.improvements ?? []).length} icon={Award} color="bg-amber-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="Skill Balance" subtitle="Current academic balance across attendance, assignments, exam scores, and consistency." />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data?.radarData ?? []}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Tooltip />
                  <Radar dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.45} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Subject Performance" subtitle="Your current marks and grade per subject." />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.subjectMarks ?? []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="marks" fill="#10b981" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel className="overflow-hidden">
          <PanelHeader title="Subject Improvement Guidance" subtitle="Exactly where you can improve and how, subject by subject." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Marks</th>
                  <th className="px-6 py-4 font-medium">Grade</th>
                  <th className="px-6 py-4 font-medium">How to Improve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.subjectMarks ?? []).map((item) => (
                  <tr key={item.subject}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.subject}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.marks}%</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.grade}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{item.improvement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="Strengths" subtitle="Subjects and skills where you are currently doing well." />
            <div className="space-y-3 p-6">
              {(data?.strengths ?? []).map((item) => (
                <div key={item} className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200">{item}</div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Current Insights" subtitle="Important current-data observations from your attendance and marks." />
            <div className="space-y-3 p-6">
              {(data?.factors ?? []).map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-600 dark:text-slate-300">{item}</div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { teacherApi } from '@/lib/api';

interface TeachingAssignment {
  id: string;
  name: string;
  class_name: string;
  section_name: string;
}

interface AnalysisData {
  summary: { totalStudents: number; atRisk: number; avgClassScore: number; avgAttendance: number };
  distribution: { name: string; value: number; color: string }[];
  attendanceVsMarks: { name: string; attendance: number; marks: number }[];
  marksOverTime: { month: string; avg: number }[];
  students: {
    id: string;
    name: string;
    roll: string;
    subject: string;
    prediction: string;
    predicted_grade: string;
    pass_prediction: boolean;
    confidence: number;
    factors: string[];
  }[];
}

export default function TeacherAnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [subjects, setSubjects] = useState<TeachingAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const loadData = (assignment = selectedAssignment, roll = rollNumber) => {
    teacherApi.getSubjects().then((res) => setSubjects(res.data.data)).catch(console.error);
    teacherApi.getAnalysis({ teacher_assignment_id: assignment || undefined, roll_number: roll || undefined }).then((res) => setData(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    loadData('', '');
  }, []);

  return (
    <AppShell
      role="teacher"
      title="Analysis"
      subtitle="Filter predictive analysis by section, subject, or a single roll number with stored outputs and visual insights."
    >
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Analysis Filters" subtitle="Run analysis for a whole section-subject combination or a specific student roll number." />
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_260px_auto]">
            <select
              value={selectedAssignment}
              onChange={(event) => setSelectedAssignment(event.target.value)}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="">All sections you teach</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name} - {subject.class_name} Section {subject.section_name}</option>
              ))}
            </select>
            <input
              value={rollNumber}
              onChange={(event) => setRollNumber(event.target.value)}
              placeholder="Enter roll number"
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            />
            <button type="button" onClick={() => loadData(selectedAssignment, rollNumber)} className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white">Run Analysis</button>
          </div>
        </Panel>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Students" value={data?.summary.totalStudents ?? 0} icon={Users} color="bg-blue-600" />
          <StatCard title="Avg Score" value={`${data?.summary.avgClassScore ?? 0}%`} icon={TrendingUp} color="bg-emerald-600" />
          <StatCard title="Avg Attendance" value={`${data?.summary.avgAttendance ?? 0}%`} icon={CheckCircle2} color="bg-indigo-600" />
          <StatCard title="At Risk" value={data?.summary.atRisk ?? 0} icon={AlertTriangle} color="bg-red-500" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <PanelHeader title="Predictive Distribution" subtitle="Stored ML output across Good, Average, and At Risk categories." />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data?.distribution ?? []} dataKey="value" innerRadius={70} outerRadius={110}>
                    {(data?.distribution ?? []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Attendance vs Marks" subtitle="Current section health before and after prediction weighting." />
            <div className="h-[320px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="attendance" name="Attendance" unit="%" stroke="#64748b" />
                  <YAxis type="number" dataKey="marks" name="Marks" unit="%" stroke="#64748b" />
                  <Tooltip cursor={{ strokeDasharray: '4 4' }} />
                  <Scatter data={data?.attendanceVsMarks ?? []} fill="#4f46e5" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader title="Class Score Trend" subtitle="Trend of average marks stored alongside historical analysis." />
          <div className="h-[340px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.marksOverTime ?? []}>
                <defs>
                  <linearGradient id="analysisGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Area type="monotone" dataKey="avg" stroke="#4f46e5" fill="url(#analysisGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Student Prediction Detail" subtitle="See pass prediction, likely grade, and contributing factors." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Prediction</th>
                  <th className="px-6 py-4 font-medium">Grade</th>
                  <th className="px-6 py-4 font-medium">Pass</th>
                  <th className="px-6 py-4 font-medium">Why</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.students ?? []).map((student) => (
                  <tr key={`${student.id}-${student.subject}`}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.roll}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{student.subject}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.prediction === 'Good' ? 'bg-emerald-100 text-emerald-700' : student.prediction === 'Average' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {student.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{student.predicted_grade}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{student.pass_prediction ? 'Likely Pass' : 'Likely Fail'}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{student.factors.join(', ')}</td>
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

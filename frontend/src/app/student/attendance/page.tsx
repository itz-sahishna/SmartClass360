'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import StatCard from '@/components/shared/StatCard';
import { studentApi } from '@/lib/api';
import { CalendarCheck2 } from 'lucide-react';

interface AttendanceData {
  overall: number;
  subjects: { subject_id: string; subject: string; code: string; present: number; total: number; percentage: number }[];
  dailyBreakdown: { date: string; attended: number; total: number }[];
  records: { attendance_record_id: string; status: string; date: string; subject_id: string; subject_name: string; code: string; start_time?: string; end_time?: string; room?: string }[];
}

export default function StudentAttendancePage() {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [subjectId, setSubjectId] = useState('');
  const [selectedRecord, setSelectedRecord] = useState('');
  const [requestedStatus, setRequestedStatus] = useState('present');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const loadData = (nextSubject = subjectId) => {
    studentApi.getAttendance({ subject_id: nextSubject || undefined }).then((res) => setData(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    loadData('');
  }, []);

  return (
    <AppShell
      role="student"
      title="Attendance"
      subtitle="Check subject attendance, daily class attendance, and request corrections when an entry is wrong."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Overall Attendance" value={`${data?.overall ?? 0}%`} icon={CalendarCheck2} color="bg-blue-600" />
          <StatCard title="Safe Subjects" value={(data?.subjects.filter((item) => item.percentage >= 75) ?? []).length} icon={CalendarCheck2} color="bg-emerald-600" />
          <StatCard title="Watchlist Subjects" value={(data?.subjects.filter((item) => item.percentage < 75) ?? []).length} icon={CalendarCheck2} color="bg-amber-500" />
        </div>

        <Panel>
          <PanelHeader title="Subject Filter" subtitle="Check attendance for a specific subject." />
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto]">
            <select
              value={subjectId}
              onChange={(event) => {
                setSubjectId(event.target.value);
                loadData(event.target.value);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="">All subjects</option>
              {(data?.subjects ?? []).map((item) => (
                <option key={item.subject_id} value={item.subject_id}>{item.subject}</option>
              ))}
            </select>
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Subject Breakdown" subtitle="Present classes, total classes, and current percentage for each subject." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Subject</th>
                  <th className="px-6 py-4 font-medium">Present</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(data?.subjects ?? []).map((item) => (
                  <tr key={item.subject_id}>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{item.subject}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.present}</td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{item.total}</td>
                    <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.percentage >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{item.percentage}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <Panel>
            <PanelHeader title="Daily Attendance" subtitle="See how many classes you attended on each day." />
            <div className="space-y-4 p-6">
              {(data?.dailyBreakdown ?? []).map((item) => (
                <div key={item.date} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-700 dark:text-slate-300">
                  {new Date(item.date).toLocaleDateString()}: {item.attended} of {item.total} classes attended
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Attendance Change Request" subtitle="Send a correction request to the teacher if an attendance record is wrong." />
            <div className="space-y-4 p-6">
              <select value={selectedRecord} onChange={(event) => setSelectedRecord(event.target.value)} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary">
                <option value="">Select attendance record</option>
                {(data?.records ?? []).map((record) => (
                  <option key={record.attendance_record_id} value={record.attendance_record_id}>{record.subject_name} - {new Date(record.date).toLocaleDateString()} {record.start_time ? `${record.start_time}-${record.end_time}` : ''} - current {record.status}</option>
                ))}
              </select>
              <select value={requestedStatus} onChange={(event) => setRequestedStatus(event.target.value)} className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary">
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
              </select>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Reason for correction request" className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary" />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedRecord) return;
                    await studentApi.requestAttendanceChange({ attendance_record_id: selectedRecord, status: requestedStatus, note });
                    setMessage('Attendance correction request sent to your teacher.');
                  }}
                  className="flex-1 rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
                >
                  Save Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRecord('');
                    setRequestedStatus('present');
                    setNote('');
                    setMessage('');
                  }}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
              {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

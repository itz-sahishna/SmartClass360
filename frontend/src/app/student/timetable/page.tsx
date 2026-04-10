'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { studentApi } from '@/lib/api';

type TimetableData = Record<string, { time: string; subject: string; teacher: string; room: string; className: string; sectionName: string }[]>;

export default function StudentTimetablePage() {
  const [data, setData] = useState<TimetableData>({});

  useEffect(() => {
    studentApi.getTimetable().then((res) => setData(res.data.data)).catch(console.error);
  }, []);

  const orderedDays = useMemo(() => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Object.entries(data).sort((a, b) => dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]));
  }, [data]);

  return (
    <AppShell
      role="student"
      title="Timetable"
      subtitle="Your complete timetable for the academic year, including room, class, and faculty."
    >
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {orderedDays.map(([day, slots]) => (
          <Panel key={day}>
            <PanelHeader title={day} subtitle={`${slots.length} classes`} />
            <div className="space-y-4 p-6">
              {slots.map((slot) => (
                <div key={`${day}-${slot.time}-${slot.subject}`} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{slot.subject}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{slot.time}</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{slot.teacher}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{slot.room}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{slot.className} - Section {slot.sectionName}</p>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}

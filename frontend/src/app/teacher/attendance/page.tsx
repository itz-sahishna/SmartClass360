'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { teacherApi } from '@/lib/api';

interface TimetableSlot {
  id: string;
  day: string;
  start: string;
  end: string;
  room: string;
}

interface SubjectFilter {
  id: string;
  subject: string;
  className: string;
  sectionName: string;
  timetable: TimetableSlot[];
}

interface StudentRow {
  id: string;
  name: string;
  roll: string;
  className: string;
  sectionName: string;
  presentCount: number;
  totalCount: number;
  overall: number;
  currentStatus: string;
}

interface AttendancePayload {
  subjects: SubjectFilter[];
  students: StudentRow[];
}

export default function TeacherAttendancePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [filters, setFilters] = useState<AttendancePayload>({ subjects: [], students: [] });
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTimetable, setSelectedTimetable] = useState('');
  const [sort, setSort] = useState('default');
  const [statuses, setStatuses] = useState<Record<string, string>>({});

  const loadData = (nextAssignment = selectedAssignment, nextTimetable = selectedTimetable, nextDate = selectedDate, nextSort = sort) => {
    teacherApi
      .getAttendance({
        teacher_assignment_id: nextAssignment || undefined,
        timetable_id: nextTimetable || undefined,
        date: nextDate,
        sort: nextSort,
      })
      .then((res) => {
        const nextData = res.data.data;
        setFilters(nextData);
        setStatuses(
          Object.fromEntries(
            nextData.students.map((student: StudentRow) => [
              student.id,
              student.currentStatus === 'unmarked' ? 'present' : student.currentStatus,
            ])
          )
        );
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadData('', '', today, 'default');
  }, []);

  const selectedSubject = useMemo(
    () => filters.subjects.find((item) => item.id === selectedAssignment) || null,
    [filters.subjects, selectedAssignment]
  );

  const hasChanges = filters.students.some((student) => statuses[student.id] !== (student.currentStatus === 'unmarked' ? 'present' : student.currentStatus));

  return (
    <AppShell
      role="teacher"
      title="Attendance"
      subtitle="Choose a class, period, and date to mark attendance in a period-wise flow that updates immediately in the database."
    >
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Attendance Controls" subtitle="Choose the class-subject assignment, the exact timetable slot, and the date before marking attendance." />
          <div className="grid gap-4 p-6 lg:grid-cols-[1.1fr_1fr_220px_180px]">
            <select
              value={selectedAssignment}
              onChange={(event) => {
                setSelectedAssignment(event.target.value);
                setSelectedTimetable('');
                loadData(event.target.value, '', selectedDate, sort);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="">Select class and subject</option>
              {filters.subjects.map((item) => (
                <option key={item.id} value={item.id}>{item.subject} - {item.className} Section {item.sectionName}</option>
              ))}
            </select>

            <select
              value={selectedTimetable}
              onChange={(event) => {
                setSelectedTimetable(event.target.value);
                loadData(selectedAssignment, event.target.value, selectedDate, sort);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="">Select period slot</option>
              {(selectedSubject?.timetable ?? []).map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.day} {slot.start} - {slot.end} ({slot.room})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                loadData(selectedAssignment, selectedTimetable, event.target.value, sort);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            />

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                loadData(selectedAssignment, selectedTimetable, selectedDate, event.target.value);
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
            >
              <option value="default">Default</option>
              <option value="highest">Highest Attendance</option>
              <option value="lowest">Lowest Attendance</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3 px-6 pb-6">
            <button
              type="button"
              disabled={!selectedAssignment || !selectedTimetable}
              onClick={async () => {
                const records = filters.students.map((student) => ({
                  student_id: student.id,
                  status: statuses[student.id] || 'present',
                }));
                await teacherApi.updateAttendance({
                  teacher_assignment_id: selectedAssignment,
                  timetable_id: selectedTimetable,
                  date: selectedDate,
                  records,
                });
                loadData(selectedAssignment, selectedTimetable, selectedDate, sort);
              }}
              className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Attendance
            </button>
            <button
              type="button"
              onClick={() =>
                setStatuses(
                  Object.fromEntries(
                    filters.students.map((student) => [student.id, student.currentStatus === 'unmarked' ? 'present' : student.currentStatus])
                  )
                )
              }
              className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            {hasChanges ? <span className="self-center text-sm text-amber-600 dark:text-amber-300">Unsaved attendance changes</span> : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Timetable Reference" subtitle="Every class period assigned to you for this selection." />
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {filters.subjects.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedAssignment(item.id);
                  setSelectedTimetable(item.timetable[0]?.id || '');
                  loadData(item.id, item.timetable[0]?.id || '', selectedDate, sort);
                }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 text-left"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">{item.subject}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.className} - Section {item.sectionName}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.timetable.map((slot) => (
                    <p key={`${item.id}-${slot.id}`}>{slot.day}: {slot.start} - {slot.end} ({slot.room})</p>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="overflow-hidden">
          <PanelHeader title="Period Attendance" subtitle="Each student shows historical attendance and the status for the selected period." />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Student</th>
                  <th className="px-6 py-4 font-medium">Class</th>
                  <th className="px-6 py-4 font-medium">Present / Total</th>
                  <th className="px-6 py-4 font-medium">Overall</th>
                  <th className="px-6 py-4 font-medium">Current Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filters.students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{student.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{student.roll}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.className} - Section {student.sectionName}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{student.presentCount} / {student.totalCount}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{student.overall}%</td>
                    <td className="px-6 py-4">
                      <select
                        value={statuses[student.id] ?? 'present'}
                        onChange={(event) => setStatuses((prev) => ({ ...prev, [student.id]: event.target.value }))}
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                      >
                        <option value="present">Present</option>
                        <option value="late">Late</option>
                        <option value="absent">Absent</option>
                      </select>
                    </td>
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

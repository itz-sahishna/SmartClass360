'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { adminApi } from '@/lib/api';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'teacher' | 'student';
  roll_number: string | null;
  section_id?: string | null;
  class_name: string | null;
  section_name: string | null;
  department: string | null;
  department_id?: string | null;
  designation?: string | null;
  year: number | null;
  is_blocked: boolean;
  teacher_subjects: {
    teacher_assignment_id: string;
    subject_id: string;
    subject_name: string;
    section_id: string;
    class_name: string;
    section_name: string;
    academic_year: string;
  }[];
}

interface LookupData {
  departments: { id: string; name: string }[];
  years: { id: string; year_number: number; academic_year: string; department_id: string }[];
  sections: { id: string; name: string; class_name: string; year_id: string; year_number: number; academic_year: string }[];
  subjects: { id: string; name: string; code: string; department_id: string; year_id: string; department_name: string; year_number: number; academic_year: string }[];
  teacherAssignments: { id: string; teacher_id: string; subject_id: string; section_id: string; academic_year: string; subject_name: string; class_name: string; section_name: string }[];
  timetables: { id: string; teacher_assignment_id: string; day_of_week: string; start_time: string; end_time: string; room: string; subject_name: string; class_name: string; section_name: string; teacher_name: string }[];
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  role: 'student',
  roll_number: '',
  section_id: '',
  department_id: '',
  designation: '',
  teaching_assignments: [] as { subject_id: string; section_id: string; academic_year: string }[],
};

const initialSectionForm = {
  department_id: '',
  year_id: '',
  class_name: '',
  name: '',
};

const initialSubjectForm = {
  department_id: '',
  year_id: '',
  name: '',
  code: '',
  semester: '',
  credits: '3',
  syllabus: '',
};

const initialTimetableForm = {
  teacher_assignment_id: '',
  day_of_week: 'Monday',
  start_time: '',
  end_time: '',
  room: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [lookups, setLookups] = useState<LookupData | null>(null);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [sectionForm, setSectionForm] = useState(initialSectionForm);
  const [subjectForm, setSubjectForm] = useState(initialSubjectForm);
  const [timetableForm, setTimetableForm] = useState(initialTimetableForm);
  const [assignmentDraft, setAssignmentDraft] = useState({ subject_id: '', section_id: '', academic_year: '2025-26' });

  const loadUsers = () => {
    adminApi.getUsers().then((res) => setUsers(res.data.data)).catch(console.error);
  };

  const loadLookups = () => {
    adminApi.getLookups().then((res) => setLookups(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    loadUsers();
    loadLookups();
  }, []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesRole = role === 'all' || user.role === role;
        const matchesQuery =
          !query ||
          [user.name, user.email, user.phone, user.roll_number, user.class_name, user.section_name]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query.toLowerCase()));
        return matchesRole && matchesQuery;
      }),
    [users, query, role]
  );

  const resetForm = () => {
    setForm(initialForm);
    setEditingUserId(null);
    setAssignmentDraft({ subject_id: '', section_id: '', academic_year: '2025-26' });
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      ...form,
      roll_number: form.role === 'student' ? form.roll_number : undefined,
      section_id: form.role === 'student' ? form.section_id : undefined,
      teaching_assignments: form.role === 'teacher' ? form.teaching_assignments : [],
      password: 'password123',
    };

    if (editingUserId) {
      await adminApi.updateUser(editingUserId, payload);
    } else {
      await adminApi.createUser(payload);
    }

    resetForm();
    loadUsers();
  };

  const startEdit = (user: ManagedUser) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      roll_number: user.roll_number ?? '',
      section_id: user.section_id ?? '',
      department_id: user.department_id ?? lookups?.departments.find((item) => item.name === user.department)?.id ?? '',
      designation: user.designation ?? '',
      teaching_assignments: (user.teacher_subjects ?? []).map((item) => ({
        subject_id: item.subject_id,
        section_id: item.section_id,
        academic_year: item.academic_year,
      })),
    });
  };

  const selectedSection = lookups?.sections.find((item) => item.id === form.section_id);
  const filteredYears = (lookups?.years ?? []).filter((year) => !sectionForm.department_id || year.department_id === sectionForm.department_id);
  const filteredSubjectYears = (lookups?.years ?? []).filter((year) => !subjectForm.department_id || year.department_id === subjectForm.department_id);
  const filteredSubjects = (lookups?.subjects ?? []).filter((subject) => {
    if (!form.department_id) return true;
    const department = lookups?.departments.find((item) => item.id === form.department_id);
    return subject.department_name === department?.name;
  });

  return (
    <AppShell
      role="admin"
      title="Users"
      subtitle="Create, update, and assign users with class-aware and subject-aware data stored in the database."
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <Panel>
            <PanelHeader
              title={editingUserId ? 'Update User' : 'Create User'}
              subtitle="Create students by class/section or teachers with one or more subject assignments."
            />
            <form onSubmit={submitForm} className="space-y-4 p-6">
            <Input label="Full Name" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
            <Input label="Email" value={form.email} onChange={(value) => setForm((prev) => ({ ...prev, email: value }))} />
            <Input label="Phone" value={form.phone} onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select
                value={form.role}
                onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as 'admin' | 'teacher' | 'student' }))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {form.role === 'student' ? (
              <>
                <Input label="Roll Number" value={form.roll_number} onChange={(value) => setForm((prev) => ({ ...prev, roll_number: value }))} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Class / Section</label>
                  <select
                    value={form.section_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, section_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select class and section</option>
                    {(lookups?.sections ?? []).map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.class_name} - Section {section.name} - Year {section.year_number} ({section.academic_year})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedSection ? (
                  <div className="rounded-2xl border border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-200">
                    Assigned to {selectedSection.class_name}, Section {selectedSection.name}, Year {selectedSection.year_number}.
                  </div>
                ) : null}
              </>
            ) : null}

            {form.role === 'teacher' ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                  <select
                    value={form.department_id}
                    onChange={(event) => setForm((prev) => ({ ...prev, department_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select department</option>
                    {(lookups?.departments ?? []).map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <Input label="Designation" value={form.designation} onChange={(value) => setForm((prev) => ({ ...prev, designation: value }))} />
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Assign Subjects to Classes</p>
                  <div className="mt-4 space-y-3">
                    <select
                      value={assignmentDraft.subject_id}
                      onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, subject_id: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select subject</option>
                      {filteredSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code}) - Year {subject.year_number}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assignmentDraft.section_id}
                      onChange={(event) => setAssignmentDraft((prev) => ({ ...prev, section_id: event.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select class / section</option>
                      {(lookups?.sections ?? []).map((section) => (
                        <option key={section.id} value={section.id}>
                          {section.class_name} - Section {section.name}
                        </option>
                      ))}
                    </select>
                    <Input label="Academic Year" value={assignmentDraft.academic_year} onChange={(value) => setAssignmentDraft((prev) => ({ ...prev, academic_year: value }))} />
                    <button
                      type="button"
                      onClick={() => {
                        if (!assignmentDraft.subject_id || !assignmentDraft.section_id) return;
                        setForm((prev) => ({
                          ...prev,
                          teaching_assignments: [...prev.teaching_assignments, assignmentDraft],
                        }));
                        setAssignmentDraft({ subject_id: '', section_id: '', academic_year: assignmentDraft.academic_year });
                      }}
                      className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Add Teaching Assignment
                    </button>
                  </div>
                  <div className="mt-4 space-y-2">
                    {form.teaching_assignments.map((assignment, index) => {
                      const subject = lookups?.subjects.find((item) => item.id === assignment.subject_id);
                      const section = lookups?.sections.find((item) => item.id === assignment.section_id);
                      return (
                        <div key={`${assignment.subject_id}-${assignment.section_id}-${index}`} className="flex items-center justify-between rounded-2xl bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                          <span>
                            {subject?.name} {'->'} {section?.class_name} Section {section?.name} ({assignment.academic_year})
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, teaching_assignments: prev.teaching_assignments.filter((_, currentIndex) => currentIndex !== index) }))}
                            className="text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white">
                {editingUserId ? 'Save Changes' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
            </form>
          </Panel>

          <Panel>
            <PanelHeader
              title="Create Section"
              subtitle="Add a new section such as CSE 3rd Year Section D, then use it immediately while creating students or assigning teachers."
            />
            <div className="space-y-4 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
              <select
                value={sectionForm.department_id}
                onChange={(event) => setSectionForm((prev) => ({ ...prev, department_id: event.target.value, year_id: '' }))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Select department</option>
                {(lookups?.departments ?? []).map((department) => (
                  <option key={department.id} value={department.id}>{department.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Year</label>
              <select
                value={sectionForm.year_id}
                onChange={(event) => setSectionForm((prev) => ({ ...prev, year_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Select year</option>
                {filteredYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    Year {year.year_number} ({year.academic_year})
                  </option>
                ))}
              </select>
            </div>
            <Input label="Class Name" value={sectionForm.class_name} onChange={(value) => setSectionForm((prev) => ({ ...prev, class_name: value }))} />
            <Input label="Section Name" value={sectionForm.name} onChange={(value) => setSectionForm((prev) => ({ ...prev, name: value.toUpperCase() }))} />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={async () => {
                  await adminApi.createSection(sectionForm);
                  setSectionForm(initialSectionForm);
                  await loadLookups();
                }}
                className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white"
              >
                Save Section
              </button>
              <button
                type="button"
                onClick={() => setSectionForm(initialSectionForm)}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Create Subject"
              subtitle="Add a subject for a department and academic year before assigning faculty or timetables."
            />
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</label>
                <select
                  value={subjectForm.department_id}
                  onChange={(event) => setSubjectForm((prev) => ({ ...prev, department_id: event.target.value, year_id: '' }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                >
                  <option value="">Select department</option>
                  {(lookups?.departments ?? []).map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Academic Year</label>
                <select
                  value={subjectForm.year_id}
                  onChange={(event) => setSubjectForm((prev) => ({ ...prev, year_id: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                >
                  <option value="">Select year</option>
                  {filteredSubjectYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      Year {year.year_number} ({year.academic_year})
                    </option>
                  ))}
                </select>
              </div>
              <Input label="Subject Name" value={subjectForm.name} onChange={(value) => setSubjectForm((prev) => ({ ...prev, name: value }))} />
              <Input label="Subject Code" value={subjectForm.code} onChange={(value) => setSubjectForm((prev) => ({ ...prev, code: value.toUpperCase() }))} />
              <Input label="Semester" value={subjectForm.semester} onChange={(value) => setSubjectForm((prev) => ({ ...prev, semester: value }))} />
              <Input label="Credits" value={subjectForm.credits} onChange={(value) => setSubjectForm((prev) => ({ ...prev, credits: value }))} />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Syllabus</label>
                <textarea
                  value={subjectForm.syllabus}
                  onChange={(event) => setSubjectForm((prev) => ({ ...prev, syllabus: event.target.value }))}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await adminApi.createSubject({ ...subjectForm, credits: Number(subjectForm.credits || 3) });
                    setSubjectForm(initialSubjectForm);
                    await loadLookups();
                  }}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white"
                >
                  Save Subject
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectForm(initialSubjectForm)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Create Timetable"
              subtitle="Assign a period to an existing faculty + subject + section combination."
            />
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Faculty / Subject / Class</label>
                <select
                  value={timetableForm.teacher_assignment_id}
                  onChange={(event) => setTimetableForm((prev) => ({ ...prev, teacher_assignment_id: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                >
                  <option value="">Select teaching assignment</option>
                  {(lookups?.teacherAssignments ?? []).map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.subject_name} - {assignment.class_name} Section {assignment.section_name} ({assignment.academic_year})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Day</label>
                <select
                  value={timetableForm.day_of_week}
                  onChange={(event) => setTimetableForm((prev) => ({ ...prev, day_of_week: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <Input label="Start Time" value={timetableForm.start_time} onChange={(value) => setTimetableForm((prev) => ({ ...prev, start_time: value }))} />
              <Input label="End Time" value={timetableForm.end_time} onChange={(value) => setTimetableForm((prev) => ({ ...prev, end_time: value }))} />
              <Input label="Room / Lab" value={timetableForm.room} onChange={(value) => setTimetableForm((prev) => ({ ...prev, room: value }))} />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    await adminApi.createTimetable(timetableForm);
                    setTimetableForm(initialTimetableForm);
                    await loadLookups();
                  }}
                  className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white"
                >
                  Save Timetable
                </button>
                <button
                  type="button"
                  onClick={() => setTimetableForm(initialTimetableForm)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 text-sm text-slate-600 dark:text-slate-300">
                {(lookups?.timetables ?? []).slice(0, 5).map((slot) => (
                  <p key={slot.id}>
                    {slot.day_of_week} {slot.start_time}-{slot.end_time}: {slot.subject_name}, {slot.class_name} Section {slot.section_name} ({slot.teacher_name})
                  </p>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <Panel className="overflow-hidden">
          <PanelHeader
            title="User Directory"
            subtitle="Search, filter, and manage the database-backed user list."
            action={
              <div className="flex flex-col gap-3 md:flex-row">
                <div className="relative">
                  <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by name, email, class, roll no"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 py-3 pl-11 pr-4 text-sm outline-none focus:border-primary md:w-72"
                  />
                </div>
                <select
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="teacher">Teachers</option>
                  <option value="student">Students</option>
                </select>
              </div>
            }
          />

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Academic</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.department ?? 'General'}</p>
                    </td>
                    <td className="px-6 py-4 capitalize text-slate-700 dark:text-slate-300">{user.role}</td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {user.role === 'student' ? (
                        <>
                          <p>{user.class_name ?? '-'}</p>
                          <p className="text-xs">Section {user.section_name ?? '-'} | Roll {user.roll_number ?? '-'}</p>
                        </>
                      ) : user.role === 'teacher' ? (
                        <p className="max-w-xs text-xs leading-5">{(user.teacher_subjects ?? []).map((item) => `${item.subject_name} (${item.class_name}-${item.section_name})`).join(', ') || 'No assignments yet'}</p>
                      ) : (
                        <p>-</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      <p>{user.email}</p>
                      <p className="text-xs">{user.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_blocked ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {user.is_blocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => startEdit(user)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Edit</button>
                        <button
                          type="button"
                          onClick={async () => {
                            await adminApi.toggleUserBlock(user.id);
                            loadUsers();
                          }}
                          className="rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"
                        >
                          {user.is_blocked ? 'Unblock' : 'Block'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await adminApi.deleteUser(user.id);
                            loadUsers();
                          }}
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                        >
                          Delete
                        </button>
                      </div>
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

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

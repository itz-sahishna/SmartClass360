'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { teacherApi } from '@/lib/api';

interface TeachingAssignment {
  id: string;
  name: string;
  code: string;
  class_name: string;
  section_name: string;
  academic_year: string;
}

interface AssignmentData {
  id: string;
  teacher_assignment_id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  sectionName: string;
  dueDate: string;
  scheduledAt: string;
  type: string;
  maxMarks: number;
  totalSubmissions: number;
  pendingReview: number;
}

interface AssignmentDetails {
  id: string;
  title: string;
  description: string;
  subject: string;
  subject_code: string;
  className: string;
  sectionName: string;
  type: string;
  dueDate: string;
  scheduledAt: string;
  maxMarks: number;
  questions?: {
    id: string;
    question_text: string;
    marks: number;
    correct_option_index: number | null;
    options: { id: string; option_text: string; display_order: number }[];
  }[];
  submissions: {
    id: string;
    student_id: string;
    student_name: string;
    roll_number: string;
    file_url?: string | null;
    submitted_text?: string | null;
    submitted_at?: string | null;
    marks?: number | null;
    status: string;
  }[];
}

interface MaterialData {
  id: string;
  title: string;
  description: string;
  file_url?: string | null;
  material_type: string;
  subject_name: string;
  class_name: string;
  section_name: string;
  created_at: string;
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
  const [teachingAssignments, setTeachingAssignments] = useState<TeachingAssignment[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<AssignmentDetails | null>(null);
  const [gradeDrafts, setGradeDrafts] = useState<Record<string, string>>({});
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    teacher_assignment_id: '',
    file_url: '',
    material_type: 'note',
  });
  const [form, setForm] = useState({
    title: '',
    teacher_assignment_id: '',
    type: 'assignment',
    due_date: '',
    scheduled_at: '',
    max_marks: '20',
    description: '',
    questions: [] as {
      question_text: string;
      marks: string;
      correct_option_index: number;
      options: { option_text: string }[];
    }[],
  });

  const loadData = (focusId?: string) => {
    teacherApi.getAssignments().then((res) => {
      const nextAssignments = res.data.data;
      setAssignments(nextAssignments);
      const targetId = focusId || selectedAssignmentId || nextAssignments[0]?.id || '';
      if (targetId) {
        setSelectedAssignmentId(targetId);
        teacherApi.getAssignmentDetails(targetId).then((detailRes) => setSelectedDetails(detailRes.data.data)).catch(console.error);
      } else {
        setSelectedDetails(null);
      }
    }).catch(console.error);

    teacherApi.getSubjects().then((res) => setTeachingAssignments(res.data.data)).catch(console.error);
    teacherApi.getMaterials().then((res) => setMaterials(res.data.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell
      role="teacher"
      title="Assignments"
      subtitle="Assign work or online quizzes to a specific class and review past submissions in detail."
    >
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Panel>
          <PanelHeader title="Assign to Class" subtitle="Choose the subject-section pair, assignment type, schedule, and due date." />
          <form
            className="space-y-4 p-6"
            onSubmit={async (event) => {
              event.preventDefault();
              const response = await teacherApi.createAssignment({
                ...form,
                max_marks: Number(form.max_marks),
                questions: form.questions.map((question) => ({
                  ...question,
                  marks: Number(question.marks || 1),
                })),
              });
              const createdId = response.data.data.id;
              setForm({ title: '', teacher_assignment_id: '', type: 'assignment', due_date: '', scheduled_at: '', max_marks: '20', description: '', questions: [] });
              loadData(createdId);
            }}
          >
            <Input label="Title" value={form.title} onChange={(value) => setForm((prev) => ({ ...prev, title: value }))} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Class + Subject</label>
              <select
                value={form.teacher_assignment_id}
                onChange={(event) => setForm((prev) => ({ ...prev, teacher_assignment_id: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="">Select teaching assignment</option>
                {teachingAssignments.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} - {subject.class_name} Section {subject.section_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Online Quiz</option>
              </select>
            </div>
            <Input label="Scheduled At" type="datetime-local" value={form.scheduled_at} onChange={(value) => setForm((prev) => ({ ...prev, scheduled_at: value }))} />
            <Input label="Due Date" type="datetime-local" value={form.due_date} onChange={(value) => setForm((prev) => ({ ...prev, due_date: value }))} />
            <Input label="Max Marks" value={form.max_marks} onChange={(value) => setForm((prev) => ({ ...prev, max_marks: value }))} />
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            {form.type === 'quiz' ? (
              <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Quiz Questions</p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        questions: [
                          ...prev.questions,
                          {
                            question_text: '',
                            marks: '1',
                            correct_option_index: 0,
                            options: [{ option_text: '' }, { option_text: '' }, { option_text: '' }, { option_text: '' }],
                          },
                        ],
                      }))
                    }
                    className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Add Question
                  </button>
                </div>
                {form.questions.map((question, questionIndex) => (
                  <div key={`question-${questionIndex}`} className="space-y-3 rounded-2xl bg-white dark:bg-slate-900 p-4">
                    <Input
                      label={`Question ${questionIndex + 1}`}
                      value={question.question_text}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          questions: prev.questions.map((item, idx) => idx === questionIndex ? { ...item, question_text: value } : item),
                        }))
                      }
                    />
                    <Input
                      label="Marks"
                      value={question.marks}
                      onChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          questions: prev.questions.map((item, idx) => idx === questionIndex ? { ...item, marks: value } : item),
                        }))
                      }
                    />
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Options</label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`option-${questionIndex}-${optionIndex}`} className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={question.correct_option_index === optionIndex}
                              onChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((item, idx) => idx === questionIndex ? { ...item, correct_option_index: optionIndex } : item),
                                }))
                              }
                            />
                            <input
                              value={option.option_text}
                              onChange={(event) =>
                                setForm((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((item, idx) =>
                                    idx === questionIndex
                                      ? {
                                          ...item,
                                          options: item.options.map((currentOption, currentIndex) =>
                                            currentIndex === optionIndex ? { ...currentOption, option_text: event.target.value } : currentOption
                                          ),
                                        }
                                      : item
                                  ),
                                }))
                              }
                              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          questions: prev.questions.filter((_, idx) => idx !== questionIndex),
                        }))
                      }
                      className="text-sm font-semibold text-red-600"
                    >
                      Remove Question
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white">Save</button>
              <button
                type="button"
                onClick={() => setForm({ title: '', teacher_assignment_id: '', type: 'assignment', due_date: '', scheduled_at: '', max_marks: '20', description: '', questions: [] })}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </form>
          </Panel>

        <div className="space-y-6">
          <Panel>
            <PanelHeader title="Post Study Material" subtitle="Share notes, PDFs, links, and lab resources with a specific class." />
            <div className="grid gap-4 p-6 lg:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <Input label="Material Title" value={materialForm.title} onChange={(value) => setMaterialForm((prev) => ({ ...prev, title: value }))} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Class + Subject</label>
                  <select
                    value={materialForm.teacher_assignment_id}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, teacher_assignment_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                  >
                    <option value="">Select teaching assignment</option>
                    {teachingAssignments.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} - {subject.class_name} Section {subject.section_name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input label="Material Type" value={materialForm.material_type} onChange={(value) => setMaterialForm((prev) => ({ ...prev, material_type: value }))} />
                <Input label="File / Resource URL" value={materialForm.file_url} onChange={(value) => setMaterialForm((prev) => ({ ...prev, file_url: value }))} />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                  <textarea
                    value={materialForm.description}
                    onChange={(event) => setMaterialForm((prev) => ({ ...prev, description: event.target.value }))}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await teacherApi.createMaterial(materialForm);
                      setMaterialForm({ title: '', description: '', teacher_assignment_id: '', file_url: '', material_type: 'note' });
                      loadData(selectedAssignmentId);
                    }}
                    className="flex-1 rounded-2xl bg-primary px-4 py-3 font-semibold text-white"
                  >
                    Save Material
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialForm({ title: '', description: '', teacher_assignment_id: '', file_url: '', material_type: 'note' })}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {materials.slice(0, 5).map((material) => (
                  <div key={material.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{material.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{material.subject_name} - {material.class_name} Section {material.section_name}</p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{material.description}</p>
                    {material.file_url ? <p className="mt-2 break-all text-xs text-indigo-600 dark:text-indigo-300">{material.file_url}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Past and Active Assignments" subtitle="Open an assignment to inspect every submission and grade it." />
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {assignments.map((assignment) => (
                <button
                  key={assignment.id}
                  type="button"
                  onClick={() => {
                    setSelectedAssignmentId(assignment.id);
                    teacherApi.getAssignmentDetails(assignment.id).then((res) => setSelectedDetails(res.data.data)).catch(console.error);
                  }}
                  className={`rounded-3xl border p-5 text-left transition ${selectedAssignmentId === assignment.id ? 'border-primary bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{assignment.subject}</p>
                      <p className="text-xs text-slate-400">{assignment.className} - Section {assignment.sectionName}</p>
                    </div>
                    <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{assignment.type}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">{assignment.description}</p>
                  <div className="mt-4 grid gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <p>Scheduled: {assignment.scheduledAt ? new Date(assignment.scheduledAt).toLocaleString() : 'Immediate'}</p>
                    <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>
                    <p>Submissions: {assignment.totalSubmissions}</p>
                    <p>Pending Review: {assignment.pendingReview}</p>
                    <p>Max Marks: {assignment.maxMarks}</p>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title={selectedDetails ? `${selectedDetails.title} Details` : 'Assignment Details'}
              subtitle={selectedDetails ? `${selectedDetails.subject} | ${selectedDetails.className} Section ${selectedDetails.sectionName}` : 'Select an assignment to view submissions.'}
            />
            <div className="space-y-4 p-6">
              {selectedDetails ? (
                <>
                  {selectedDetails.questions?.length ? (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Quiz Questions</p>
                      <div className="mt-4 space-y-4">
                        {selectedDetails.questions.map((question, questionIndex) => (
                          <div key={question.id} className="rounded-2xl bg-white dark:bg-slate-900 p-4">
                            <p className="font-medium text-slate-900 dark:text-slate-100">Q{questionIndex + 1}. {question.question_text}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Marks: {question.marks}</p>
                            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                              {question.options.map((option, optionIndex) => (
                                <p key={option.id}>
                                  {String.fromCharCode(65 + optionIndex)}. {option.option_text}
                                  {question.correct_option_index === optionIndex ? ' (Correct)' : ''}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {selectedDetails.submissions.map((submission) => (
                    <div key={submission.id} className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{submission.student_name}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{submission.roll_number}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">{submission.status}</p>
                        </div>
                        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                          <p>Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : 'Not yet submitted'}</p>
                          {submission.file_url ? <p className="mt-1 break-all">{submission.file_url}</p> : null}
                          {submission.submitted_text ? <p className="mt-1 text-left">{submission.submitted_text}</p> : null}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                          value={gradeDrafts[submission.id] ?? String(submission.marks ?? '')}
                          onChange={(event) => setGradeDrafts((prev) => ({ ...prev, [submission.id]: event.target.value }))}
                          placeholder="Marks"
                          className="w-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const marks = Number(gradeDrafts[submission.id] ?? submission.marks ?? '');
                            if (Number.isNaN(marks)) return;
                            await teacherApi.gradeSubmission(selectedDetails.id, submission.id, { marks, status: 'graded' });
                            teacherApi.getAssignmentDetails(selectedDetails.id).then((res) => setSelectedDetails(res.data.data)).catch(console.error);
                            loadData(selectedDetails.id);
                          }}
                          className="rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
                        >
                          Save Grade
                        </button>
                        <button
                          type="button"
                          onClick={() => setGradeDrafts((prev) => ({ ...prev, [submission.id]: String(submission.marks ?? '') }))}
                          className="rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Select an assignment from the list to review student submissions and store marks.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
      />
    </div>
  );
}

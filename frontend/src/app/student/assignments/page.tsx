"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import AppShell from '../../components/shared/AppShell';
import { Panel, PanelHeader } from '../../components/shared/Panel';
import { studentApi } from '../../lib/api';

interface AssignmentItem {
  id: string;
  title: string;
  subject_name?: string;
  subject?: string;
  due_date?: string;
  dueDate?: string;
  scheduled_at?: string;
  scheduledAt?: string;
  status: string;
  marks: number | null;
  max_marks?: number;
  maxMarks?: number;
  description: string;
  type: string;
  file_url?: string | null;
  submitted_text?: string | null;
  answers?: Record<string, number>;
  submitted_at?: string | null;
  questions?: {
    id: string;
    question_text: string;
    marks: number;
    correct_option_index: number | null;
    options: { id: string; option_text: string; display_order: number }[];
  }[];
}

interface UploadedFileState {
  name: string;
  mimeType: string;
  base64: string;
  size: number;
}

export default function StudentAssignmentsPage() {
  const [selectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URL(window.location.href).searchParams.get('id');
  });
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [selected, setSelected] = useState<AssignmentItem | null>(null);
  const [uploadSource, setUploadSource] = useState<'drive' | 'device'>('drive');
  const [fileUrl, setFileUrl] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);
  const [message, setMessage] = useState('');

  const loadAssignmentDetail = async (id: string) => {
    const detail = await studentApi.getAssignments({ id });
    setSelected(detail.data.data);
    setFileUrl(detail.data.data?.file_url ?? '');
    setSubmissionText(detail.data.data?.submitted_text ?? '');
    setAnswers(detail.data.data?.answers ?? {});
    setUploadSource(detail.data.data?.file_url?.includes('/uploads/') ? 'device' : 'drive');
    setUploadedFile(null);
    setMessage('');
  };

  useEffect(() => {
    let active = true;

    studentApi
      .getAssignments()
      .then(async (res) => {
        if (!active) return;
        setAssignments(res.data.data);
        if (selectedId) {
          const detail = await studentApi.getAssignments({ id: selectedId });
          if (active) {
            setSelected(detail.data.data);
            setFileUrl(detail.data.data?.file_url ?? '');
            setSubmissionText(detail.data.data?.submitted_text ?? '');
            setAnswers(detail.data.data?.answers ?? {});
          }
        } else if (res.data.data[0] && active) {
          setSelected(res.data.data[0]);
        }
      })
      .catch(console.error);

    return () => {
      active = false;
    };
  }, [selectedId]);

  const canSubmit =
    selected &&
    selected.status === 'pending' &&
    (!selected.scheduledAt && !selected.scheduled_at || new Date() >= new Date(selected.scheduledAt ?? selected.scheduled_at ?? '')) &&
    new Date() <= new Date(selected.dueDate ?? selected.due_date ?? '');

  return (
    <AppShell role="student" title="Assignments" subtitle="Open any assignment to see full details, timing, status, and marks.">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Panel>
          <PanelHeader title="Assignment List" subtitle="Select an assignment to view its complete details." />
          <div className="space-y-3 p-6">
            {assignments.map((assignment) => (
              <button
                key={assignment.id}
                type="button"
                onClick={async () => {
                  await loadAssignmentDetail(assignment.id);
                }}
                className={`w-full rounded-2xl border px-4 py-4 text-left ${
                  selected?.id === assignment.id
                    ? 'border-primary bg-indigo-50 dark:bg-indigo-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'
                }`}
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100">{assignment.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{assignment.subject || assignment.subject_name}</p>
                <p className="mt-1 text-xs text-slate-400">{assignment.status}</p>
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title={selected?.title ?? 'Assignment Detail'} subtitle="View the assignment or quiz description, due date, marks, and submission status." />
          <div className="space-y-4 p-6">
            {selected ? (
              <>
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selected.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.subject || selected.subject_name}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : selected.status === 'submitted' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{selected.status}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">{selected.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard label="Type" value={selected.type} />
                  <InfoCard label="Due" value={selected.dueDate ? new Date(selected.dueDate).toLocaleString() : selected.due_date ? new Date(selected.due_date).toLocaleString() : '-'} />
                  <InfoCard label="Scheduled" value={selected.scheduledAt ? new Date(selected.scheduledAt).toLocaleString() : selected.scheduled_at ? new Date(selected.scheduled_at).toLocaleString() : 'Immediate'} />
                  <InfoCard label="Marks" value={`${selected.marks ?? 'Pending'} / ${selected.maxMarks ?? selected.max_marks ?? '-'}`} />
                </div>
                {selected.questions?.length ? (
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Quiz Questions</p>
                    <div className="mt-4 space-y-4">
                      {selected.questions.map((question, questionIndex) => (
                        <div key={question.id} className="rounded-2xl bg-white dark:bg-slate-900 p-4">
                          <p className="font-medium text-slate-900 dark:text-slate-100">Q{questionIndex + 1}. {question.question_text}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Marks: {question.marks}</p>
                          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            {question.options.map((option, optionIndex) => (
                              <label key={option.id} className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name={question.id}
                                  disabled={!canSubmit}
                                  checked={answers[question.id] === optionIndex}
                                  onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                                />
                                <span>{String.fromCharCode(65 + optionIndex)}. {option.option_text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selected.status === 'pending' ? (
                  <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">Submit Work</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {canSubmit ? 'The submission window is open.' : 'This item is not currently open for submission.'}
                    </p>
                    {selected.type !== 'quiz' ? (
                      <div className="mt-4 space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => setUploadSource('drive')}
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                              uploadSource === 'drive'
                                ? 'border-primary bg-indigo-50 text-primary dark:bg-indigo-500/10'
                                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Upload from Drive / Link
                          </button>
                          <button
                            type="button"
                            onClick={() => setUploadSource('device')}
                            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
                              uploadSource === 'device'
                                ? 'border-primary bg-indigo-50 text-primary dark:bg-indigo-500/10'
                                : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            Upload from Device
                          </button>
                        </div>
                        {uploadSource === 'drive' ? (
                          <input
                            value={fileUrl}
                            onChange={(event) => setFileUrl(event.target.value)}
                            disabled={!canSubmit}
                            placeholder="Paste file / drive URL"
                            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary disabled:opacity-60"
                          />
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 px-4 py-4">
                            <input
                              type="file"
                              disabled={!canSubmit}
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];
                                if (!file) {
                                  setUploadedFile(null);
                                  return;
                                }

                                const base64 = await new Promise<string>((resolve, reject) => {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const result = String(reader.result || '');
                                    resolve(result.includes(',') ? result.split(',')[1] : result);
                                  };
                                  reader.onerror = () => reject(new Error('Could not read the selected file.'));
                                  reader.readAsDataURL(file);
                                });

                                setUploadedFile({
                                  name: file.name,
                                  mimeType: file.type || 'application/octet-stream',
                                  size: file.size,
                                  base64,
                                });
                                setFileUrl('');
                              }}
                              className="w-full text-sm text-slate-700 file:mr-4 file:rounded-2xl file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-white dark:text-slate-200"
                            />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Supported: PDF, DOC, DOCX, TXT, PPT, XLS, and common image formats. Max 10 MB.
                            </p>
                            {uploadedFile ? (
                              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                Selected file: {uploadedFile.name}
                              </p>
                            ) : null}
                          </div>
                        )}
                        <textarea
                          value={submissionText}
                          onChange={(event) => setSubmissionText(event.target.value)}
                          disabled={!canSubmit}
                          rows={4}
                          placeholder="Submission note or answer text"
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                    ) : null}
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        disabled={!canSubmit}
                        onClick={async () => {
                          if (!selected) return;
                          await studentApi.submitAssignment(selected.id, {
                            file_url: uploadSource === 'drive' ? fileUrl : '',
                            submitted_text: submissionText,
                            answers,
                            uploaded_file: uploadSource === 'device' ? uploadedFile : null,
                          });
                          await loadAssignmentDetail(selected.id);
                          setMessage('Submitted successfully. Your teacher can now review it.');
                        }}
                        className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save Submission
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl(selected.file_url ?? '');
                          setSubmissionText(selected.submitted_text ?? '');
                          setAnswers(selected.answers ?? {});
                          setUploadSource(selected.file_url?.includes('/uploads/') ? 'device' : 'drive');
                          setUploadedFile(null);
                          setMessage('');
                        }}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 font-semibold text-slate-600 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                    {message ? <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-300">{message}</p> : null}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-5 text-sm text-emerald-800 dark:text-emerald-200">
                    Submitted {selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : ''}. Marks: {selected.marks ?? 'Pending review'}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Select an assignment from the left.</p>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
    </div>
  );
}

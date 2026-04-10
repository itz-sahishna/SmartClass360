/*
'use client';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import ProfileDropdown from '@/components/shared/ProfileDropdown';

export default function Page() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'student') return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex pl-64">
      <Sidebar role="student" />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              Profile
            </h2>
            <p className="text-sm text-slate-500">Manage your profile here.</p>
          </div>
          <ProfileDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Profile Module</h3>
            <p className="text-slate-500">This module is currently under construction.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
*/

'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { studentApi } from '@/lib/api';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  department: string;
  roll_number: string;
  year: number;
  profile: {
    bio: string;
    location: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

export default function StudentProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [initialData, setInitialData] = useState<ProfileData | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    studentApi.getProfile().then((res) => {
      setData(res.data.data);
      setInitialData(res.data.data);
    }).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title="Profile"
      subtitle="Manage your student information and preferences."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Student Details"
            subtitle="Keep your basic account information current."
          />
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <Input label="Full Name" value={data?.name ?? ''} onChange={(value) => setData((prev) => (prev ? { ...prev, name: value } : prev))} />
            <Input label="Email" value={data?.email ?? ''} onChange={(value) => setData((prev) => (prev ? { ...prev, email: value } : prev))} />
            <Input label="Phone" value={data?.phone ?? ''} onChange={(value) => setData((prev) => (prev ? { ...prev, phone: value } : prev))} />
            <Input label="Department" value={data?.department ?? ''} onChange={(value) => setData((prev) => (prev ? { ...prev, department: value } : prev))} />
            <Input label="Roll Number" value={data?.roll_number ?? ''} onChange={(value) => setData((prev) => (prev ? { ...prev, roll_number: value } : prev))} />
            <Input label="Academic Year" value={String(data?.year ?? '')} onChange={(value) => setData((prev) => (prev ? { ...prev, year: Number(value) } : prev))} />
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
              <textarea
                value={data?.profile.bio ?? ''}
                onChange={(event) => setData((prev) => (prev ? { ...prev, profile: { ...prev.profile, bio: event.target.value } } : prev))}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!data) return;
                    await studentApi.requestProfileUpdate(data);
                    setMessage('Profile change request sent to admin for approval.');
                    setInitialData(data);
                  }}
                  className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
                >
                  Save Request
                </button>
                <button
                  type="button"
                  onClick={() => setData(initialData)}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </div>
            {message ? <p className="md:col-span-2 text-sm font-medium text-emerald-600">{message}</p> : null}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Settings"
            subtitle="Choose how SmartClass 360 notifies you."
          />
          <div className="space-y-5 p-6">
            <Preference
              title="Email Notifications"
              checked={data?.profile.notifications.email ?? false}
              onToggle={() =>
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: {
                          ...prev.profile,
                          notifications: {
                            ...prev.profile.notifications,
                            email: !prev.profile.notifications.email,
                          },
                        },
                      }
                    : prev
                )
              }
            />
            <Preference
              title="Push Notifications"
              checked={data?.profile.notifications.push ?? false}
              onToggle={() =>
                setData((prev) =>
                  prev
                    ? {
                        ...prev,
                        profile: {
                          ...prev.profile,
                          notifications: {
                            ...prev.profile.notifications,
                            push: !prev.profile.notifications.push,
                          },
                        },
                      }
                    : prev
                )
              }
            />
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 text-sm text-slate-500 dark:text-slate-400">
              Timezone: {data?.profile.timezone ?? 'Asia/Kolkata'}
            </div>
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
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-primary"
      />
    </div>
  );
}

function Preference({
  title,
  checked,
  onToggle,
}: {
  title: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-8 w-14 items-center rounded-full p-1 transition ${checked ? 'bg-primary' : 'bg-slate-300'}`}
      >
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

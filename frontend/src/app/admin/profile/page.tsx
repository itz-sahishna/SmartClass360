'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { adminApi } from '@/lib/api';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  department: string;
  profile: {
    designation: string;
    bio: string;
    location: string;
    timezone: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

export default function AdminProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [initialData, setInitialData] = useState<ProfileData | null>(null);

  useEffect(() => {
    adminApi.getProfile().then((res) => {
      setData(res.data.data);
      setInitialData(res.data.data);
    }).catch(console.error);
  }, []);

  const updateField = (field: keyof ProfileData, value: string) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  return (
    <AppShell
      role="admin"
      title="Profile"
      subtitle="Manage your admin details, settings, and notification preferences."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <PanelHeader
            title="Account Settings"
            subtitle="Keep your main profile information up to date."
          />
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <Input label="Full Name" value={data?.name ?? ''} onChange={(value) => updateField('name', value)} />
            <Input label="Email" value={data?.email ?? ''} onChange={(value) => updateField('email', value)} />
            <Input label="Phone" value={data?.phone ?? ''} onChange={(value) => updateField('phone', value)} />
            <Input label="Department" value={data?.department ?? ''} onChange={(value) => updateField('department', value)} />
            <Input
              label="Designation"
              value={data?.profile.designation ?? ''}
              onChange={(value) =>
                setData((prev) =>
                  prev
                    ? { ...prev, profile: { ...prev.profile, designation: value } }
                    : prev
                )
              }
            />
            <Input
              label="Location"
              value={data?.profile.location ?? ''}
              onChange={(value) =>
                setData((prev) =>
                  prev ? { ...prev, profile: { ...prev.profile, location: value } } : prev
                )
              }
            />
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
              <textarea
                value={data?.profile.bio ?? ''}
                onChange={(event) =>
                  setData((prev) =>
                    prev ? { ...prev, profile: { ...prev.profile, bio: event.target.value } } : prev
                  )
                }
                rows={5}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!data) return;
                    await adminApi.updateProfile(data);
                    setInitialData(data);
                  }}
                  className="rounded-2xl bg-primary px-5 py-3 font-semibold text-white"
                >
                  Save Profile
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
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Preferences"
            subtitle="Control the way SmartClass 360 reaches you."
          />
          <div className="space-y-5 p-6">
            <Preference
              title="Email Notifications"
              description="Receive request approvals, account alerts, and institute summaries by email."
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
              description="Get live browser alerts for urgent events and special requests."
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
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timezone</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{data?.profile.timezone ?? 'Asia/Kolkata'}</p>
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
        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function Preference({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`flex h-8 w-14 items-center rounded-full p-1 transition ${
            checked ? 'bg-primary' : 'bg-slate-300'
          }`}
        >
          <span
            className={`h-6 w-6 rounded-full bg-white transition ${
              checked ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

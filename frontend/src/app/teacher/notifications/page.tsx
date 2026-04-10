/*
'use client';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import ProfileDropdown from '@/components/shared/ProfileDropdown';

export default function Page() {
  const { user } = useAuth();
  
  if (!user || user.role !== 'teacher') return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex pl-64">
      <Sidebar role="teacher" />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-slate-500">Manage your notifications here.</p>
          </div>
          <ProfileDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Notifications Module</h3>
            <p className="text-slate-500">This module is currently under construction.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
*/

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { teacherApi } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  is_read: boolean;
  action_url?: string;
}

export default function TeacherNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    teacherApi.getNotifications().then((res) => setItems(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="teacher"
      title="Notifications"
      subtitle="Alerts for submissions, student risks, and institute deadlines."
    >
      <Panel>
        <PanelHeader
          title="Latest Alerts"
          subtitle="Everything that needs your attention across classes and students."
        />
        <div className="space-y-4 p-6">
          {items.map((item) => (
            <Link key={item.id} href={item.action_url || '/teacher/dashboard'} className="block rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.message}</p>
              {item.action_url ? <p className="mt-2 text-xs text-indigo-600 dark:text-indigo-300">Open related page</p> : null}
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

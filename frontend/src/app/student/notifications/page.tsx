'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/shared/AppShell';
import { Panel, PanelHeader } from '@/components/shared/Panel';
import { studentApi } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: string;
  is_read: boolean;
  action_url?: string;
}

export default function StudentNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  useEffect(() => {
    studentApi.getNotifications().then((res) => setItems(res.data.data)).catch(console.error);
  }, []);

  return (
    <AppShell
      role="student"
      title="Notifications"
      subtitle="See reminders, assignment alerts, request updates, and the tasks you still need to complete."
    >
      <Panel>
        <PanelHeader title="Inbox" subtitle="Recent updates that matter for your coursework and requests." />
        <div className="space-y-4 p-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.action_url || '/student/dashboard'}
              className="block rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.type}</p>
                </div>
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">{item.message}</p>
              <div className="mt-3 flex items-center gap-3 text-xs">
                <span className={`rounded-full px-3 py-1 font-semibold ${item.is_read ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'}`}>
                  {item.is_read ? 'Read' : 'Unread'}
                </span>
                {item.action_url ? <span className="text-indigo-600 dark:text-indigo-300">Open related page</span> : null}
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </AppShell>
  );
}

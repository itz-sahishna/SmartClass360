'use client';

import { ReactNode, useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import ProfileDropdown from '@/components/shared/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface AppShellProps {
  role: 'admin' | 'teacher' | 'student';
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}

export default function AppShell({
  role,
  title,
  subtitle,
  children,
  actions,
}: AppShellProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (user.role !== role) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [loading, role, router, user]);

  if (loading || !user || user.role !== role) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-950">
      <Sidebar
        role={role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 md:px-8">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-sm lg:hidden"
              >
                <Menu size={18} />
              </button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {title}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {actions}
              <ProfileDropdown />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

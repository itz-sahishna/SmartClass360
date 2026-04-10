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
              Exams & Marks Entry
            </h2>
            <p className="text-sm text-slate-500">Manage your exams & marks entry here.</p>
          </div>
          <ProfileDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Exams & Marks Entry Module</h3>
            <p className="text-slate-500">This module is currently under construction.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

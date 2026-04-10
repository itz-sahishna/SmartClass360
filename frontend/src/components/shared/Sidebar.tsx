'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart3,
  Bot,
  FileText,
  ClipboardList,
  Bell,
  CalendarDays,
  LogOut,
  UserRoundCog,
  ChevronLeft,
  NotebookPen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  role: 'admin' | 'teacher' | 'student';
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ role, open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const routes = {
    admin: [
      { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
      { name: 'Users', path: '/admin/users', icon: Users },
      { name: 'Profile', path: '/admin/profile', icon: UserRoundCog },
    ],
    teacher: [
      { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
      { name: 'Assignments', path: '/teacher/assignments', icon: FileText },
      { name: 'Attendance', path: '/teacher/attendance', icon: Users },
      { name: 'Marks', path: '/teacher/marks', icon: NotebookPen },
      { name: 'Analysis', path: '/teacher/analysis', icon: BarChart3 },
      { name: 'Notifications', path: '/teacher/notifications', icon: Bell },
      { name: 'Profile', path: '/teacher/profile', icon: UserRoundCog },
      { name: 'Subjects', path: '/teacher/subjects', icon: BookOpen },
    ],
    student: [
      { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
      { name: 'Attendance', path: '/student/attendance', icon: Users },
      { name: 'Assignments', path: '/student/assignments', icon: FileText },
      { name: 'Analysis', path: '/student/analysis', icon: BarChart3 },
      { name: 'Exams', path: '/student/exams', icon: ClipboardList },
      { name: 'Notifications', path: '/student/notifications', icon: Bell },
      { name: 'Subjects', path: '/student/subjects', icon: BookOpen },
      { name: 'Timetable', path: '/student/timetable', icon: CalendarDays },
      { name: 'Profile', path: '/student/profile', icon: UserRoundCog },
      { name: 'Gen AI', path: '/student/ai', icon: Bot },
    ],
  };

  const links = routes[role] || [];

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            SmartClass 360
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">{role} module</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 lg:hidden"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.path);
          return (
            <Link 
              key={link.path} 
              href={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                isActive 
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-primary shadow-sm' 
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
              onClick={onClose}
            >
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              {link.name}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-600 transition-all hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
    </>
  );
}

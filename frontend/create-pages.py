import os

src_app_dir = 'c:/Users/Satvik/OneDrive/Documents/SmartClass 360/frontend/src/app'

pages = [
    { 'route': '/admin/users', 'title': 'User Management', 'role': 'admin' },
    { 'route': '/admin/analytics', 'title': 'Analytics', 'role': 'admin' },
    { 'route': '/teacher/attendance', 'title': 'Attendance Management', 'role': 'teacher' },
    { 'route': '/teacher/subjects', 'title': 'Subjects', 'role': 'teacher' },
    { 'route': '/teacher/assignments', 'title': 'Assignments Management', 'role': 'teacher' },
    { 'route': '/teacher/exams', 'title': 'Exams & Marks Entry', 'role': 'teacher' },
    { 'route': '/teacher/analytics', 'title': 'Reports & Analytics', 'role': 'teacher' },
    { 'route': '/teacher/notifications', 'title': 'Notifications', 'role': 'teacher' },
    { 'route': '/teacher/profile', 'title': 'Profile', 'role': 'teacher' },
    { 'route': '/student/attendance', 'title': 'My Attendance', 'role': 'student' },
    { 'route': '/student/subjects', 'title': 'My Subjects', 'role': 'student' },
    { 'route': '/student/assignments', 'title': 'My Assignments', 'role': 'student' },
    { 'route': '/student/exams', 'title': 'Exams & Results', 'role': 'student' },
    { 'route': '/student/analysis', 'title': 'Performance Analytics', 'role': 'student' },
    { 'route': '/student/notifications', 'title': 'Notifications', 'role': 'student' },
    { 'route': '/student/timetable', 'title': 'Timetable', 'role': 'student' },
    { 'route': '/student/profile', 'title': 'Profile', 'role': 'student' },
    { 'route': '/student/ai', 'title': 'AI Assistant', 'role': 'student' }
]

template = """'use client';
import {{ useAuth }} from '@/contexts/AuthContext';
import Sidebar from '@/components/shared/Sidebar';
import ProfileDropdown from '@/components/shared/ProfileDropdown';

export default function Page() {{
  const {{ user }} = useAuth();
  
  if (!user || user.role !== '{role}') return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex pl-64">
      <Sidebar role="{role}" />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-slate-500">Manage your {title_lower} here.</p>
          </div>
          <ProfileDropdown />
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{title} Module</h3>
            <p className="text-slate-500">This module is currently under construction.</p>
          </div>
        </div>
      </main>
    </div>
  );
}}
"""

for p in pages:
    dir_path = os.path.join(src_app_dir, p['route'].lstrip('/'))
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, 'page.tsx')
    if not os.path.exists(file_path):
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(template.format(
                role=p['role'],
                title=p['title'],
                title_lower=p['title'].lower()
            ))

print("Pages generated successfully.")

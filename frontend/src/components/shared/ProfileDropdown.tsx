'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, HelpCircle, FileText, Shield, Moon, Sun, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const profilePath = `/${user.role}/profile`;

  const menuItems = [
    { icon: User, label: 'Profile', onClick: () => router.push(profilePath) },
    { icon: Settings, label: 'Settings', onClick: () => router.push(`/${user.role}/preferences`) },
    { icon: HelpCircle, label: 'Help & Support', onClick: () => router.push(`/${user.role}/help`) },
    { icon: FileText, label: 'FAQs', onClick: () => router.push(`/${user.role}/faqs`) },
    { icon: Shield, label: 'Privacy Settings', onClick: () => router.push(`/${user.role}/privacy`) },
  ];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all group"
      >
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 border-2 border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold group-hover:scale-105 transition-transform">
          {user.name.charAt(0)}
        </div>
        <div className="hidden sm:block text-left mr-2">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{user.name}</p>
          <p className="text-xs text-slate-500 capitalize">{user.role}</p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <p className="font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
              <p className="text-sm text-slate-500 truncate">{user.email}</p>
            </div>
            
            <div className="p-2">
               {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => { item.onClick(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary rounded-lg transition-colors"
                  >
                    <Icon size={18} />
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={() => {
                  toggleTheme();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary rounded-lg transition-colors"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              </button>
              
              <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-1" />
              
              <button
                onClick={() => { logout(); setIsOpen(false); router.push('/login'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg ${color}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

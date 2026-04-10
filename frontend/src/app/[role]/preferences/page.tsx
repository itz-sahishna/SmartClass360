'use client';

import { notFound, useParams } from 'next/navigation';
import ModuleInfoPage from '@/components/shared/ModuleInfoPage';

const roles = ['admin', 'teacher', 'student'] as const;

export default function RolePreferencesPage() {
  const params = useParams<{ role: string }>();
  const role = params.role;

  if (!roles.includes(role as (typeof roles)[number])) {
    notFound();
  }

  return <ModuleInfoPage role={role as (typeof roles)[number]} page="preferences" />;
}

'use client';

import { notFound, useParams } from 'next/navigation';
import ModuleInfoPage from '../../components/shared/ModuleInfoPage';

const roles = ['admin', 'teacher', 'student'] as const;

export default function RoleHelpPage() {
  const params = useParams<{ role: string }>();
  const role = params.role;
  // #region agent log
  fetch('http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'addc84'},body:JSON.stringify({sessionId:'addc84',runId:'initial',hypothesisId:'H3',location:'src/app/[role]/help/page.tsx:11',message:'Role help page evaluated',data:{role,allowed:roles},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  if (!roles.includes(role as (typeof roles)[number])) {
    // #region agent log
    fetch('http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'addc84'},body:JSON.stringify({sessionId:'addc84',runId:'initial',hypothesisId:'H3',location:'src/app/[role]/help/page.tsx:15',message:'Role help page triggering notFound',data:{role},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    notFound();
  }

  return <ModuleInfoPage role={role as (typeof roles)[number]} page="help" />;
}

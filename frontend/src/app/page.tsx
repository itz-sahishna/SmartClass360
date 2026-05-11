import LoginForm from './components/auth/LoginForm';

export default function Home() {
  // #region agent log
  fetch('http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'addc84'},body:JSON.stringify({sessionId:'addc84',runId:'initial',hypothesisId:'H4',location:'src/app/page.tsx:4',message:'Home page rendered',data:{path:typeof window!=='undefined'?window.location.pathname:'server'},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
      
      {/* Login Container */}
      <div className="w-full max-w-5xl z-10 animate-slide-up">
        <LoginForm />
      </div>
    </main>
  );
}

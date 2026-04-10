import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
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

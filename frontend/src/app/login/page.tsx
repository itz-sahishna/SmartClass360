import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-400/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
      <div className="z-10 w-full max-w-5xl animate-slide-up">
        <LoginForm />
      </div>
    </main>
  );
}

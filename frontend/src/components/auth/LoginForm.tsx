'use client';
import { useState } from 'react';
import { useEffect } from 'react';
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedCreatures from './AnimatedCreatures';

export default function LoginForm() {
  const [identifier, setIdentifier] = useState('admin@smartclass.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    router.replace(`/${user.role}/dashboard`);
  }, [loading, router, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus('idle');
    try {
      await login(identifier, password, rememberMe);
      setStatus('success');
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setStatus('error');
      setErrorMsg(apiError.response?.data?.message || 'Invalid credentials');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-5xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden min-h-[600px] border border-white/20">
      
      {/* LEFT: Animated Features Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 border-r border-slate-200 dark:border-slate-800 p-12 flex-col items-center justify-center relative">
        <div className="absolute top-8 left-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            SmartClass 360
          </h1>
        </div>
        
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">SmartClass 360</p>
        </div>
        <AnimatedCreatures isPasswordVisible={showPassword} status={status} />
        
        <div className="mt-12 text-center max-w-sm">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
            {status === 'success' ? 'Welcome Back!' : status === 'error' ? 'Oops, try again.' : 'We are watching out for you.'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Login as Admin, Teacher, or Student to access your personalized intelligent dashboard.
          </p>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">Sign In</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Enter your details to access your account.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Roll Number, Email or Phone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="e.g. admin@smartclass.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 group-hover:border-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                  />
                  {rememberMe && (
                    <svg className="w-3 h-3 text-primary pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium select-none">Remember me</span>
              </label>

              <a href="#" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
                Forgot Password?
              </a>
            </div>

            {errorMsg && status === 'error' && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 dark:bg-red-900/30 dark:border-red-900 dark:text-red-400 animate-fade-in">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-primary text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20}/> : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '../src/app/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    identifier: string,
    password: string,
    rememberMe: boolean
  ) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ LOAD USER FROM LOCAL STORAGE (SAFE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken =
        localStorage.getItem('sc360_token') ||
        sessionStorage.getItem('sc360_token');
      const storedUser =
        localStorage.getItem('sc360_user') ||
        sessionStorage.getItem('sc360_user');

      if (storedToken && storedUser) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // ✅ LOGIN (CONNECTED TO YOUR API LAYER)
  const login = async (
    identifier: string,
    password: string,
    rememberMe: boolean
  ) => {
    try {
      const res = await authApi.login(
        identifier,
        password,
        rememberMe
      );

      const { token: newToken, user: newUser } = res.data;
      // #region agent log
      fetch('http://127.0.0.1:7586/ingest/52c81873-b59d-4be5-b957-ad89573d8c54',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'addc84'},body:JSON.stringify({sessionId:'addc84',runId:'initial',hypothesisId:'H1',location:'contexts/AuthContext.tsx:74',message:'Login response role captured',data:{role:newUser?.role,hasToken:Boolean(newToken)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      // store
      setToken(newToken);
      setUser(newUser);

      if (typeof window !== 'undefined') {
        const storage = rememberMe ? localStorage : sessionStorage;
        localStorage.removeItem('sc360_token');
        localStorage.removeItem('sc360_user');
        sessionStorage.removeItem('sc360_token');
        sessionStorage.removeItem('sc360_user');
        storage.setItem('sc360_token', newToken);
        storage.setItem('sc360_user', JSON.stringify(newUser));
      }

      // ✅ ROLE BASED ROUTING
      if (newUser.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (newUser.role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }

    } catch (err) {
      // ✅ IMPORTANT: throw error so LoginForm can show it
      throw err;
    }
  };

  // ✅ LOGOUT
  const logout = () => {
    setToken(null);
    setUser(null);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('sc360_token');
      localStorage.removeItem('sc360_user');
      sessionStorage.removeItem('sc360_token');
      sessionStorage.removeItem('sc360_user');
    }

    router.push('/login'); // ✅ FIXED
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ✅ HOOK
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

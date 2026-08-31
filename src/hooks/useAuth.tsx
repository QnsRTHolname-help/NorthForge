import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@/types';
import { authService } from '@/services';

interface AuthResult { ok: boolean; error?: string; role?: 'admin' | 'client'; }
interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (input: { name: string; email: string; password: string; business: string; phone?: string }) => Promise<AuthResult>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, login: async () => ({ ok: false }), register: async () => ({ ok: false }), logout: () => {} });
const KEY = 'northforge.session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });

  useEffect(() => {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  }, [user]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const res = await authService.login(email, password);
    if ('error' in res) return { ok: false, error: res.error };
    setUser(res.user);
    return { ok: true, role: res.user.role };
  };

  const register = async (input: { name: string; email: string; password: string; business: string; phone?: string }): Promise<AuthResult> => {
    const res = await authService.register(input);
    if ('error' in res) return { ok: false, error: res.error };
    setUser(res.user);
    return { ok: true, role: res.user.role };
  };

  const logout = () => setUser(null);

  return <Ctx.Provider value={{ user, login, register, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

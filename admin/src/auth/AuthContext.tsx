import React, { createContext, useContext, useState } from 'react';
import { getToken, setToken, clearToken } from '../api/client';
import { adminApi } from '../api/admin';

interface AuthValue {
  isAuthed: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [isAuthed, setIsAuthed] = useState<boolean>(Boolean(getToken()));

  const login = async (email: string, password: string): Promise<void> => {
    const token = await adminApi.login(email, password);
    setToken(token);
    setIsAuthed(true);
  };

  const logout = (): void => {
    clearToken();
    setIsAuthed(false);
  };

  return <AuthContext.Provider value={{ isAuthed, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

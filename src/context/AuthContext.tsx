import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.auth.me();
        if (res.success && res.data) setUser(res.data);
        else {
          localStorage.removeItem('access_token');
          setToken(null);
        }
      } catch {
        localStorage.removeItem('access_token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login({ email, password: pass });
      if (!res.success || !res.data) return false;
      localStorage.setItem('access_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    setLoading(true);
    try {
      const res = await api.auth.register({ email, password: pass, full_name: name, phone });
      if (!res.success || !res.data) return false;
      localStorage.setItem('access_token', res.data.access_token);
      setToken(res.data.access_token);
      setUser(res.data.user);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isAdmin: user?.role === 'admin' || user?.role === 'manager' || user?.role === 'superadmin',
      login,
      register,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

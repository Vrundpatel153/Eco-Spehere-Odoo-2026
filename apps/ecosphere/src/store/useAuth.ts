import { useState, useEffect } from 'react';

export type UserRole = 'admin' | 'employee' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  avatar?: string;
  createdAt: string;
  xp: number;
  points: number;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  loginAt: string;
}

function initSession(): Session | null {
  try {
    const raw = localStorage.getItem('esg_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    localStorage.removeItem('esg_session');
    return null;
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(initSession);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getHeaders = () => {
    const token = localStorage.getItem('esg_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('esg_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders(),
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch current user profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthUpdate = () => {
      try {
        const raw = localStorage.getItem('esg_session');
        setSession(raw ? JSON.parse(raw) : null);
      } catch {
        setSession(null);
      }
      fetchCurrentUser();
    };

    window.addEventListener('esg_auth_update', handleAuthUpdate);
    window.addEventListener('esg_store_update', handleAuthUpdate);
    
    return () => {
      window.removeEventListener('esg_auth_update', handleAuthUpdate);
      window.removeEventListener('esg_store_update', handleAuthUpdate);
    };
  }, []);

  const triggerUpdate = () => {
    window.dispatchEvent(new Event('esg_auth_update'));
  };

  const register = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      localStorage.setItem('esg_token', result.token);
      const newSession: Session = {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        department: result.user.department,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem('esg_session', JSON.stringify(newSession));
      setSession(newSession);
      setUser(result.user);
      triggerUpdate();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Invalid email or password' };
      }

      localStorage.setItem('esg_token', result.token);
      const newSession: Session = {
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        department: result.user.department,
        loginAt: new Date().toISOString(),
      };
      localStorage.setItem('esg_session', JSON.stringify(newSession));
      setSession(newSession);
      setUser(result.user);
      triggerUpdate();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('esg_session');
    localStorage.removeItem('esg_token');
    setSession(null);
    setUser(null);
    triggerUpdate();
  };

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updates),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Profile update failed' };
      }

      if (session) {
        const newSession = {
          ...session,
          name: result.name,
          email: result.email,
          department: result.department,
        };
        localStorage.setItem('esg_session', JSON.stringify(newSession));
        setSession(newSession);
      }
      setUser(result);
      triggerUpdate();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await res.json();
      if (!res.ok) {
        return { success: false, error: result.error || 'Password update failed' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    user,
    session,
    isLoading,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
  };
}

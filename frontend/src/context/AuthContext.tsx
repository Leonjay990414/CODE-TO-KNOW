import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

export type AuthModalMode = 'login' | 'register' | 'forgot-password' | 'reset-password';
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  authStatus: AuthStatus;
  authError: string | null;
  authModalOpen: boolean;
  authModalMode: AuthModalMode;
  openAuth: (mode?: AuthModalMode) => void;
  closeAuth: () => void;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  const refreshUser = async () => {
    setIsLoading(true);
    setAuthStatus('loading');
    try {
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        setAuthStatus('authenticated');
        setAuthError(null);
      } else {
        setUser(null);
        if (res.error?.code === 'NETWORK_ERROR') {
          setAuthStatus('error');
          setAuthError(res.error.message || '連線至伺服器失敗，請確認網路或後端狀態');
        } else {
          setAuthStatus('unauthenticated');
          setAuthError(null);
        }
      }
    } catch {
      setUser(null);
      setAuthStatus('error');
      setAuthError('無法連線至認證服務，請檢查網路連線或伺服器狀態');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const openAuth = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuth = () => {
    setAuthModalOpen(false);
  };

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      setAuthStatus('authenticated');
      setAuthError(null);
    } else {
      setAuthStatus('unauthenticated');
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authApi.login(credentials);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      setAuthStatus('authenticated');
      setAuthError(null);
      return { success: true };
    }
    return { success: false, error: res.error?.message || '登入失敗，請檢查帳號與密碼' };
  };

  const register = async (data: { email: string; password: string; displayName: string }) => {
    const res = await authApi.register(data);
    if (res.success && res.data?.user) {
      // Automatic login after successful registration
      const loginRes = await authApi.login({ email: data.email, password: data.password });
      if (loginRes.success && loginRes.data?.user) {
        setUser(loginRes.data.user);
        setAuthStatus('authenticated');
        setAuthError(null);
      }
      return { success: true };
    }
    return { success: false, error: res.error?.message || '註冊失敗，請稍後再試' };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAuthStatus('unauthenticated');
      setAuthError(null);
      sessionStorage.removeItem('ctk_intended_route');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        authStatus,
        authError,
        authModalOpen,
        authModalMode,
        openAuth,
        closeAuth,
        login,
        register,
        logout,
        refreshUser,
        setUser: handleSetUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

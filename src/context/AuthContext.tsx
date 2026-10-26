import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Clinic } from '../types/index.js';
import { api, getStoredToken, setStoredToken, clearStoredToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  clinic: Clinic | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  registerClinic: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    clinic_name: string;
    address?: string;
    specialization?: string;
    registration_number?: string;
  }) => Promise<void>;
  switchDemo: (email: string) => Promise<void>;
  logout: () => void;
  refreshClinic: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = async () => {
    const existingToken = getStoredToken();
    if (!existingToken) {
      // Auto-login with default demo user (Dr. Rajesh Sharma, Clinic Owner) so the app is instantly usable
      try {
        const res = await api.switchDemo('rajesh@arogya.in');
        setStoredToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setClinic(res.clinic);
      } catch (e) {
        console.warn('Auto-login fallback:', e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setClinic(res.clinic);
    } catch (e) {
      console.warn('Session expired, switching to demo:', e);
      clearStoredToken();
      setToken(null);
      setUser(null);
      setClinic(null);
      // Auto-fallback to demo
      try {
        const res = await api.switchDemo('rajesh@arogya.in');
        setStoredToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setClinic(res.clinic);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login({
        email: credentials.email.trim(),
        password: credentials.password.trim()
      });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setClinic(res.clinic);
    } finally {
      setIsLoading(false);
    }
  };

  const registerClinic = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    clinic_name: string;
    address?: string;
    specialization?: string;
    registration_number?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.registerClinic({
        ...data,
        email: data.email.trim(),
        password: data.password.trim()
      });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setClinic(res.clinic);
    } finally {
      setIsLoading(false);
    }
  };

  const switchDemo = async (email: string) => {
    setIsLoading(true);
    try {
      const res = await api.switchDemo(email.trim());
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setClinic(res.clinic);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setClinic(null);
  };

  const refreshClinic = async () => {
    try {
      const res = await api.getCurrentClinic();
      setClinic(res.clinic);
    } catch (e) {
      console.error('Failed to refresh clinic:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clinic,
        token,
        isLoading,
        login,
        registerClinic,
        switchDemo,
        logout,
        refreshClinic
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

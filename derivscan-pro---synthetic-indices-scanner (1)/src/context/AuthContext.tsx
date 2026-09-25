import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, SubscriptionTier } from '../types/scanner';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  upgradeTier: (tier: SubscriptionTier, days?: number) => Promise<void>;
  updateDerivConfig: (token: string, appId?: string, account?: UserProfile['derivAccount']) => Promise<void>;
  isProOrHigher: boolean;
  isYearlyVip: boolean;
  activeTier: SubscriptionTier;
  daysRemaining: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('derivscan_token') : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session or default to demo user if no token exists
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (e) {
          console.warn('Session expired, logging into demo user');
          await autoLoginDemo();
        }
      } else {
        await autoLoginDemo();
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const autoLoginDemo = async () => {
    try {
      // Default to Pro trader demo for rich interactive experience
      const res = await api.login('trader@derivscan.pro', 'Password123!');
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('derivscan_token', res.token);
    } catch (e) {
      console.error('Demo login error:', e);
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('derivscan_token', res.token);
  };

  const register = async (email: string, pass: string, name: string) => {
    const res = await api.register(email, pass, name);
    setUser(res.user);
    setToken(res.token);
    localStorage.setItem('derivscan_token', res.token);
  };

  const logout = () => {
    setUser({
      id: 'guest',
      email: 'guest@derivscan.pro',
      name: 'Guest Trader',
      tier: 'FREE',
      tierExpiresAt: null,
      createdAt: Date.now()
    });
    setToken(null);
    localStorage.removeItem('derivscan_token');
  };

  const upgradeTier = async (tier: SubscriptionTier, days: number = 30) => {
    if (!token) return;
    const res = await api.upgradeTier(tier, days);
    setUser(res.user);
  };

  const updateDerivConfig = async (derivToken: string, appId?: string, account?: UserProfile['derivAccount']) => {
    if (!token) return;
    const res = await api.updateSettings(derivToken, appId, account);
    setUser(res.user);
  };

  const activeTier: SubscriptionTier = user?.tier || 'FREE';
  const isProOrHigher = activeTier === 'MONTHLY' || activeTier === 'YEARLY' || activeTier === 'WEEKLY';
  const isYearlyVip = activeTier === 'YEARLY';

  const daysRemaining = user?.tierExpiresAt
    ? Math.max(0, Math.ceil((user.tierExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && user.id !== 'guest',
        isLoading,
        login,
        register,
        logout,
        upgradeTier,
        updateDerivConfig,
        isProOrHigher,
        isYearlyVip,
        activeTier,
        daysRemaining
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

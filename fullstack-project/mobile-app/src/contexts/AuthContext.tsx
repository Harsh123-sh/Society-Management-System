import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, setApiToken } from '../services/api';
import type { AppRole, UserProfile } from '../types/models';

type AuthState = {
  user: UserProfile | null;
  isBootstrapping: boolean;
  signIn: (email: string, password: string, role?: AppRole) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: AppRole) => void;
};

const AuthContext = createContext(undefined as unknown as AuthState | undefined);

const STORAGE_KEY = 'society-mobile-session';

type AuthProviderProps = {
  children?: unknown;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null as UserProfile | null);
  const [isBootstrapping, setIsBootstrapping] = useState(true as boolean);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored: string | null) => {
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          setUser(parsed);
          setApiToken(parsed.token);
        }
      })
      .finally(() => setIsBootstrapping(false));
  }, []);

  const persist = async (nextUser: UserProfile | null) => {
    setUser(nextUser);
    if (nextUser) {
      setApiToken(nextUser.token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      setApiToken('');
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  };

  const value = useMemo(() => ({
    user,
    isBootstrapping,
    async signIn(email: string, password: string, role?: AppRole) {
      const response = await login({ email, password });
      await persist({
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: (role || response.user.role) as AppRole,
        societyId: response.user.society_id || null,
        flatId: response.user.flat_id || null,
        token: response.token,
      });
    },
    async signOut() {
      await persist(null);
    },
    setRole(role: AppRole) {
      if (user) {
        setUser({ ...user, role });
      }
    },
  }) as AuthState, [isBootstrapping, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

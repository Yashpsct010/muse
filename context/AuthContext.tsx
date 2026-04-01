import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../constants/api';
import { User } from '../types/api';

type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }
      
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setToken(storedToken);
        setUser(data);
      } else {
        await SecureStore.deleteItemAsync('auth_token');
      }
    } catch (err) {
      console.error('Check auth failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (newToken: string, newUser: User) => {
    await SecureStore.setItemAsync('auth_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isAuthenticated: !!token, isLoading, 
      login, logout, checkAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

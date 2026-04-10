"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

interface User {
  _id: string;
  email: string;
  realName: string;
  phone?: string;
  anonymousNickname: string;
  showRealIdentity: boolean;
  hostelBlock: string | null;
  displayName: string;
  avatarUrl?: string;
  totalTrades: number;
  isRatingVisible: boolean;
  averageRating: number | null;
  tradesUntilRatingVisible: number;
  onboardingComplete: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, realName: string, phone: string) => Promise<void>;
  completeOnboarding: (showRealIdentity: boolean, hostelBlock: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored session
  useEffect(() => {
    const storedToken = localStorage.getItem("cm_token");
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const data = await api<{ user: User }>("/auth/me", { token: authToken });
      setUser(data.user);
      setToken(authToken);
    } catch {
      localStorage.removeItem("cm_token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    localStorage.setItem("cm_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, realName: string, phone: string) => {
    const data = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: { email, password, realName, phone },
    });
    localStorage.setItem("cm_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const completeOnboarding = useCallback(
    async (showRealIdentity: boolean, hostelBlock: string) => {
      if (!token) throw new Error("Not authenticated");
      const data = await api<{ user: User }>("/auth/onboarding", {
        method: "PUT",
        body: { showRealIdentity, hostelBlock },
        token,
      });
      setUser(data.user);
    },
    [token]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("cm_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, completeOnboarding, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

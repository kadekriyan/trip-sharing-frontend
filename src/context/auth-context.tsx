"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, type LoginPayload, type RegisterPayload } from "@/src/services/auth.service";
import { getAuthToken } from "@/src/lib/api-client";
import type { User } from "@/src/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  // Client-side session initialization on mount
  useEffect(() => {
    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      const initialToken = getAuthToken();

      if (initialToken) {
        setToken(initialToken);
        if (typeof window !== "undefined") {
          const saved = localStorage.getItem("auth_user");
          if (saved) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              // ignore
            }
          }
        }

        authService
          .getMe()
          .then((userData) => {
            if (isMounted && userData) {
              setUser(userData);
            }
          })
          .catch(() => {
            if (isMounted) {
              authService.logout();
              setUser(null);
              setToken(null);
            }
          })
          .finally(() => {
            if (isMounted) {
              setIsLoading(false);
              setIsHydrated(true);
            }
          });
      } else {
        setIsLoading(false);
        setIsHydrated(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.login(payload);
      setUser(res.user);
      setToken(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await authService.register(payload);
      setUser(res.user);
      setToken(res.token);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    router.push("/login");
  }, [router]);

  const isAuthenticated = Boolean(isHydrated && user && token);
  const isAdmin = Boolean(isHydrated && user && user.role === "admin");

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isHydrated,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

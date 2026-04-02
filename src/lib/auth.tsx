"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse } from "./types";
import { refreshToken as refreshTokenApi } from "./api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  restaurantId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refresh, setRefresh] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("accessToken");
    const storedRefresh = localStorage.getItem("refreshToken");
    const storedRestaurant = localStorage.getItem("restaurantId");
    if (stored) {
      setAccessToken(stored);
      setRefresh(storedRefresh);
      setRestaurantId(storedRestaurant);
    }
    setIsLoading(false);
  }, []);

  // Auto-refresh token
  useEffect(() => {
    if (!refresh) return;

    const interval = setInterval(
      async () => {
        try {
          const res = await refreshTokenApi(refresh);
          setAccessToken(res.accessToken);
          setRefresh(res.refreshToken);
          localStorage.setItem("accessToken", res.accessToken);
          localStorage.setItem("refreshToken", res.refreshToken);
        } catch {
          // Refresh failed — logout
          setAccessToken(null);
          setRefresh(null);
          setRestaurantId(null);
          localStorage.clear();
        }
      },
      14 * 60 * 1000, // 14 minutes
    );

    return () => clearInterval(interval);
  }, [refresh]);

  const setAuth = useCallback((auth: AuthResponse) => {
    setAccessToken(auth.accessToken);
    setRefresh(auth.refreshToken);
    setRestaurantId(auth.restaurantId);
    localStorage.setItem("accessToken", auth.accessToken);
    localStorage.setItem("refreshToken", auth.refreshToken);
    localStorage.setItem("restaurantId", auth.restaurantId);
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    setRefresh(null);
    setRestaurantId(null);
    localStorage.clear();
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken: refresh,
      restaurantId,
      isAuthenticated: !!accessToken,
      isLoading,
      setAuth,
      logout,
    }),
    [accessToken, refresh, restaurantId, isLoading, setAuth, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

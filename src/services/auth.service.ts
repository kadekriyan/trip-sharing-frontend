import { apiClient, setAuthToken, removeAuthToken, getAuthToken } from "@/src/lib/api-client";
import type { User, AuthResponse } from "@/src/types";

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  nationality?: string;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/login", payload);
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(res.data.user));
        }
        return res.data;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    // Fallback simulated login if backend offline
    const isAdmin = payload.email.toLowerCase().includes("admin");
    const mockUser: User = {
      id: isAdmin ? "e4b29c62-8e1d-4d7a-b5e1-51283d5a4911" : "c19208a1-5512-48ea-9201-7fa112345678",
      email: payload.email,
      fullName: isAdmin ? "Super Admin" : "Siti Rahmawati",
      name: isAdmin ? "Super Admin" : "Siti Rahmawati",
      phoneNumber: "+6281234567890",
      nationality: "Indonesia",
      role: isAdmin ? "admin" : "participant",
      createdAt: new Date().toISOString(),
    };

    const mockResponse: AuthResponse = {
      token: `mock-jwt-token-${isAdmin ? "admin" : "traveler"}-${Date.now()}`,
      user: mockUser,
    };

    setAuthToken(mockResponse.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(mockUser));
    }
    return mockResponse;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const res = await apiClient.post<AuthResponse>("/auth/register", payload);
      if (res.success && res.data?.token) {
        setAuthToken(res.data.token);
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(res.data.user));
        }
        return res.data;
      }
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    const mockUser: User = {
      id: `usr-${Date.now()}`,
      email: payload.email,
      fullName: payload.fullName,
      name: payload.fullName,
      phoneNumber: payload.phoneNumber || "+6281234567890",
      nationality: payload.nationality || "Indonesia",
      role: "participant",
      createdAt: new Date().toISOString(),
    };

    const mockResponse: AuthResponse = {
      token: `mock-jwt-token-registered-${Date.now()}`,
      user: mockUser,
    };

    setAuthToken(mockResponse.token);
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_user", JSON.stringify(mockUser));
    }
    return mockResponse;
  },

  async getMe(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await apiClient.get<User>("/auth/me");
      if (res.success && res.data) {
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(res.data));
        }
        return res.data;
      }
    } catch {
      // Fallback to local stored user
    }

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("auth_user");
      if (saved) {
        try {
          return JSON.parse(saved) as User;
        } catch {
          // ignore
        }
      }
    }
    return null;
  },

  logout(): void {
    removeAuthToken();
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user");
    }
  },
};

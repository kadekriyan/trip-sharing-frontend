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
    const res = await apiClient.post<AuthResponse>("/auth/login", payload);
    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      }
      return res.data;
    }
    throw new Error(res.message || "Gagal masuk ke akun. Periksa email dan kata sandi Anda.");
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/auth/register", payload);
    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_user", JSON.stringify(res.data.user));
      }
      return res.data;
    }
    throw new Error(res.message || "Gagal melakukan registrasi akun.");
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
      // Token expired or invalid
      this.logout();
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

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

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
    if (res.success) {
      return {
        success: true,
        message: res.message || res.data?.message || "Tautan pemulihan kata sandi telah dikirim ke email Anda.",
      };
    }
    throw new Error(res.message || "Gagal memproses permintaan lupa password.");
  },

  async verifyResetToken(token: string): Promise<{ valid: boolean; email?: string; name?: string }> {
    const res = await apiClient.get<{ valid: boolean; email?: string; name?: string }>(
      `/auth/reset-password/verify?token=${encodeURIComponent(token)}`
    );
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error(res.message || "Token reset kata sandi tidak valid atau telah kedaluwarsa.");
  },

  async resetPassword(token: string, password: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ message: string }>("/auth/reset-password", { token, password });
    if (res.success) {
      return {
        success: true,
        message: res.message || res.data?.message || "Kata sandi berhasil diperbarui. Silakan masuk kembali.",
      };
    }
    throw new Error(res.message || "Gagal mengatur ulang kata sandi.");
  },
};


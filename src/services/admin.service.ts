import { apiClient } from "@/src/lib/api-client";
import type {
  AdminMetrics,
  Participant,
  MoveParticipantPayload,
  Destination,
  Driver,
  Article,
  AuditLog,
} from "@/src/types";

export interface ManualParticipantPayload {
  destinationId: string;
  tripId: string;
  groupId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nationality: string;
  identityNumber: string;
  roomPreference?: "single" | "shared" | "none";
  amountPaid: number;
  paymentMethod: "manual_transfer" | "cash_onsite" | "qris" | "bank_transfer";
  notes?: string;
}

export const adminService = {
  async getMetrics(): Promise<AdminMetrics> {
    try {
      const res = await apiClient.get<AdminMetrics>("/admin/metrics");
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Default zero metrics
    }
    return {
      totalRevenue: 0,
      revenueGrowthPercentage: 0,
      activeTripsCount: 0,
      averageOccupancyRate: 0,
      totalParticipants: 0,
      totalBookings: 0,
      availableSeats: 0,
      pendingPaymentsCount: 0,
    };
  },

  async getParticipants(params?: {
    tripId?: string;
    groupId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/admin/participants", {
        params,
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty participants
    }
    return [];
  },

  async addParticipantManual(
    payload: ManualParticipantPayload
  ): Promise<{ participant: Participant; message: string }> {
    const res = await apiClient.post<{ participant: Participant; message: string }>(
      "/admin/participants/manual",
      payload
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal menambahkan peserta manual");
    }
    return res.data;
  },

  async moveParticipant(payload: MoveParticipantPayload): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      "/admin/participants/move-group",
      payload
    );
    if (!res.success) {
      throw new Error(res.message || "Gagal memindahkan peserta ke grup lain");
    }
    return res.data;
  },

  async getDestinations(): Promise<Destination[]> {
    try {
      const res = await apiClient.get<Destination[]>("/admin/destinations");
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async addDestination(payload: Partial<Destination>): Promise<Destination> {
    const res = await apiClient.post<Destination>("/admin/destinations", payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal membuat destinasi baru");
    }
    return res.data;
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await apiClient.get<Driver[]>("/admin/drivers");
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async addDriver(payload: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.post<Driver>("/admin/drivers", payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal menambahkan driver baru");
    }
    return res.data;
  },

  async getArticles(): Promise<Article[]> {
    try {
      const res = await apiClient.get<Article[]>("/admin/blogs");
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async addArticle(payload: Partial<Article>): Promise<Article> {
    const res = await apiClient.post<Article>("/admin/blogs", payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal menerbitkan artikel blog baru");
    }
    return res.data;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const res = await apiClient.get<AuditLog[]>("/admin/audit-logs");
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },
};

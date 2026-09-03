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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Check if any destination has pricing
        const hasPricing = res.data.some((d) => {
          const anyD = d as unknown as Record<string, unknown>;
          return (
            d.pricePerPax ||
            anyD.price ||
            anyD.basePrice ||
            (Array.isArray(anyD.trips) && anyD.trips.length > 0) ||
            (Array.isArray(anyD.activeTrips) && anyD.activeTrips.length > 0)
          );
        });

        if (hasPricing) {
          return res.data;
        }

        // If admin raw query lacks calculated price, merge with public catalog
        try {
          const pubRes = await apiClient.get<Destination[]>("/destinations");
          if (pubRes.success && Array.isArray(pubRes.data) && pubRes.data.length > 0) {
            const pubMap = new Map(pubRes.data.map((p) => [p.id, p]));
            return res.data.map((d) => {
              const pub = pubMap.get(d.id) || pubRes.data.find((p) => p.slug === d.slug);
              return {
                ...pub,
                ...d,
                pricePerPax:
                  d.pricePerPax ||
                  (pub && (pub.pricePerPax || (pub as unknown as Record<string, unknown>).price)) ||
                  (d as unknown as Record<string, unknown>).price ||
                  0,
                rating: d.rating || pub?.rating || 4.9,
              } as Destination;
            });
          }
        } catch {
          // Fallback to raw admin response
        }
        return res.data;
      }
    } catch {
      // Admin endpoint error fallback
    }

    try {
      const pubRes = await apiClient.get<Destination[]>("/destinations");
      if (pubRes.success && Array.isArray(pubRes.data)) {
        return pubRes.data;
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

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

  async getDestinationById(id: string): Promise<Destination | null> {
    try {
      const res = await apiClient.get<Destination>(`/admin/destinations/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback to public endpoint by id or slug
    }

    try {
      const pubRes = await apiClient.get<Destination>(`/destinations/${id}`);
      if (pubRes.success && pubRes.data) {
        return pubRes.data;
      }
    } catch {
      // Not found
    }
    return null;
  },

  async updateDestination(id: string, payload: Partial<Destination>): Promise<Destination> {
    const res = await apiClient.patch<Destination>(`/admin/destinations/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal memperbarui data destinasi");
    }
    return res.data;
  },

  async deleteDestination(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/destinations/${id}`);
    if (!res.success) {
      throw new Error(res.message || "Gagal menghapus destinasi");
    }
    return {
      success: true,
      message: res.message || "Destinasi berhasil dihapus",
    };
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

  async getDriverById(id: string): Promise<Driver | null> {
    try {
      const res = await apiClient.get<Driver>(`/admin/drivers/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Driver not found or error
    }
    return null;
  },

  async updateDriver(id: string, payload: Partial<Driver>): Promise<Driver> {
    const res = await apiClient.patch<Driver>(`/admin/drivers/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal memperbarui data driver");
    }
    return res.data;
  },

  async deleteDriver(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/drivers/${id}`);
    if (!res.success) {
      throw new Error(res.message || "Gagal menghapus driver");
    }
    return {
      success: true,
      message: res.message || "Driver berhasil dihapus",
    };
  },

  async getArticles(): Promise<Article[]> {
    try {
      const res = await apiClient.get<Article[]>("/admin/blogs");
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Try /admin/articles
    }

    try {
      const altRes = await apiClient.get<Article[]>("/admin/articles");
      if (altRes.success && Array.isArray(altRes.data)) {
        return altRes.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await apiClient.get<Article>(`/admin/blogs/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Try /admin/articles/:id
    }

    try {
      const altRes = await apiClient.get<Article>(`/admin/articles/${id}`);
      if (altRes.success && altRes.data) {
        return altRes.data;
      }
    } catch {
      // Fallback to public endpoint
    }

    try {
      const pubRes = await apiClient.get<Article>(`/blogs/${id}`);
      if (pubRes.success && pubRes.data) {
        return pubRes.data;
      }
    } catch {
      // Not found
    }
    return null;
  },

  async addArticle(payload: Partial<Article>): Promise<Article> {
    try {
      const res = await apiClient.post<Article>("/admin/blogs", payload);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback to /admin/articles
    }

    const altRes = await apiClient.post<Article>("/admin/articles", payload);
    if (!altRes.success || !altRes.data) {
      throw new Error(altRes.message || "Gagal menerbitkan artikel blog baru");
    }
    return altRes.data;
  },

  async updateArticle(id: string, payload: Partial<Article>): Promise<Article> {
    try {
      const res = await apiClient.patch<Article>(`/admin/blogs/${id}`, payload);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback to /admin/articles/:id
    }

    const altRes = await apiClient.patch<Article>(`/admin/articles/${id}`, payload);
    if (!altRes.success || !altRes.data) {
      throw new Error(altRes.message || "Gagal memperbarui artikel blog");
    }
    return altRes.data;
  },

  async toggleArticleStatus(id: string, currentActive: boolean): Promise<Article> {
    const nextState = !currentActive;
    return this.updateArticle(id, {
      isActive: nextState,
      isPublished: nextState,
    });
  },

  async deleteArticle(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/blogs/${id}`);
      if (res.success) {
        return {
          success: true,
          message: res.message || "Artikel berhasil dihapus",
        };
      }
    } catch {
      // Fallback to /admin/articles/:id
    }

    const altRes = await apiClient.delete<{ success: boolean; message: string }>(`/admin/articles/${id}`);
    if (!altRes.success) {
      throw new Error(altRes.message || "Gagal menghapus artikel");
    }
    return {
      success: true,
      message: altRes.message || "Artikel berhasil dihapus",
    };
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

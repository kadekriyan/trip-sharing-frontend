import { apiClient } from "@/src/lib/api-client";
import type {
  AdminMetrics,
  Participant,
  Driver,
  Destination,
  Article,
  AuditLog,
  MoveParticipantPayload,
} from "@/src/types";
import {
  MOCK_ADMIN_METRICS,
  MOCK_PARTICIPANTS,
  MOCK_DRIVERS,
  MOCK_DESTINATIONS,
  MOCK_ARTICLES,
  MOCK_AUDIT_LOGS,
} from "./mockData";

export const adminService = {
  async getMetrics(): Promise<AdminMetrics> {
    try {
      const res = await apiClient.get<AdminMetrics>("/admin/metrics");
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_ADMIN_METRICS;
  },

  async getParticipants(params?: { status?: string; search?: string; tripId?: string }): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/admin/participants", {
        params: {
          status: params?.status,
          search: params?.search,
          tripId: params?.tripId,
        },
      });
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_PARTICIPANTS;
  },

  async addParticipantManual(participant: Partial<Participant>): Promise<Participant> {
    try {
      const res = await apiClient.post<Participant>("/admin/participants/manual", {
        tripId: participant.tripId,
        bookingGroupId: participant.bookingGroupId,
        fullName: participant.fullName,
        email: participant.email,
        phoneNumber: participant.phoneNumber,
        nationality: participant.nationality || "Indonesia",
        identityNumber: participant.identityNumber,
        gender: participant.gender || "male",
        roomPreference: participant.roomPreference || "shared",
        hasInsurance: Boolean(participant.hasInsurance),
        insuranceFee: participant.insuranceFee || 50000,
        totalAmount: participant.totalAmount || 900000,
        paymentStatus: participant.paymentStatus || "paid",
        healthNotes: participant.healthNotes || "",
      });
      if (res.success && res.data) return res.data;
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    // Fallback simulation
    const newP: Participant = {
      id: `part-manual-${Date.now()}`,
      tripId: participant.tripId || "trip-01",
      bookingGroupId: participant.bookingGroupId || "grp-01",
      fullName: participant.fullName || "Peserta Baru",
      email: participant.email || "user@example.com",
      phoneNumber: participant.phoneNumber || "+62 812-0000-0000",
      nationality: participant.nationality || "Indonesia",
      identityNumber: participant.identityNumber || "3171000000000001",
      gender: participant.gender || "male",
      roomPreference: participant.roomPreference || "shared",
      hasInsurance: participant.hasInsurance ?? true,
      insuranceFee: 50000,
      totalAmount: 900000,
      paymentStatus: participant.paymentStatus || "paid",
      checkInStatus: "pending",
      bookingCode: `TRV-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PARTICIPANTS.unshift(newP);
    return newP;
  },

  async moveParticipant(payload: MoveParticipantPayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        "/admin/participants/move-group",
        payload
      );
      if (res.success) return res.data || { success: true, message: res.message || "Peserta berhasil dipindahkan." };
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    const p = MOCK_PARTICIPANTS.find((item) => item.id === payload.participantId);
    if (p) {
      p.bookingGroupId = payload.targetGroupId;
      p.updatedAt = new Date().toISOString();
      return { success: true, message: "Peserta berhasil dipindahkan ke grup tujuan." };
    }
    return { success: false, message: "Peserta tidak ditemukan." };
  },

  async getDrivers(): Promise<Driver[]> {
    try {
      const res = await apiClient.get<Driver[]>("/admin/drivers");
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_DRIVERS;
  },

  async addDriver(driver: Partial<Driver>): Promise<Driver> {
    try {
      const res = await apiClient.post<Driver>("/admin/drivers", {
        fullName: driver.fullName,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        vehicleModel: driver.vehicleModel,
        plateNumber: driver.plateNumber,
        passengerCapacity: driver.passengerCapacity || 6,
        status: driver.status || "available",
        photoUrl: driver.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      });
      if (res.success && res.data) return res.data;
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      fullName: driver.fullName || "Driver Baru",
      phoneNumber: driver.phoneNumber || "+62 812-3344-5566",
      licenseNumber: driver.licenseNumber || "SIM-A-000",
      vehicleModel: driver.vehicleModel || "Toyota HiAce (6-Seater VIP)",
      plateNumber: driver.plateNumber || "N 1234 XY",
      passengerCapacity: 6,
      status: "available",
      rating: 5.0,
      totalTrips: 0,
      photoUrl: driver.photoUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_DRIVERS.unshift(newDriver);
    return newDriver;
  },

  async getDestinations(): Promise<Destination[]> {
    try {
      const res = await apiClient.get<Destination[]>("/admin/destinations");
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_DESTINATIONS;
  },

  async addDestination(destination: Partial<Destination>): Promise<Destination> {
    try {
      const res = await apiClient.post<Destination>("/admin/destinations", destination);
      if (res.success && res.data) return res.data;
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    const newDest: Destination = {
      id: `dest-${Date.now()}`,
      title: destination.title || "Destinasi Baru",
      slug: destination.slug || (destination.title || "destinasi").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      tagline: destination.tagline || "",
      description: destination.description || "",
      location: destination.location || "Indonesia",
      durationDays: destination.durationDays || 2,
      durationNights: destination.durationNights || 1,
      pricePerPax: destination.pricePerPax || 850000,
      coverImage: destination.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      galleryImages: destination.galleryImages || [],
      inclusions: destination.inclusions || ["Armada AC", "Tiket Masuk", "Driver Guide"],
      exclusions: destination.exclusions || ["Pengeluaran Pribadi"],
      highlights: destination.highlights || ["Wisata Terbaik"],
      itinerary: destination.itinerary || [],
      rating: 5.0,
      totalReviews: 0,
      meetingPoint: destination.meetingPoint || "Meeting Point Utama",
      maxGroupCapacity: 6,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_DESTINATIONS.unshift(newDest);
    return newDest;
  },

  async getArticles(): Promise<Article[]> {
    try {
      const res = await apiClient.get<Article[]>("/admin/blogs");
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_ARTICLES;
  },

  async addArticle(article: Partial<Article>): Promise<Article> {
    try {
      const res = await apiClient.post<Article>("/admin/blogs", article);
      if (res.success && res.data) return res.data;
    } catch (err) {
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    const newArt: Article = {
      id: `art-${Date.now()}`,
      title: article.title || "Artikel Baru",
      slug: article.slug || (article.title || "artikel").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      excerpt: article.excerpt || "",
      content: article.content || "",
      coverImage: article.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
      category: article.category || "Travel Tips",
      author: article.author || {
        name: "Admin Editorial",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
        role: "Editor",
      },
      readTimeMinutes: article.readTimeMinutes || 4,
      publishedAt: new Date().toISOString(),
      views: 0,
      tags: article.tags || ["Trip Sharing"],
    };
    MOCK_ARTICLES.unshift(newArt);
    return newArt;
  },

  async getAuditLogs(params?: { page?: number; limit?: number }): Promise<AuditLog[]> {
    try {
      const res = await apiClient.get<AuditLog[]>("/admin/audit-logs", {
        params: {
          page: params?.page,
          limit: params?.limit,
        },
      });
      if (res.success && Array.isArray(res.data)) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_AUDIT_LOGS;
  },
};

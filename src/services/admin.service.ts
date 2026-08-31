import { apiClient } from "@/src/lib/api-client";
import type { AdminMetrics, Participant, Driver, Destination, Article, MoveParticipantPayload } from "@/src/types";
import { MOCK_ADMIN_METRICS, MOCK_PARTICIPANTS, MOCK_DRIVERS, MOCK_DESTINATIONS, MOCK_ARTICLES } from "./mockData";

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

  async getParticipants(): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/admin/participants");
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_PARTICIPANTS;
  },

  async addParticipantManual(participant: Partial<Participant>): Promise<Participant> {
    try {
      const res = await apiClient.post<Participant>("/admin/participants", participant);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const newP: Participant = {
      id: `part-${Date.now()}`,
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
      bookingCode: `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_PARTICIPANTS.unshift(newP);
    return newP;
  },

  async moveParticipant(payload: MoveParticipantPayload): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>(
        `/admin/participants/${payload.participantId}/move`,
        payload
      );
      if (res.success) return res.data;
    } catch {
      // Fallback
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
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_DRIVERS;
  },

  async addDriver(driver: Partial<Driver>): Promise<Driver> {
    try {
      const res = await apiClient.post<Driver>("/admin/drivers", driver);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const newDrv: Driver = {
      id: `drv-${Date.now()}`,
      fullName: driver.fullName || "Driver Baru",
      phoneNumber: driver.phoneNumber || "+62 812-0000-0000",
      licenseNumber: driver.licenseNumber || "SIM-B1-000000",
      vehicleModel: driver.vehicleModel || "Toyota HiAce 6-Seater",
      plateNumber: driver.plateNumber || "B 0000 XXX",
      passengerCapacity: 6,
      status: "available",
      rating: 5.0,
      totalTrips: 0,
      photoUrl: driver.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
      notes: driver.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_DRIVERS.unshift(newDrv);
    return newDrv;
  },

  async addDestination(destination: Partial<Destination>): Promise<Destination> {
    try {
      const res = await apiClient.post<Destination>("/admin/destinations", destination);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const newDest: Destination = {
      id: `dest-${Date.now()}`,
      title: destination.title || "Destinasi Baru",
      slug: (destination.title || "destinasi-baru").toLowerCase().replace(/\s+/g, "-"),
      tagline: destination.tagline || "Petualangan seru bersama teman baru",
      description: destination.description || "Deskripsi destinasi",
      location: destination.location || "Indonesia",
      durationDays: destination.durationDays || 2,
      durationNights: destination.durationNights || 1,
      pricePerPax: destination.pricePerPax || 1000000,
      coverImage: destination.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
      galleryImages: destination.galleryImages || [],
      inclusions: destination.inclusions || ["Transport", "Tiket Wisata"],
      exclusions: destination.exclusions || ["Pengeluaran Pribadi"],
      highlights: destination.highlights || ["Spot Foto"],
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
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_ARTICLES;
  },

  async addArticle(article: Partial<Article>): Promise<Article> {
    try {
      const res = await apiClient.post<Article>("/admin/blogs", article);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const newArt: Article = {
      id: `art-${Date.now()}`,
      title: article.title || "Artikel Baru",
      slug: (article.title || "artikel-baru").toLowerCase().replace(/\s+/g, "-"),
      excerpt: article.excerpt || "Ringkasan artikel",
      content: article.content || "Konten artikel...",
      coverImage: article.coverImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800",
      category: article.category || "Travel Tips",
      author: {
        name: "Admin Trip Sharing",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200",
        role: "Editorial Team",
      },
      readTimeMinutes: 3,
      publishedAt: new Date().toISOString(),
      views: 0,
      tags: article.tags || ["Trip Sharing", "Travel"],
    };
    MOCK_ARTICLES.unshift(newArt);
    return newArt;
  },
};

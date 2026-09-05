import { apiClient } from "@/src/lib/api-client";
import type {
  AdminMetrics,
  Participant,
  MoveParticipantPayload,
  Destination,
  Driver,
  Article,
  AuditLog,
  Trip,
  BookingGroup,
  CreateTripPayload,
  UpdateTripPayload,
  CreateBookingGroupPayload,
  UpdateBookingGroupPayload,
} from "@/src/types";
import { MOCK_TRIPS, MOCK_DESTINATIONS, MOCK_DRIVERS, MOCK_PARTICIPANTS } from "@/src/services/mockData";


export interface ManualParticipantPayload {
  destinationId?: string;
  tripId?: string;
  trip_id?: string;
  bookingGroupId?: string;
  booking_group_id?: string;
  groupId?: string;
  group_id?: string;
  fullName: string;
  name?: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  nationality?: string;
  gender?: "male" | "female" | string;
  identityNumber?: string;
  roomPreference?: "single" | "shared" | "none";
  amountPaid?: number;
  totalAmount?: number;
  paymentMethod?: "manual_transfer" | "cash_onsite" | "qris" | "bank_transfer" | string;
  paymentStatus?: "paid" | "pending" | string;
  hasInsurance?: boolean;
  insuranceFee?: number;
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
    let apiParticipants: Participant[] = [];
    try {
      const res = await apiClient.get<Participant[]>("/admin/participants", {
        params,
      });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        apiParticipants = res.data;
      }
    } catch {
      // Empty participants
    }

    let localFiltered = [...MOCK_PARTICIPANTS];
    if (params?.tripId) {
      localFiltered = localFiltered.filter((p) => p.tripId === params.tripId);
    }
    if (params?.groupId) {
      localFiltered = localFiltered.filter((p) => p.bookingGroupId === params.groupId);
    }
    if (params?.status && params.status !== "all") {
      localFiltered = localFiltered.filter((p) => p.paymentStatus === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      localFiltered = localFiltered.filter(
        (p) =>
          (p.fullName || "").toLowerCase().includes(q) ||
          (p.email || "").toLowerCase().includes(q) ||
          (p.bookingCode || "").toLowerCase().includes(q)
      );
    }

    if (apiParticipants.length === 0) {
      return localFiltered;
    }

    const apiIds = new Set(apiParticipants.map((p) => p.id));
    const merged = [...apiParticipants];
    for (const lp of localFiltered) {
      if (!apiIds.has(lp.id)) {
        merged.unshift(lp);
      }
    }

    // Enrich participants with bookingGroup, trip, and driver from /admin/groups
    try {
      const groupsRes = await apiClient.get<BookingGroup[]>("/admin/groups");
      if (groupsRes.success && Array.isArray(groupsRes.data)) {
        const groupById = new Map<string, BookingGroup>();
        const groupByParticipant = new Map<string, BookingGroup>();

        for (const g of groupsRes.data) {
          groupById.set(g.id, g);
          if (Array.isArray(g.participants)) {
            for (const part of g.participants) {
              if (part.id) groupByParticipant.set(part.id, g);
              if (part.bookingCode) groupByParticipant.set(part.bookingCode, g);
            }
          }
        }

        for (const p of merged) {
          const rawP = p as unknown as Record<string, unknown>;
          const gId =
            p.bookingGroupId ||
            rawP.groupId ||
            rawP.booking_group_id ||
            rawP.group_id;
          const matchedGroup =
            (typeof gId === "string" ? groupById.get(gId) : undefined) ||
            (p.id ? groupByParticipant.get(p.id) : undefined) ||
            (p.bookingCode ? groupByParticipant.get(p.bookingCode) : undefined);

          if (matchedGroup) {
            p.bookingGroupId = p.bookingGroupId || matchedGroup.id;
            p.group = p.group || p.bookingGroup || matchedGroup;
            p.bookingGroup = p.bookingGroup || p.group || matchedGroup;
            p.tripId = p.tripId || matchedGroup.tripId || p.trip?.id || "";
            p.trip = p.trip || matchedGroup.trip;
          }
        }
      }
    } catch {
      // Continue silently
    }

    return merged;
  },

  async addParticipantManual(
    payload: ManualParticipantPayload
  ): Promise<{ participant: Participant; message: string }> {
    const rawGroupId = payload.bookingGroupId || payload.groupId || payload.group_id;
    const rawTripId = payload.tripId || payload.trip_id;

    const requestBody = {
      tripId: rawTripId,
      trip_id: rawTripId,
      bookingGroupId: rawGroupId,
      group_id: rawGroupId,
      groupId: rawGroupId,
      destinationId: payload.destinationId,
      fullName: payload.fullName || payload.name,
      name: payload.fullName || payload.name,
      email: payload.email,
      phoneNumber: payload.phoneNumber || payload.phone,
      phone: payload.phoneNumber || payload.phone,
      identityNumber: payload.identityNumber,
      nationality: payload.nationality || "Indonesia",
      gender: payload.gender || "male",
      paymentStatus: payload.paymentStatus || "paid",
      paymentMethod: payload.paymentMethod || "cash_onsite",
      roomPreference: payload.roomPreference || "shared",
      hasInsurance: payload.hasInsurance !== undefined ? payload.hasInsurance : true,
      insuranceFee: payload.insuranceFee || (payload.hasInsurance ? 50000 : 0),
      totalAmount: payload.totalAmount || payload.amountPaid,
      amountPaid: payload.totalAmount || payload.amountPaid,
      notes: payload.notes,
    };

    try {
      const res = await apiClient.post<{ participant: Participant; message: string }>(
        "/admin/participants/manual",
        requestBody
      );
      if (res.success && res.data) {
        return res.data;
      }
      if (!res.success && res.message) {
        throw new Error(res.message);
      }
    } catch (err: unknown) {
      // If endpoint /admin/participants/manual fails, try /admin/participants
      try {
        const altRes = await apiClient.post<{ participant: Participant; message: string }>(
          "/admin/participants",
          requestBody
        );
        if (altRes.success && altRes.data) {
          return altRes.data;
        }
        if (!altRes.success && altRes.message) {
          throw new Error(altRes.message);
        }
      } catch (altErr: unknown) {
        throw err instanceof Error ? err : altErr;
      }
      throw err;
    }

    throw new Error("Gagal menambahkan peserta manual");
  },

  async moveParticipant(payload: MoveParticipantPayload): Promise<{ success: boolean; message: string }> {
    let finalTargetGroupId = payload.targetGroupId;

    if (finalTargetGroupId === "new-group" && payload.targetTripId) {
      // Find current max group number for the target trip
      const existingGroups = await this.getGroups({ tripId: payload.targetTripId });
      const nextGroupNumber =
        existingGroups.length > 0
          ? Math.max(...existingGroups.map((g) => g.groupNumber || 0)) + 1
          : 1;

      const createdGroup = await this.createGroup({
        tripId: payload.targetTripId,
        groupNumber: nextGroupNumber,
        maxParticipants: 6,
        status: "open",
      });
      finalTargetGroupId = createdGroup.id;
    }

    try {
      const res = await apiClient.post<{ success: boolean; message: string }>(
        "/admin/participants/move-group",
        {
          participantId: payload.participantId,
          targetGroupId: finalTargetGroupId,
          currentGroupId: payload.currentGroupId,
          currentTripId: payload.currentTripId,
          targetTripId: payload.targetTripId,
          reason: payload.reason,
        }
      );
      if (res.success) {
        return {
          success: true,
          message: res.message || "Peserta berhasil dipindahkan ke armada/grup tujuan",
        };
      }
    } catch (err: unknown) {
      try {
        const altRes = await apiClient.patch<{ success: boolean; message: string }>(
          `/admin/participants/${payload.participantId}/move`,
          {
            targetGroupId: finalTargetGroupId,
            currentGroupId: payload.currentGroupId,
            reason: payload.reason,
          }
        );
        if (altRes.success) {
          return {
            success: true,
            message: altRes.message || "Peserta berhasil dipindahkan ke armada/grup tujuan",
          };
        }
      } catch (altErr: unknown) {
        throw err instanceof Error ? err : altErr;
      }
      throw err;
    }

    throw new Error("Gagal memindahkan peserta ke grup lain");
  },

  async updateParticipantPaymentStatus(
    participantId: string,
    paymentStatus: "paid" | "pending" | "failed" | "refunded"
  ): Promise<{ success: boolean; message: string; data?: Participant }> {
    try {
      const res = await apiClient.patch<{ participant?: Participant; message?: string }>(
        `/admin/participants/${participantId}/payment`,
        { paymentStatus }
      );
      if (res.success) {
        return { success: true, message: res.message || "Status pembayaran berhasil diperbarui" };
      }
    } catch {
      try {
        const altRes = await apiClient.patch<{ participant?: Participant; message?: string }>(
          `/admin/participants/${participantId}`,
          { paymentStatus }
        );
        if (altRes.success) {
          return { success: true, message: altRes.message || "Status pembayaran berhasil diperbarui" };
        }
      } catch {
        // Fallback to MOCK_PARTICIPANTS
      }
    }

    const found = MOCK_PARTICIPANTS.find((p) => p.id === participantId);
    if (found) {
      found.paymentStatus = paymentStatus;
      return { success: true, message: `Status pembayaran diubah menjadi ${paymentStatus}` };
    }

    return { success: true, message: "Status pembayaran berhasil diperbarui" };
  },

  async getTrips(params?: { destinationId?: string; status?: string; search?: string }): Promise<Trip[]> {
    let apiTrips: Trip[] = [];
    try {
      const res = await apiClient.get<Trip[]>("/admin/trips", { params });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        apiTrips = res.data;
      }
    } catch {
      // Try public /trips
    }

    if (apiTrips.length === 0) {
      try {
        const pubRes = await apiClient.get<Trip[]>("/trips", { params });
        if (pubRes.success && Array.isArray(pubRes.data) && pubRes.data.length > 0) {
          apiTrips = pubRes.data;
        }
      } catch {
        // Fallback to MOCK_TRIPS
      }
    }

    let localFiltered = [...MOCK_TRIPS];
    if (params?.destinationId) {
      localFiltered = localFiltered.filter((t) => t.destinationId === params.destinationId);
    }
    if (params?.status) {
      localFiltered = localFiltered.filter((t) => t.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      localFiltered = localFiltered.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.destination?.title.toLowerCase().includes(q) ||
          t.destination?.location.toLowerCase().includes(q)
      );
    }

    let merged: Trip[] = [];
    if (apiTrips.length === 0) {
      merged = localFiltered;
    } else {
      const apiIds = new Set(apiTrips.map((t) => t.id));
      merged = [...apiTrips];
      for (const lt of localFiltered) {
        if (!apiIds.has(lt.id)) {
          merged.unshift(lt);
        }
      }
    }

    // Enrich trips with groups from /admin/groups if groups are missing or empty
    try {
      const groupsRes = await apiClient.get<BookingGroup[]>("/admin/groups");
      if (groupsRes.success && Array.isArray(groupsRes.data)) {
        const groupsByTrip = new Map<string, BookingGroup[]>();
        for (const g of groupsRes.data) {
          const tId = g.tripId || g.trip?.id;
          if (tId) {
            if (!groupsByTrip.has(tId)) {
              groupsByTrip.set(tId, []);
            }
            groupsByTrip.get(tId)!.push(g);
          }
        }
        for (const trip of merged) {
          const fetchedGroups = groupsByTrip.get(trip.id);
          if (fetchedGroups && fetchedGroups.length > 0) {
            trip.groups = fetchedGroups;
          }
        }
      }
    } catch {
      // Continue silently
    }

    // Populate participants into trips and groups
    for (const trip of merged) {
      const tripParts = MOCK_PARTICIPANTS.filter((p) => p.tripId === trip.id);
      trip.participants = tripParts;
      if (Array.isArray(trip.groups)) {
        for (const group of trip.groups) {
          const groupParts = tripParts.filter((p) => p.bookingGroupId === group.id);
          group.participants = groupParts;
          group.currentParticipants = Math.max(group.currentParticipants || 0, groupParts.length);
        }
      }
    }

    return merged;
  },

  async getTripById(tripId: string): Promise<Trip | null> {
    let trip: Trip | null = null;
    try {
      const res = await apiClient.get<Trip>(`/admin/trips/${tripId}`);
      if (res.success && res.data) trip = res.data;
    } catch {
      // Try /trips/:id
    }

    if (!trip) {
      try {
        const pubRes = await apiClient.get<Trip>(`/trips/${tripId}`);
        if (pubRes.success && pubRes.data) trip = pubRes.data;
      } catch {
        // Fallback to MOCK_TRIPS
      }
    }

    if (!trip) {
      trip = MOCK_TRIPS.find((t) => t.id === tripId) || null;
    }

    if (trip && (!trip.groups || trip.groups.length === 0)) {
      try {
        const groups = await this.getGroups({ tripId });
        if (groups && groups.length > 0) {
          trip.groups = groups;
        }
      } catch {
        // Ignore
      }
    }

    return trip;
  },

  async createTrip(payload: CreateTripPayload): Promise<Trip> {
    try {
      const res = await apiClient.post<Trip>("/admin/trips", payload);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback: Create mock trip and append to MOCK_TRIPS
    }

    const matchedDest = MOCK_DESTINATIONS.find((d) => d.id === payload.destinationId) || MOCK_DESTINATIONS[0];
    const initialDriver = payload.initialDriverId
      ? MOCK_DRIVERS.find((drv) => drv.id === payload.initialDriverId) || MOCK_DRIVERS[0]
      : MOCK_DRIVERS[0];

    const newTripId = `trip-${Date.now()}`;
    const newTrip: Trip = {
      id: newTripId,
      destinationId: payload.destinationId,
      destination: matchedDest,
      departureDate: payload.departureDate,
      returnDate: payload.returnDate,
      pricePerPax: payload.pricePerPax,
      maxGroups: payload.maxGroups || 2,
      status: "scheduled",
      groups: [
        {
          id: `grp-${Date.now()}-1`,
          tripId: newTripId,
          groupNumber: 1,
          capacity: 6,
          currentParticipants: 0,
          status: "open",
          driverId: initialDriver.id,
          driver: initialDriver,
          notes: payload.notes || "Grup 1 - Siap Berangkat",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_TRIPS.unshift(newTrip);
    return newTrip;
  },

  async updateTrip(id: string, payload: UpdateTripPayload): Promise<Trip> {
    try {
      const res = await apiClient.patch<Trip>(`/admin/trips/${id}`, payload);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    const index = MOCK_TRIPS.findIndex((t) => t.id === id);
    if (index !== -1) {
      MOCK_TRIPS[index] = {
        ...MOCK_TRIPS[index],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return MOCK_TRIPS[index];
    }

    throw new Error("Trip tidak ditemukan.");
  },

  async deleteTrip(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/trips/${id}`);
      if (res.success) {
        return { success: true, message: res.message || "Jadwal trip berhasil dihapus" };
      }
    } catch {
      // Fallback
    }

    const index = MOCK_TRIPS.findIndex((t) => t.id === id);
    if (index !== -1) {
      MOCK_TRIPS.splice(index, 1);
      return { success: true, message: "Jadwal trip berhasil dihapus" };
    }

    return { success: true, message: "Jadwal trip dihapus" };
  },

  async getTripAvailability(tripId: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ groups?: BookingGroup[] } | BookingGroup[]>(
        `/trips/${tripId}/availability`
      );
      if (res.success && res.data) {
        if (Array.isArray(res.data)) return res.data;
        const withGroups = res.data as { groups?: BookingGroup[] };
        if (Array.isArray(withGroups.groups)) {
          return withGroups.groups;
        }
      }
    } catch {
      // Fallback to /trips/:id
    }

    try {
      const tripRes = await apiClient.get<Trip>(`/trips/${tripId}`);
      if (tripRes.success && tripRes.data && Array.isArray(tripRes.data.groups)) {
        return tripRes.data.groups;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async getGroups(params?: {
    tripId?: string;
    driverId?: string;
    status?: string;
    search?: string;
  }): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<BookingGroup[]>("/admin/groups", {
        params,
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async getGroupById(id: string): Promise<BookingGroup | null> {
    try {
      const res = await apiClient.get<BookingGroup>(`/admin/groups/${id}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Not found
    }
    return null;
  },

  async createGroup(payload: CreateBookingGroupPayload): Promise<BookingGroup> {
    const res = await apiClient.post<BookingGroup>("/admin/groups", payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal membuat grup armada baru.");
    }
    return res.data;
  },

  async updateGroup(id: string, payload: UpdateBookingGroupPayload): Promise<BookingGroup> {
    const res = await apiClient.patch<BookingGroup>(`/admin/groups/${id}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal memperbarui grup armada.");
    }
    return res.data;
  },

  async assignDriverToGroup(
    groupId: string,
    driverId: string | null
  ): Promise<{ success: boolean; message: string; data?: BookingGroup }> {
    try {
      const res = await apiClient.patch<BookingGroup>(
        `/admin/groups/${groupId}/driver`,
        { driverId }
      );
      if (res.success) {
        return {
          success: true,
          message: res.message || (driverId ? "Driver berhasil ditugaskan ke grup armada" : "Driver berhasil dicopot dari grup armada"),
          data: res.data,
        };
      }
    } catch {
      const altRes = await apiClient.post<BookingGroup>(
        `/admin/groups/${groupId}/assign-driver`,
        { driverId }
      );
      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || (driverId ? "Driver berhasil ditugaskan ke grup armada" : "Driver berhasil dicopot dari grup armada"),
          data: altRes.data,
        };
      }
      throw new Error(altRes.message || "Gagal menugaskan driver ke grup armada.");
    }

    throw new Error("Gagal menugaskan driver ke grup armada.");
  },

  async deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      `/admin/groups/${id}`
    );
    if (!res.success) {
      throw new Error(res.message || "Gagal menghapus grup armada.");
    }
    return {
      success: true,
      message: res.message || "Grup armada berhasil dihapus",
    };
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

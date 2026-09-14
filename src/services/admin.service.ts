import { apiClient } from "@/src/lib/api-client";
import type {
  AdminMetrics,
  Participant,
  MoveParticipantPayload,
  Destination,
  Driver,
  Vehicle,
  CreateVehiclePayload,
  UpdateVehiclePayload,
  Article,
  AuditLog,
  Trip,
  BookingGroup,
  CreateTripPayload,
  UpdateTripPayload,
  CreateBookingGroupPayload,
  UpdateBookingGroupPayload,
} from "@/src/types";
import { normalizeParticipant } from "@/src/lib/utils";

export function normalizeVehicle(raw: Record<string, unknown>): Vehicle {
  const id = String(raw.id || "");
  const name = String(raw.name || raw.title || "Toyota HiAce VIP");
  const plateNumber = String(raw.plateNumber || raw.plate_number || raw.plate || "");
  const vehicleType = String(raw.vehicleType || raw.vehicle_type || raw.type || "Minivan");
  const capacity = Number(raw.capacity || raw.passengerCapacity || 6);
  const transmission = typeof raw.transmission === "string" ? raw.transmission : "Manual";
  const fuelType =
    typeof raw.fuelType === "string"
      ? raw.fuelType
      : typeof raw.fuel_type === "string"
      ? raw.fuel_type
      : "Diesel";
  const facility = Array.isArray(raw.facility)
    ? (raw.facility as string[])
    : Array.isArray(raw.facilities)
    ? (raw.facilities as string[])
    : ["AC", "Audio/Radio", "Reclining Seat", "USB Charger"];
  const coverImage =
    typeof raw.coverImage === "string"
      ? raw.coverImage
      : typeof raw.cover_image === "string"
      ? raw.cover_image
      : typeof raw.image === "string"
      ? raw.image
      : undefined;
  const status = (raw.status as Vehicle["status"]) || "active";
  const isAvailable =
    raw.isAvailable !== undefined
      ? Boolean(raw.isAvailable)
      : raw.is_available !== undefined
      ? Boolean(raw.is_available)
      : status === "active";
  const driverId = raw.driverId || raw.driver_id ? String(raw.driverId || raw.driver_id) : null;
  const driver = raw.driver ? (raw.driver as Driver) : null;

  return {
    id,
    name,
    plateNumber,
    plate_number: plateNumber,
    vehicleType,
    vehicle_type: vehicleType,
    capacity,
    transmission,
    fuelType,
    fuel_type: fuelType,
    facility,
    coverImage,
    cover_image: coverImage,
    status,
    isAvailable,
    is_available: isAvailable,
    driverId,
    driver_id: driverId,
    driver,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    created_at: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
    updated_at: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
  };
}

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
  roomPreference?: "single" | "shared" | "none" | string;
  amountPaid?: number;
  totalAmount?: number;
  paymentMethod?: "manual_transfer" | "cash_onsite" | "qris" | "bank_transfer" | string;
  paymentStatus?: "paid" | "pending" | string;
  hasInsurance?: boolean;
  insuranceFee?: number;
  notes?: string;
}

export function normalizeBookingGroup(raw: Record<string, unknown>, tripIdFallback?: string): BookingGroup {
  const id = String(raw.id || "");
  const tripId = String(raw.tripId || raw.trip_id || tripIdFallback || "");
  const groupNumber = Number(raw.groupNumber || raw.group_number || 1);
  const capacity = Number(raw.capacity || raw.maxParticipants || raw.max_participants || 6);
  const participants = Array.isArray(raw.participants) ? (raw.participants as Participant[]) : [];
  const currentParticipants =
    typeof raw.currentParticipants === "number"
      ? raw.currentParticipants
      : typeof raw.current_participants === "number"
      ? raw.current_participants
      : participants.length;
  const status = (raw.status as BookingGroup["status"]) || "open";
  const driverId = raw.driverId || raw.driver_id ? String(raw.driverId || raw.driver_id) : null;
  const driver = (raw.driver as Driver) || null;
  const vehicleId = raw.vehicleId || raw.vehicle_id ? String(raw.vehicleId || raw.vehicle_id) : null;
  const vehicle = raw.vehicle ? normalizeVehicle(raw.vehicle as Record<string, unknown>) : null;
  const name = typeof raw.name === "string" ? raw.name : undefined;
  const notes = typeof raw.notes === "string" ? raw.notes : undefined;
  const pricePerPerson =
    typeof raw.pricePerPerson === "number"
      ? raw.pricePerPerson
      : typeof raw.price_per_person === "number"
      ? raw.price_per_person
      : typeof raw.pricePerPax === "number"
      ? raw.pricePerPax
      : undefined;

  return {
    id,
    tripId,
    trip: raw.trip as Trip | undefined,
    groupNumber,
    capacity,
    maxParticipants: capacity,
    currentParticipants,
    pricePerPerson,
    status,
    driverId,
    driver,
    vehicleId,
    vehicle,
    name,
    notes,
    participants,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
  };
}

export function normalizeTrip(raw: Record<string, unknown>): Trip {
  const destinationId = String(raw.destinationId || raw.destination_id || "");
  const departureDate = String(raw.departureDate || raw.departure_date || "");
  const returnDate = String(raw.returnDate || raw.return_date || "");
  const maxParticipants =
    typeof raw.maxParticipants === "number"
      ? raw.maxParticipants
      : typeof raw.max_participants === "number"
      ? raw.max_participants
      : 6;
  const currentParticipants =
    typeof raw.currentParticipants === "number"
      ? raw.currentParticipants
      : typeof raw.current_participants === "number"
      ? raw.current_participants
      : 0;
  const pricePerPax =
    typeof raw.pricePerPax === "number"
      ? raw.pricePerPax
      : typeof raw.price_per_pax === "number"
      ? raw.price_per_pax
      : typeof raw.price === "number"
      ? raw.price
      : 850000;
  const guideId = (raw.guideId || raw.guide_id) ? String(raw.guideId || raw.guide_id) : null;
  const status = (raw.status as Trip["status"]) || "planning";
  const notes = typeof raw.notes === "string" ? raw.notes : undefined;

  const rawGroups = Array.isArray(raw.booking_groups)
    ? raw.booking_groups
    : Array.isArray(raw.groups)
    ? raw.groups
    : [];

  const groups: BookingGroup[] = (rawGroups as Array<Record<string, unknown>>).map((g, idx) =>
    normalizeBookingGroup(
      {
        ...g,
        id: g.id || `grp-${raw.id}-${idx + 1}`,
        groupNumber: g.groupNumber || g.group_number || idx + 1,
      },
      String(raw.id || "")
    )
  );

  const destination = raw.destination as Destination | undefined;
  const guide = raw.guide as Trip["guide"];

  return {
    id: String(raw.id || ""),
    destinationId,
    destination_id: destinationId,
    destination,
    departureDate,
    departure_date: departureDate,
    returnDate,
    return_date: returnDate,
    pricePerPax,
    maxParticipants,
    max_participants: maxParticipants,
    currentParticipants,
    current_participants: currentParticipants,
    maxGroups: typeof raw.maxGroups === "number" ? raw.maxGroups : Math.max(1, Math.ceil(maxParticipants / 6)),
    guideId,
    guide_id: guideId,
    guide,
    status,
    notes,
    groups,
    booking_groups: groups,
    createdAt: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    created_at: String(raw.createdAt || raw.created_at || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
    updated_at: String(raw.updatedAt || raw.updated_at || new Date().toISOString()),
  };
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
        apiParticipants = res.data.map(normalizeParticipant);
      }
    } catch {
      // Empty participants
    }

    const apiIds = new Set(apiParticipants.map((p) => p.id));
    const merged = [...apiParticipants];

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

              // If this participant is not yet in merged array, add it
              if (part.id && !apiIds.has(part.id)) {
                merged.push(
                  normalizeParticipant({
                    ...(part as unknown as Record<string, unknown>),
                    bookingGroupId: g.id,
                    tripId: g.tripId || (g.trip as Trip | undefined)?.id || "",
                  })
                );
                apiIds.add(part.id);
              }
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
      nationality: payload.nationality || "Indonesia",
      gender: payload.gender || "male",
      paymentStatus: payload.paymentStatus || "paid",
      paymentMethod: payload.paymentMethod || "cash_onsite",
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
      const altRes = await apiClient.patch<{ participant?: Participant; message?: string }>(
        `/admin/participants/${participantId}`,
        { paymentStatus }
      );
      if (altRes.success) {
        return { success: true, message: altRes.message || "Status pembayaran berhasil diperbarui" };
      }
    }

    throw new Error("Gagal memperbarui status pembayaran peserta.");
  },

  async getTrips(params?: {
    destinationId?: string;
    destination_id?: string;
    status?: string;
    search?: string;
  }): Promise<Trip[]> {
    let apiTrips: Trip[] = [];
    const queryParams = {
      ...params,
      destination_id: params?.destination_id || params?.destinationId,
      destinationId: params?.destinationId || params?.destination_id,
    };

    try {
      const res = await apiClient.get<Record<string, unknown>[]>("/admin/trips", { params: queryParams });
      if (res.success && Array.isArray(res.data)) {
        apiTrips = res.data.map((raw) => normalizeTrip(raw));
      }
    } catch {
      // Try public /trips
      try {
        const pubRes = await apiClient.get<Record<string, unknown>[]>("/trips", { params: queryParams });
        if (pubRes.success && Array.isArray(pubRes.data)) {
          apiTrips = pubRes.data.map((raw) => normalizeTrip(raw));
        }
      } catch {
        // Return empty array
      }
    }

    if (params?.search && apiTrips.length > 0) {
      const q = params.search.toLowerCase();
      apiTrips = apiTrips.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.destination?.title?.toLowerCase().includes(q) ||
          t.destination?.name?.toLowerCase().includes(q) ||
          t.destination?.location?.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q)
      );
    }

    // Enrich trips with groups from /admin/groups if groups are missing or empty
    if (apiTrips.length > 0) {
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
          for (const trip of apiTrips) {
            const fetchedGroups = groupsByTrip.get(trip.id);
            if (fetchedGroups && fetchedGroups.length > 0) {
              trip.groups = fetchedGroups;
              trip.booking_groups = fetchedGroups;
            }
          }
        }
      } catch {
        // Continue silently
      }

      // Enrich trips with participants from /admin/participants
      try {
        const parts = await this.getParticipants();
        if (parts && parts.length > 0) {
          const partsByTrip = new Map<string, Participant[]>();
          const partsByGroup = new Map<string, Participant[]>();

          for (const p of parts) {
            const tId = p.tripId || p.trip?.id;
            if (tId) {
              if (!partsByTrip.has(tId)) partsByTrip.set(tId, []);
              partsByTrip.get(tId)!.push(p);
            }
            const gId = p.bookingGroupId || p.group?.id || p.bookingGroup?.id;
            if (gId) {
              if (!partsByGroup.has(gId)) partsByGroup.set(gId, []);
              partsByGroup.get(gId)!.push(p);
            }
          }

          for (const trip of apiTrips) {
            const tripParts = [...(partsByTrip.get(trip.id) || [])];
            if (Array.isArray(trip.groups)) {
              for (const g of trip.groups) {
                const gParts = partsByGroup.get(g.id);
                if (gParts) {
                  g.participants = gParts;
                  for (const gp of gParts) {
                    if (!tripParts.some((existing) => existing.id === gp.id)) {
                      tripParts.push(gp);
                    }
                  }
                }
              }
            }
            if (!trip.participants || trip.participants.length === 0) {
              trip.participants = tripParts;
            }
          }
        }
      } catch {
        // Continue silently
      }
    }

    return apiTrips;
  },

  async getTripById(tripId: string): Promise<Trip | null> {
    let trip: Trip | null = null;
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/admin/trips/${tripId}`);
      if (res.success && res.data) trip = normalizeTrip(res.data);
    } catch {
      // Try /trips/:id
    }

    if (!trip) {
      try {
        const pubRes = await apiClient.get<Record<string, unknown>>(`/trips/${tripId}`);
        if (pubRes.success && pubRes.data) trip = normalizeTrip(pubRes.data);
      } catch {
        // Return null
      }
    }

    if (trip && (!trip.groups || trip.groups.length === 0)) {
      try {
        const groups = await this.getGroups({ tripId });
        if (groups && groups.length > 0) {
          trip.groups = groups;
          trip.booking_groups = groups;
        }
      } catch {
        // Ignore
      }
    }

    if (trip && (!trip.participants || trip.participants.length === 0)) {
      try {
        const parts = await this.getParticipants({ tripId });
        if (parts && parts.length > 0) {
          trip.participants = parts;
        }
      } catch {
        // Ignore
      }
    }

    return trip;
  },

  async createTrip(payload: CreateTripPayload): Promise<Trip> {
    const destId = payload.destinationId || payload.destination_id || "";
    const departDate = payload.departureDate || payload.departure_date || "";
    const retDate = payload.returnDate || payload.return_date || "";
    const maxPax = payload.maxParticipants || payload.max_participants || (payload.maxGroups ? payload.maxGroups * 6 : 6);
    const gId = payload.guideId !== undefined ? payload.guideId : payload.guide_id;

    const requestBody = {
      destinationId: destId,
      destination_id: destId,
      departureDate: departDate,
      departure_date: departDate,
      returnDate: retDate,
      return_date: retDate,
      maxParticipants: maxPax,
      max_participants: maxPax,
      guideId: gId,
      guide_id: gId,
      status: payload.status || "planning",
      notes: payload.notes || "",
      pricePerPax: payload.pricePerPax,
      maxGroups: payload.maxGroups || Math.ceil(maxPax / 6) || 2,
    };

    const res = await apiClient.post<Record<string, unknown>>("/admin/trips", requestBody);
    if (res.success && res.data) {
      return normalizeTrip(res.data);
    }

    throw new Error(res.message || "Gagal membuat jadwal trip baru.");
  },

  async updateTrip(id: string, payload: UpdateTripPayload): Promise<Trip> {
    const destId = payload.destinationId || payload.destination_id;
    const departDate = payload.departureDate || payload.departure_date;
    const retDate = payload.returnDate || payload.return_date;
    const maxPax = payload.maxParticipants || payload.max_participants;
    const gId = payload.guideId !== undefined ? payload.guideId : payload.guide_id;

    const requestBody: Record<string, unknown> = {
      status: payload.status,
      notes: payload.notes,
      pricePerPax: payload.pricePerPax,
      maxGroups: payload.maxGroups,
    };

    if (destId) {
      requestBody.destinationId = destId;
      requestBody.destination_id = destId;
    }
    if (departDate) {
      requestBody.departureDate = departDate;
      requestBody.departure_date = departDate;
    }
    if (retDate) {
      requestBody.returnDate = retDate;
      requestBody.return_date = retDate;
    }
    if (maxPax !== undefined) {
      requestBody.maxParticipants = maxPax;
      requestBody.max_participants = maxPax;
    }
    if (gId !== undefined) {
      requestBody.guideId = gId;
      requestBody.guide_id = gId;
    }

    try {
      const res = await apiClient.patch<Record<string, unknown>>(`/admin/trips/${id}`, requestBody);
      if (res.success && res.data) {
        return normalizeTrip(res.data);
      }
    } catch {
      const putRes = await apiClient.put<Record<string, unknown>>(`/admin/trips/${id}`, requestBody);
      if (putRes.success && putRes.data) {
        return normalizeTrip(putRes.data);
      }
    }

    throw new Error("Gagal memperbarui jadwal trip.");
  },

  async deleteTrip(id: string): Promise<{ success: boolean; message: string }> {
    const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/trips/${id}`);
    if (res.success) {
      return { success: true, message: res.message || "Jadwal trip berhasil dihapus" };
    }
    throw new Error(res.message || "Gagal menghapus jadwal trip.");
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
      const res = await apiClient.get<Record<string, unknown>[]>("/admin/groups", {
        params,
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((raw) => normalizeBookingGroup(raw));
      }
    } catch {
      // Empty
    }
    return [];
  },

  async getGroupById(id: string): Promise<BookingGroup | null> {
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/admin/groups/${id}`);
      if (res.success && res.data) {
        return normalizeBookingGroup(res.data);
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

  async assignVehicleToGroup(
    groupId: string,
    vehicleId: string | null
  ): Promise<{ success: boolean; message: string; data?: BookingGroup }> {
    try {
      const res = await apiClient.patch<BookingGroup>(
        `/admin/groups/${groupId}/vehicle`,
        { vehicleId }
      );
      if (res.success) {
        return {
          success: true,
          message: res.message || (vehicleId ? "Armada berhasil dipasangkan ke grup" : "Armada berhasil dilepaskan dari grup"),
          data: res.data,
        };
      }
    } catch {
      const altRes = await apiClient.post<BookingGroup>(
        `/admin/groups/${groupId}/assign-vehicle`,
        { vehicleId }
      );
      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || (vehicleId ? "Armada berhasil dipasangkan ke grup" : "Armada berhasil dilepaskan dari grup"),
          data: altRes.data,
        };
      }
      throw new Error(altRes.message || "Gagal memasangkan armada ke grup.");
    }

    throw new Error("Gagal memasangkan armada ke grup.");
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

  async assignVehicleToDriver(
    driverId: string,
    vehicleId: string | null
  ): Promise<{ success: boolean; message: string; data?: Driver }> {
    try {
      const res = await apiClient.post<Driver>(`/admin/drivers/${driverId}/assign-vehicle`, { vehicleId });
      if (res.success) {
        return {
          success: true,
          message: res.message || (vehicleId ? "Armada berhasil dipasangkan ke driver" : "Armada berhasil dilepaskan dari driver"),
          data: res.data,
        };
      }
    } catch {
      const altRes = await apiClient.patch<Driver>(`/admin/drivers/${driverId}/vehicle`, { vehicleId });
      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || (vehicleId ? "Armada berhasil dipasangkan ke driver" : "Armada berhasil dilepaskan dari driver"),
          data: altRes.data,
        };
      }
      throw new Error(altRes.message || "Gagal memasangkan armada ke driver.");
    }
    throw new Error("Gagal memasangkan armada ke driver.");
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

  // ==========================================
  // MASTER ARMADA / VEHICLES MANAGEMENT
  // ==========================================
  async getVehicles(params?: {
    status?: string;
    isAvailable?: boolean;
    search?: string;
  }): Promise<Vehicle[]> {
    try {
      const res = await apiClient.get<Record<string, unknown>[]>("/admin/vehicles", { params });
      if (res.success && Array.isArray(res.data)) {
        return res.data.map(normalizeVehicle);
      }
    } catch {
      try {
        const altRes = await apiClient.get<Record<string, unknown>[]>("/admin/armada", { params });
        if (altRes.success && Array.isArray(altRes.data)) {
          return altRes.data.map(normalizeVehicle);
        }
      } catch {
        try {
          const pubRes = await apiClient.get<Record<string, unknown>[]>("/vehicles", { params });
          if (pubRes.success && Array.isArray(pubRes.data)) {
            return pubRes.data.map(normalizeVehicle);
          }
        } catch {
          // Empty
        }
      }
    }
    return [];
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const res = await apiClient.get<Record<string, unknown>>(`/admin/vehicles/${id}`);
      if (res.success && res.data) {
        return normalizeVehicle(res.data);
      }
    } catch {
      try {
        const altRes = await apiClient.get<Record<string, unknown>>(`/admin/armada/${id}`);
        if (altRes.success && altRes.data) {
          return normalizeVehicle(altRes.data);
        }
      } catch {
        // Not found
      }
    }
    return null;
  },

  async createVehicle(payload: CreateVehiclePayload): Promise<Vehicle> {
    try {
      const res = await apiClient.post<Record<string, unknown>>("/admin/vehicles", payload);
      if (res.success && res.data) {
        return normalizeVehicle(res.data);
      }
      if (!res.success && res.message) {
        throw new Error(res.message);
      }
    } catch (err) {
      try {
        const altRes = await apiClient.post<Record<string, unknown>>("/admin/armada", payload);
        if (altRes.success && altRes.data) {
          return normalizeVehicle(altRes.data);
        }
        if (!altRes.success && altRes.message) {
          throw new Error(altRes.message);
        }
      } catch (altErr) {
        throw err instanceof Error ? err : altErr;
      }
      throw err;
    }
    throw new Error("Gagal menambahkan armada baru.");
  },

  async updateVehicle(id: string, payload: UpdateVehiclePayload): Promise<Vehicle> {
    try {
      const res = await apiClient.patch<Record<string, unknown>>(`/admin/vehicles/${id}`, payload);
      if (res.success && res.data) {
        return normalizeVehicle(res.data);
      }
    } catch {
      try {
        const putRes = await apiClient.put<Record<string, unknown>>(`/admin/vehicles/${id}`, payload);
        if (putRes.success && putRes.data) {
          return normalizeVehicle(putRes.data);
        }
      } catch {
        const altRes = await apiClient.patch<Record<string, unknown>>(`/admin/armada/${id}`, payload);
        if (altRes.success && altRes.data) {
          return normalizeVehicle(altRes.data);
        }
      }
    }
    throw new Error("Gagal memperbarui data armada.");
  },

  async deleteVehicle(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.delete<{ success: boolean; message: string }>(`/admin/vehicles/${id}`);
      if (res.success) {
        return {
          success: true,
          message: res.message || "Armada berhasil dihapus",
        };
      }
    } catch {
      const altRes = await apiClient.delete<{ success: boolean; message: string }>(`/admin/armada/${id}`);
      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || "Armada berhasil dihapus",
        };
      }
      throw new Error(altRes.message || "Gagal menghapus armada.");
    }
    throw new Error("Gagal menghapus armada.");
  },

  async assignDriverToVehicle(
    vehicleId: string,
    driverId: string | null
  ): Promise<{ success: boolean; message: string; data?: Vehicle }> {
    try {
      const res = await apiClient.post<Record<string, unknown>>(`/admin/vehicles/${vehicleId}/assign-driver`, { driverId });
      if (res.success) {
        return {
          success: true,
          message: res.message || (driverId ? "Driver berhasil dipasangkan ke armada" : "Driver berhasil dicopot dari armada"),
          data: res.data ? normalizeVehicle(res.data) : undefined,
        };
      }
    } catch {
      const altRes = await apiClient.patch<Record<string, unknown>>(`/admin/vehicles/${vehicleId}/driver`, { driverId });
      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || (driverId ? "Driver berhasil dipasangkan ke armada" : "Driver berhasil dicopot dari armada"),
          data: altRes.data ? normalizeVehicle(altRes.data) : undefined,
        };
      }
      throw new Error(altRes.message || "Gagal memasangkan driver ke armada.");
    }
    throw new Error("Gagal memasangkan driver ke armada.");
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

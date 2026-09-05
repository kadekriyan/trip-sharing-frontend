import { apiClient } from "@/src/lib/api-client";
import type {
  CreateBookingPayload,
  Participant,
  Payment,
  BookingGroup,
  Trip,
} from "@/src/types";
import {
  MOCK_PARTICIPANTS,
  MOCK_DESTINATIONS,
  MOCK_TRIPS,
  MOCK_DRIVERS,
} from "@/src/services/mockData";

export interface BookingResponse {
  participant: Participant;
  payment: Payment;
  assignedGroup: {
    id: string;
    groupNumber: number;
    currentParticipants: number;
    capacity: number;
  };
}

export interface MyBookingsParams {
  email?: string;
  bookingCode?: string;
  status?: string;
}

export const bookingService = {
  async getAvailability(tripId: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ groups: BookingGroup[] }>(`/trips/${tripId}/availability`);
      if (res.success && res.data?.groups) {
        return res.data.groups;
      }
    } catch {
      // Empty groups
    }

    const foundTrip = MOCK_TRIPS.find((t) => t.id === tripId);
    if (foundTrip && Array.isArray(foundTrip.groups)) {
      return foundTrip.groups;
    }

    return [];
  },

  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    try {
      const res = await apiClient.post<BookingResponse>("/bookings", payload);
      if (res.success && res.data) {
        // Also sync to local pool if present
        if (res.data.participant) {
          const exists = MOCK_PARTICIPANTS.some((p) => p.id === res.data.participant.id);
          if (!exists) {
            MOCK_PARTICIPANTS.unshift(res.data.participant);
          }
        }
        return res.data;
      }
    } catch {
      // Fallback: Create structured participant and auto-register trip
    }

    const dest =
      MOCK_DESTINATIONS.find((d) => d.id === payload.destinationId || d.slug === payload.destinationId) ||
      MOCK_DESTINATIONS[0];

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `TRV-${randomSuffix}`;
    const participantId = `part-${Date.now()}-${randomSuffix}`;
    const paymentId = `pay-${Date.now()}`;

    const basePrice = dest.pricePerPax || dest.basePrice || 850000;
    const insuranceFee = payload.hasInsurance ? 50000 : 0;
    const roomSurcharge = payload.roomPreference === "single" ? 350000 : 0;
    const totalAmount = basePrice + insuranceFee + roomSurcharge;

    const depDateStr = (payload.departureDate || new Date().toISOString()).split("T")[0];

    // Find if a matching trip already exists
    let matchedTrip: Trip | undefined = MOCK_TRIPS.find((t) => {
      if (payload.tripId && t.id === payload.tripId && !payload.tripId.startsWith("trip-ondemand-")) {
        return true;
      }
      const isSameDest = t.destinationId === dest.id || t.destination?.slug === dest.slug;
      const tDateStr = t.departureDate.split("T")[0];
      return isSameDest && tDateStr === depDateStr;
    });

    let assignedGroup: BookingGroup;

    if (matchedTrip) {
      // Find open group or add new group
      const foundGroup = matchedTrip.groups.find(
        (g) => g.id === payload.bookingGroupId || (g.status === "open" && g.currentParticipants < g.capacity)
      );

      if (foundGroup) {
        foundGroup.currentParticipants = Math.min(foundGroup.capacity, foundGroup.currentParticipants + 1);
        if (foundGroup.currentParticipants >= foundGroup.capacity) {
          foundGroup.status = "full";
        }
        assignedGroup = foundGroup;
      } else {
        const nextGroupNum = matchedTrip.groups.length + 1;
        const newGroupId = `grp-${matchedTrip.id}-${nextGroupNum}`;
        const newGroupObj: BookingGroup = {
          id: newGroupId,
          tripId: matchedTrip.id,
          groupNumber: nextGroupNum,
          capacity: 6,
          currentParticipants: 1,
          status: "open",
          driverId: MOCK_DRIVERS[nextGroupNum - 1]?.id || MOCK_DRIVERS[0]?.id,
          driver: MOCK_DRIVERS[nextGroupNum - 1] || MOCK_DRIVERS[0],
          name: `Grup Mobil #${nextGroupNum}`,
          notes: `Grup Mobil #${nextGroupNum} (${dest.title})`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        matchedTrip.groups.push(newGroupObj);
        assignedGroup = newGroupObj;
      }
    } else {
      // Auto-spawn new custom trip
      const depDateObj = new Date(payload.departureDate || new Date());
      const durDays = dest.durationDays || 2;
      const retDateObj = new Date(depDateObj.getTime() + durDays * 24 * 60 * 60 * 1000);
      const newTripId =
        payload.tripId && !payload.tripId.startsWith("trip-ondemand-")
          ? payload.tripId
          : `trip-cst-${Date.now()}`;
      const newGroupId = payload.bookingGroupId || `grp-${newTripId}-1`;

      assignedGroup = {
        id: newGroupId,
        tripId: newTripId,
        groupNumber: 1,
        capacity: 6,
        currentParticipants: 1,
        status: "open",
        driverId: MOCK_DRIVERS[0]?.id,
        driver: MOCK_DRIVERS[0],
        name: `Grup Mobil Inisiator #1`,
        notes: `Grup Mobil #1 (${dest.title}) - Inisiasi Traveler`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      matchedTrip = {
        id: newTripId,
        destinationId: dest.id,
        destination: dest,
        departureDate: depDateObj.toISOString(),
        returnDate: retDateObj.toISOString(),
        pricePerPax: basePrice,
        maxGroups: 3,
        status: "scheduled",
        groups: [assignedGroup],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      MOCK_TRIPS.unshift(matchedTrip);
    }

    const newParticipant: Participant = {
      id: participantId,
      bookingCode,
      tripId: matchedTrip.id,
      trip: matchedTrip,
      bookingGroupId: assignedGroup.id,
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      identityNumber: payload.identityNumber,
      nationality: payload.nationality || "Indonesia",
      roomPreference: payload.roomPreference || "shared",
      hasInsurance: payload.hasInsurance,
      insuranceFee,
      totalAmount,
      paymentStatus: "pending",
      checkInStatus: "pending",
      healthNotes: payload.healthNotes,
      voucherQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${bookingCode}`,
      group: assignedGroup,
      destination: dest,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_PARTICIPANTS.unshift(newParticipant);

    const fallbackResponse: BookingResponse = {
      participant: newParticipant,
      payment: {
        id: paymentId,
        participantId,
        amount: totalAmount,
        currency: "IDR",
        status: "pending",
        paymentMethod: "qris",
        snapToken: `snap-token-${Date.now()}`,
        redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock",
        orderId: `ORDER-${bookingCode}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      assignedGroup: {
        id: assignedGroup.id,
        groupNumber: assignedGroup.groupNumber,
        currentParticipants: assignedGroup.currentParticipants,
        capacity: assignedGroup.capacity,
      },
    };

    return fallbackResponse;
  },

  async getSnapToken(
    participantId: string,
    paymentMethod: "qris" | "bank_transfer" | "credit_card" | "gopay" | "cstore" = "qris"
  ): Promise<{ snapToken: string; redirectUrl?: string }> {
    try {
      const res = await apiClient.post<{ snapToken: string; redirectUrl?: string }>(
        `/payments/${participantId}/snap-token`,
        { paymentMethod }
      );
      if (res.success && res.data?.snapToken) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    return {
      snapToken: `snap-mock-${Date.now()}`,
      redirectUrl: "https://app.sandbox.midtrans.com/snap/v2/vtweb/mock",
    };
  },

  async getMyBookings(params?: MyBookingsParams): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/bookings/my-bookings", {
        params: {
          email: params?.email,
          bookingCode: params?.bookingCode,
          status: params?.status,
        },
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Return empty array when unauthenticated, offline, or not found
    }

    return [];
  },

  async simulatePaymentSettlement(participantId: string): Promise<Payment> {
    try {
      const res = await apiClient.post<Payment>(`/payments/${participantId}/simulate`, {
        action: "settle",
      });
      if (res.success && res.data) {
        const found = MOCK_PARTICIPANTS.find((p) => p.id === participantId);
        if (found) found.paymentStatus = "paid";
        return res.data;
      }
    } catch {
      // Fallback
    }

    const found = MOCK_PARTICIPANTS.find((p) => p.id === participantId);
    if (found) {
      found.paymentStatus = "paid";
    }

    return {
      id: `pay-${Date.now()}`,
      participantId,
      amount: found?.totalAmount || 900000,
      currency: "IDR",
      status: "paid",
      paymentMethod: "qris",
      paidAt: new Date().toISOString(),
      orderId: `ORDER-${found?.bookingCode || "TRV-0000"}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

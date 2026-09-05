import { apiClient } from "@/src/lib/api-client";
import type {
  CreateBookingPayload,
  Participant,
  Payment,
  BookingGroup,
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
      // Fallback: Create structured participant
    }

    const dest =
      MOCK_DESTINATIONS.find((d) => d.id === payload.destinationId || d.slug === payload.destinationId) ||
      MOCK_DESTINATIONS[0];

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `TRV-${randomSuffix}`;
    const participantId = `part-${Date.now()}-${randomSuffix}`;
    const paymentId = `pay-${Date.now()}`;
    const groupId = payload.bookingGroupId || `grp-${Date.now()}-1`;

    const basePrice = dest.pricePerPax || dest.basePrice || 850000;
    const insuranceFee = payload.hasInsurance ? 50000 : 0;
    const roomSurcharge = payload.roomPreference === "single" ? 350000 : 0;
    const totalAmount = basePrice + insuranceFee + roomSurcharge;

    const newParticipant: Participant = {
      id: participantId,
      bookingCode,
      tripId: payload.tripId || "trip-01",
      bookingGroupId: groupId,
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
      group: {
        id: groupId,
        tripId: payload.tripId || "trip-01",
        groupNumber: 1,
        capacity: 6,
        currentParticipants: 1,
        status: "open",
        driverId: MOCK_DRIVERS[0]?.id,
        driver: MOCK_DRIVERS[0],
        notes: "Grup Mobil #1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
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
        id: groupId,
        groupNumber: 1,
        currentParticipants: 1,
        capacity: 6,
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

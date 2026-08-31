import { apiClient } from "@/src/lib/api-client";
import type { BookingGroup, CreateBookingPayload, Participant } from "@/src/types";
import { MOCK_PARTICIPANTS, MOCK_TRIPS } from "./mockData";

export const bookingService = {
  async getAvailability(tripId: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<BookingGroup[]>(`/bookings/availability`, {
        params: { tripId },
      });
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    const trip = MOCK_TRIPS.find((t) => t.id === tripId);
    return trip?.groups || [];
  },

  async createBooking(payload: CreateBookingPayload): Promise<{ participant: Participant; snapToken: string }> {
    try {
      const res = await apiClient.post<{ participant: Participant; snapToken: string }>("/bookings", payload);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback simulated response
    }

    const mockNewParticipant: Participant = {
      id: `part-${Date.now()}`,
      tripId: payload.tripId,
      bookingGroupId: "grp-01",
      fullName: payload.fullName,
      email: payload.email,
      phoneNumber: payload.phoneNumber,
      nationality: payload.nationality,
      identityNumber: payload.identityNumber,
      gender: payload.gender,
      roomPreference: payload.roomPreference,
      hasInsurance: payload.hasInsurance,
      insuranceFee: payload.hasInsurance ? 50000 : 0,
      totalAmount: 850000 + (payload.hasInsurance ? 50000 : 0),
      paymentStatus: "pending",
      checkInStatus: "pending",
      bookingCode: `TRIP-MOCK-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      participant: mockNewParticipant,
      snapToken: `SNAP-TOKEN-SIMULATION-${Date.now()}`,
    };
  },

  async getMyBookings(email?: string): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/bookings/my-bookings", {
        params: { email },
      });
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_PARTICIPANTS;
  },

  async simulateMidtransPayment(participantId: string, method: string): Promise<boolean> {
    try {
      const res = await apiClient.post<{ success: boolean }>(`/payments/${participantId}/simulate`, { method });
      if (res.success) return true;
    } catch {
      // Fallback local update
    }
    const p = MOCK_PARTICIPANTS.find((item) => item.id === participantId);
    if (p) {
      p.paymentStatus = "paid";
      p.updatedAt = new Date().toISOString();
    }
    return true;
  },
};

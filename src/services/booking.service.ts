import { apiClient } from "@/src/lib/api-client";
import type { BookingGroup, CreateBookingPayload, Participant } from "@/src/types";
import { MOCK_PARTICIPANTS, MOCK_TRIPS } from "./mockData";

export interface CreateBookingResponse {
  participant: Participant;
  groupOccupancy?: {
    currentParticipants: number;
    capacity: number;
    isFull: boolean;
  };
}

export interface SnapTokenResponse {
  snapToken: string;
  redirectUrl?: string;
  paymentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
}

export const bookingService = {
  async getAvailability(tripId: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ tripId: string; departureDate: string; groups: BookingGroup[] }>(
        `/trips/${tripId}/availability`
      );
      if (res.success && res.data?.groups) return res.data.groups;
    } catch {
      // Fallback
    }
    const trip = MOCK_TRIPS.find((t) => t.id === tripId);
    return trip?.groups || [];
  },

  async createBooking(payload: CreateBookingPayload): Promise<CreateBookingResponse> {
    try {
      const res = await apiClient.post<CreateBookingResponse>("/bookings", {
        tripId: payload.tripId,
        fullName: payload.fullName,
        email: payload.email,
        phoneNumber: payload.phoneNumber,
        nationality: payload.nationality,
        identityNumber: payload.identityNumber,
        gender: payload.gender || "other",
        roomPreference: payload.roomPreference || "shared",
        healthNotes: payload.healthNotes || "",
        hasInsurance: Boolean(payload.hasInsurance),
        captchaToken: payload.captchaToken || "10000000-aaaa-bbbb-cccc-000000000001",
      });

      if (res.success && res.data?.participant) {
        return res.data;
      }
    } catch (err) {
      // If error is ApiError from backend validation (e.g. captcha or group full), propagate it
      if (err instanceof Error && err.name === "ApiError") {
        throw err;
      }
    }

    // Fallback simulation if backend offline
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
      totalAmount: 850000 + (payload.hasInsurance ? 50000 : 0) + (payload.roomPreference === "single" ? 350000 : 0),
      paymentStatus: "pending",
      checkInStatus: "pending",
      bookingCode: `TRV-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_PARTICIPANTS.unshift(mockNewParticipant);

    return {
      participant: mockNewParticipant,
      groupOccupancy: {
        currentParticipants: 5,
        capacity: 6,
        isFull: false,
      },
    };
  },

  async getSnapToken(participantId: string, paymentMethod: string = "qris"): Promise<SnapTokenResponse> {
    try {
      const res = await apiClient.post<SnapTokenResponse>(
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
      snapToken: `SNAP-TOKEN-SIM-${participantId}-${Date.now()}`,
      redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/simulated`,
      paymentId: `pay-${Date.now()}`,
      amount: 900000,
      currency: "IDR",
    };
  },

  async getMyBookings(params?: { email?: string; bookingCode?: string }): Promise<Participant[]> {
    try {
      const res = await apiClient.get<Participant[]>("/bookings/my-bookings", {
        params: {
          email: params?.email,
          bookingCode: params?.bookingCode,
        },
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Fallback
    }

    let filtered = [...MOCK_PARTICIPANTS];
    if (params?.email) {
      filtered = filtered.filter((p) => p.email.toLowerCase() === params.email!.toLowerCase());
    }
    if (params?.bookingCode) {
      filtered = filtered.filter((p) => p.bookingCode.toUpperCase() === params.bookingCode!.toUpperCase());
    }
    return filtered.length > 0 ? filtered : MOCK_PARTICIPANTS;
  },

  async simulateMidtransPayment(participantId: string, method: string): Promise<boolean> {
    try {
      const res = await apiClient.post<{ success: boolean }>(`/payments/${participantId}/simulate`, { method });
      if (res.success) return true;
    } catch {
      // Fallback update mock
    }

    const p = MOCK_PARTICIPANTS.find((item) => item.id === participantId);
    if (p) {
      p.paymentStatus = "paid";
      p.updatedAt = new Date().toISOString();
    }
    return true;
  },
};

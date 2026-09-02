import { apiClient } from "@/src/lib/api-client";
import type {
  CreateBookingPayload,
  Participant,
  Payment,
  BookingGroup,
} from "@/src/types";

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
    return [];
  },

  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    const res = await apiClient.post<BookingResponse>("/bookings", payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal membuat pemesanan.");
    }
    return res.data;
  },

  async getSnapToken(
    participantId: string,
    paymentMethod: "qris" | "bank_transfer" | "credit_card" | "gopay" | "cstore" = "qris"
  ): Promise<{ snapToken: string; redirectUrl?: string }> {
    const res = await apiClient.post<{ snapToken: string; redirectUrl?: string }>(
      `/payments/${participantId}/snap-token`,
      { paymentMethod }
    );
    if (res.success && res.data?.snapToken) {
      return res.data;
    }
    throw new Error(res.message || "Gagal mendapatkan Midtrans Snap Token");
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
      // Empty if unauthenticated or no bookings found
    }
    return [];
  },

  async simulatePaymentSettlement(participantId: string): Promise<Payment> {
    const res = await apiClient.post<Payment>(`/payments/${participantId}/simulate`, {
      action: "settle",
    });
    if (res.success && res.data) {
      return res.data;
    }
    throw new Error("Gagal simulasi pembayaran");
  },
};

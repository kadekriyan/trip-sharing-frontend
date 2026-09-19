import { apiClient } from "@/src/lib/api-client";
import type {
  CreateBookingPayload,
  BulkBookingPayload,
  BulkBookingResponse,
  Participant,
  Payment,
  BookingGroup,
  InvoiceData,
  InvoiceItem,
} from "@/src/types";
import { normalizeParticipant } from "@/src/lib/utils";

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
      // Empty on error
    }
    return [];
  },

  async createBooking(payload: CreateBookingPayload): Promise<BookingResponse> {
    const res = await apiClient.post<BookingResponse>("/bookings", payload);
    if (res.success && res.data) {
      if (res.data.participant) {
        res.data.participant = normalizeParticipant(res.data.participant);
      }
      return res.data;
    }
    throw new Error(res.message || "Gagal membuat pesanan booking. Silakan coba lagi.");
  },

  async createBulkBooking(payload: BulkBookingPayload): Promise<BulkBookingResponse> {
    try {
      const res = await apiClient.post<BulkBookingResponse>("/bookings/bulk", payload);
      if (res.success && res.data) {
        if (Array.isArray(res.data.participants)) {
          res.data.participants = res.data.participants.map(normalizeParticipant);
        }
        return res.data;
      }
      throw new Error(res.message || "Gagal membuat pesanan rombongan.");
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      // Fallback to /bookings/batch if /bookings/bulk returns 404
      if (errorObj?.status === 404 || errorObj?.message?.includes("404")) {
        const altRes = await apiClient.post<BulkBookingResponse>("/bookings/batch", payload);
        if (altRes.success && altRes.data) {
          if (Array.isArray(altRes.data.participants)) {
            altRes.data.participants = altRes.data.participants.map(normalizeParticipant);
          }
          return altRes.data;
        }
      }
      throw err;
    }
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
    throw new Error(res.message || "Gagal mendapatkan token pembayaran dari gateway.");
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
        return res.data.map(normalizeParticipant);
      }
    } catch {
      // Return empty array on error
    }
    return [];
  },

  async simulatePayment(
    idOrParticipantId: string,
    action: "settle" | "settlement" | "capture" | "success" | "expire" | "expired" | "cancel" | "cancelled" | "deny" | "denied" | "failure" = "settle"
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    try {
      const res = await apiClient.post<{
        id: string;
        participant_id?: string;
        booking_group_id?: string;
        amount?: string | number;
        status: string;
      }>(`/payments/${idOrParticipantId}/simulate`, { action });

      if (res.success) {
        return {
          success: true,
          message: res.message || `Simulasi pembayaran berhasil diproses: ${res.data?.status || action}`,
          data: res.data,
        };
      }
    } catch {
      // Try alternative endpoint /payments/participants/:id/simulate
      const altRes = await apiClient.post<{
        id: string;
        participant_id?: string;
        status: string;
      }>(`/payments/participants/${idOrParticipantId}/simulate`, { action });

      if (altRes.success) {
        return {
          success: true,
          message: altRes.message || `Simulasi pembayaran berhasil: ${altRes.data?.status || action}`,
          data: altRes.data,
        };
      }
    }

    throw new Error("Gagal memproses simulasi pembayaran di server backend.");
  },

  async simulatePaymentSettlement(participantId: string): Promise<Payment> {
    const sim = await this.simulatePayment(participantId, "settle");
    return {
      id: `pay-${participantId}`,
      participantId,
      amount: 0,
      currency: "IDR",
      status: "paid",
      paymentMethod: "qris",
      paidAt: new Date().toISOString(),
      orderId: `ORDER-${participantId}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getBookingInvoice(identifier: string): Promise<InvoiceData | null> {
    const cleanId = identifier.trim();

    // 1. Try GET /bookings/:identifier/invoice
    try {
      const res = await apiClient.get<InvoiceData>(`/bookings/${encodeURIComponent(cleanId)}/invoice`);
      if (res.success && res.data) {
        if (!res.data.customer.dateOfBirth && !res.data.customer.date_of_birth) {
          try {
            const myBookings = await this.getMyBookings({ bookingCode: cleanId });
            if (myBookings.length > 0 && (myBookings[0].dateOfBirth || myBookings[0].date_of_birth)) {
              res.data.customer.dateOfBirth = myBookings[0].dateOfBirth || myBookings[0].date_of_birth;
            }
          } catch {
            // Ignore
          }
        }
        res.data.customer.hasInsurance = Boolean(
          res.data.customer.dateOfBirth ||
            res.data.customer.date_of_birth ||
            res.data.customer.hasInsurance ||
            res.data.customer.has_insurance
        );
        return res.data;
      }
    } catch {
      // Try alias endpoint
    }

    // 2. Try alias GET /bookings/invoice/:identifier
    try {
      const altRes = await apiClient.get<InvoiceData>(`/bookings/invoice/${encodeURIComponent(cleanId)}`);
      if (altRes.success && altRes.data) {
        if (!altRes.data.customer.dateOfBirth && !altRes.data.customer.date_of_birth) {
          try {
            const myBookings = await this.getMyBookings({ bookingCode: cleanId });
            if (myBookings.length > 0 && (myBookings[0].dateOfBirth || myBookings[0].date_of_birth)) {
              altRes.data.customer.dateOfBirth = myBookings[0].dateOfBirth || myBookings[0].date_of_birth;
            }
          } catch {
            // Ignore
          }
        }
        altRes.data.customer.hasInsurance = Boolean(
          altRes.data.customer.dateOfBirth ||
            altRes.data.customer.date_of_birth ||
            altRes.data.customer.hasInsurance ||
            altRes.data.customer.has_insurance
        );
        return altRes.data;
      }
    } catch {
      // Try building from my-bookings
    }

    // 3. Fallback: Search in my-bookings participants and synthesize InvoiceData
    let foundParticipant: Participant | undefined;
    try {
      const myBookings = await this.getMyBookings({ bookingCode: cleanId });
      if (myBookings.length > 0) {
        foundParticipant = myBookings[0];
      }
    } catch {
      // Ignore
    }

    if (!foundParticipant) {
      try {
        const resPart = await apiClient.get<Participant>(`/admin/participants/${encodeURIComponent(cleanId)}`);
        if (resPart.success && resPart.data) {
          foundParticipant = normalizeParticipant(resPart.data);
        }
      } catch {
        // Not found
      }
    }

    if (!foundParticipant) {
      return null;
    }

    const dest = foundParticipant.destination || foundParticipant.trip?.destination;
    const group = foundParticipant.group || foundParticipant.bookingGroup;
    const driver = group?.driver;

    const isTransportOnly =
      foundParticipant.packageType === "TRANSPORT_ONLY" ||
      foundParticipant.package_type === "TRANSPORT_ONLY" ||
      foundParticipant.serviceType === "TRANSPORT_ONLY" ||
      foundParticipant.packageType === "transport_only" ||
      foundParticipant.package_type === "transport_only";
    const packageTypeKey = isTransportOnly ? "TRANSPORT_ONLY" : "ALL_IN";
    const packageTypeLabel = isTransportOnly ? "Transport Only (Vehicle & Driver Assist)" : "All-Inclusive (Complete Tour Package)";

    const basePrice = isTransportOnly
      ? (dest?.priceTransportOnly || dest?.price_transport_only || dest?.priceTransport || foundParticipant.totalAmount || dest?.pricePerPax || 0)
      : (foundParticipant.trip?.pricePerPax || dest?.pricePerPax || 0);
    const totalAmount = foundParticipant.totalAmount || basePrice;
    const isPaid = foundParticipant.paymentStatus === "paid";
    const bookingCode = foundParticipant.bookingCode || cleanId;
    const dob = foundParticipant.dateOfBirth || foundParticipant.date_of_birth;

    const items: InvoiceItem[] = [
      {
        itemNumber: 1,
        description: `Trip Sharing Package - ${dest?.title || dest?.name || "Tour Destination"} (${packageTypeLabel}) (1 Pax)`,
        category: isTransportOnly ? "Transport Only" : "All-In Package",
        quantity: 1,
        unitPrice: basePrice,
        amount: basePrice,
      },
    ];

    return {
      invoice: {
        invoiceNumber: `INV-${new Date(foundParticipant.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, "")}-${bookingCode}`,
        invoiceDate: foundParticipant.createdAt || new Date().toISOString(),
        dueDate: foundParticipant.createdAt || new Date().toISOString(),
        paidAt: isPaid ? (foundParticipant.updatedAt || new Date().toISOString()) : null,
        status: isPaid ? "PAID" : foundParticipant.paymentStatus === "cancelled" ? "CANCELLED" : "PENDING",
        paymentStatus: foundParticipant.paymentStatus || "pending",
        checkInStatus: foundParticipant.checkInStatus || "pending",
        bookingCode,
        participantId: foundParticipant.id,
        bookingGroupId: foundParticipant.bookingGroupId || "",
        tripId: foundParticipant.tripId || "",
        packageType: packageTypeKey,
        package_type: packageTypeKey,
      },
      issuer: {
        companyName: "Share Tour Jogja",
        legalName: "PT Share Tour Jogja",
        tagline: "Yogyakarta Tour & Trip Sharing Adventure Platform",
        website: "https://tripsharing.id",
        supportEmail: "dejaayajax@gmail.com",
        supportPhone: "081216916003",
        address: "Tegallayang 9, RT 02, Caturharjo, Pandak Bantul, Yogyakarta, 55761",
      },
      customer: {
        fullName: foundParticipant.fullName || "Traveler",
        email: foundParticipant.email || "-",
        phoneNumber: foundParticipant.phoneNumber || "-",
        dateOfBirth: dob,
        date_of_birth: dob,
        hasInsurance: Boolean(dob || foundParticipant.hasInsurance || foundParticipant.has_insurance),
        has_insurance: Boolean(dob || foundParticipant.hasInsurance || foundParticipant.has_insurance),
        country: foundParticipant.nationality || "Indonesia",
        nationality: foundParticipant.nationality || "Indonesia",
        gender: foundParticipant.gender || "male",
      },
      tripDetails: {
        destinationId: dest?.id || "",
        destinationName: dest?.title || dest?.name || "Tour Package",
        destinationSlug: dest?.slug || "",
        destinationCoverImage: dest?.coverImage || "/images/hero-bromo.png",
        departureDate: foundParticipant.departureDate || foundParticipant.trip?.departureDate || foundParticipant.createdAt,
        returnDate: foundParticipant.trip?.returnDate || foundParticipant.departureDate || foundParticipant.createdAt,
        duration: dest ? `${dest.durationDays || 2} Days ${dest.durationNights || 1} Nights` : "-",
        meetingPoint: dest?.meetingPoint || "Official Meeting Point",
        pickupLocation: foundParticipant.pickupLocation || dest?.meetingPoint || "Official Meeting Point",
        pickupLatitude: foundParticipant.pickupLatitude ?? null,
        pickupLongitude: foundParticipant.pickupLongitude ?? null,
        pickupNotes: foundParticipant.pickupNotes || "",
        packageType: packageTypeKey,
        package_type: packageTypeKey,
        serviceType: packageTypeKey,
        groupNumber: group?.groupNumber || 1,
        vehicleModel: driver?.vehicleModel || "Toyota HiAce (VIP Fleet)",
        vehiclePlateNumber: driver?.plateNumber || "-",
        driverName: driver?.fullName || "Driver Assist Standby",
        driverPhone: driver?.phoneNumber || "-",
      },
      pricing: {
        currency: "IDR",
        items,
        basePrice,
        adminFee: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount,
      },
      paymentDetails: {
        paymentId: foundParticipant.paymentId || `pay-${foundParticipant.id}`,
        paymentMethod: "Midtrans Snap Gateway",
        midtransOrderId: `TRIP-${bookingCode}`,
        midtransTransactionId: `trx-${foundParticipant.id.slice(0, 8)}`,
        paymentStatus: foundParticipant.paymentStatus || "pending",
        transactionTime: foundParticipant.createdAt || new Date().toISOString(),
        completionTime: isPaid ? (foundParticipant.updatedAt || new Date().toISOString()) : null,
        paymentProofUrl: null,
      },
      verification: {
        voucherQrCode: foundParticipant.voucherQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bookingCode)}`,
        invoiceUrl: `/bookings/${bookingCode}/invoice`,
      },
    };
  },
};

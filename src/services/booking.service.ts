import { apiClient } from "@/src/lib/api-client";
import type {
  CreateBookingPayload,
  Participant,
  Payment,
  BookingGroup,
  Trip,
  InvoiceData,
} from "@/src/types";
import {
  MOCK_PARTICIPANTS,
  MOCK_DESTINATIONS,
  MOCK_TRIPS,
  MOCK_DRIVERS,
} from "@/src/services/mockData";
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
        if (res.data.participant) {
          const normalized = normalizeParticipant(res.data.participant);
          res.data.participant = normalized;
          const existsIdx = MOCK_PARTICIPANTS.findIndex(
            (p) => p.id === normalized.id || p.bookingCode === normalized.bookingCode
          );
          if (existsIdx >= 0) {
            MOCK_PARTICIPANTS[existsIdx] = normalized;
          } else {
            MOCK_PARTICIPANTS.unshift(normalized);
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
      pickupLocation: payload.pickupLocation,
      pickupLatitude: payload.pickupLatitude,
      pickupLongitude: payload.pickupLongitude,
      pickupNotes: payload.pickupNotes,
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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(normalizeParticipant);
      }
    } catch {
      // Fallback to local participants when unauthenticated, offline, or search by code
    }

    const code = params?.bookingCode?.trim().toUpperCase();
    const em = params?.email?.trim().toLowerCase();

    if (code || em) {
      const matched = MOCK_PARTICIPANTS.filter((p) => {
        const matchCode = code ? p.bookingCode?.toUpperCase() === code : true;
        const matchEmail = em ? p.email?.toLowerCase() === em : true;
        return matchCode && matchEmail;
      });
      if (matched.length > 0) {
        return matched.map(normalizeParticipant);
      }
    }

    return MOCK_PARTICIPANTS.map(normalizeParticipant);
  },

  async simulatePayment(
    idOrParticipantId: string,
    action: "settle" | "settlement" | "capture" | "success" | "expire" | "expired" | "cancel" | "cancelled" | "deny" | "denied" | "failure" = "settle"
  ): Promise<{ success: boolean; message: string; data?: unknown }> {
    const isSuccessAction = ["settle", "settlement", "capture", "success"].includes(action);
    const targetStatus = isSuccessAction ? "paid" : "cancelled";

    try {
      const res = await apiClient.post<{
        id: string;
        participant_id?: string;
        booking_group_id?: string;
        amount?: string | number;
        status: string;
      }>(`/payments/${idOrParticipantId}/simulate`, { action });

      if (res.success) {
        const found = MOCK_PARTICIPANTS.find(
          (p) => p.id === idOrParticipantId || p.bookingCode === idOrParticipantId
        );
        if (found) {
          found.paymentStatus = isSuccessAction ? "paid" : "cancelled";
        }
        return {
          success: true,
          message: res.message || `Simulasi pembayaran berhasil diproses: ${res.data?.status || action}`,
          data: res.data,
        };
      }
    } catch {
      // Fallback: try /payments/participants/:id/simulate
      try {
        const altRes = await apiClient.post<{
          id: string;
          participant_id?: string;
          status: string;
        }>(`/payments/participants/${idOrParticipantId}/simulate`, { action });

        if (altRes.success) {
          const found = MOCK_PARTICIPANTS.find(
            (p) => p.id === idOrParticipantId || p.bookingCode === idOrParticipantId
          );
          if (found) {
            found.paymentStatus = isSuccessAction ? "paid" : "cancelled";
          }
          return {
            success: true,
            message: altRes.message || `Simulasi pembayaran berhasil: ${altRes.data?.status || action}`,
            data: altRes.data,
          };
        }
      } catch {
        // Fallback to local mock state
      }
    }

    const found = MOCK_PARTICIPANTS.find(
      (p) => p.id === idOrParticipantId || p.bookingCode === idOrParticipantId
    );
    if (found) {
      found.paymentStatus = isSuccessAction ? "paid" : "cancelled";
    }

    return {
      success: true,
      message: `Simulasi pembayaran berhasil diproses (${targetStatus})`,
      data: {
        id: `pay-${Date.now()}`,
        participant_id: idOrParticipantId,
        status: isSuccessAction ? "completed" : "failed",
      },
    };
  },

  async simulatePaymentSettlement(participantId: string): Promise<Payment> {
    await this.simulatePayment(participantId, "settle");
    const found = MOCK_PARTICIPANTS.find((p) => p.id === participantId);

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

  async getBookingInvoice(identifier: string): Promise<InvoiceData> {
    const cleanId = identifier.trim();

    // 1. Try GET /bookings/:identifier/invoice
    try {
      const res = await apiClient.get<InvoiceData>(`/bookings/${encodeURIComponent(cleanId)}/invoice`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Try alias endpoint
    }

    // 2. Try alias GET /bookings/invoice/:identifier
    try {
      const altRes = await apiClient.get<InvoiceData>(`/bookings/invoice/${encodeURIComponent(cleanId)}`);
      if (altRes.success && altRes.data) {
        return altRes.data;
      }
    } catch {
      // Fallback
    }

    // 3. Fallback: Search in local / my-bookings participants and synthesize full InvoiceData
    let foundParticipant: Participant | undefined;

    try {
      const myBookings = await this.getMyBookings({ bookingCode: cleanId });
      if (myBookings.length > 0) {
        foundParticipant = myBookings[0];
      }
    } catch {
      // Continue
    }

    if (!foundParticipant) {
      const upperId = cleanId.toUpperCase();
      foundParticipant = MOCK_PARTICIPANTS.find(
        (p) =>
          p.id === cleanId ||
          p.bookingCode?.toUpperCase() === upperId ||
          p.paymentId === cleanId
      );
    }

    if (!foundParticipant) {
      // Return a synthesized fallback with default demo structure
      const defaultDest = MOCK_DESTINATIONS[0];
      const defaultDriver = MOCK_DRIVERS[0];
      const code = cleanId.startsWith("TRV-") ? cleanId : "TRV-8921";

      return {
        invoice: {
          invoiceNumber: `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${code}`,
          invoiceDate: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          paidAt: new Date().toISOString(),
          status: "PAID",
          paymentStatus: "paid",
          checkInStatus: "pending",
          bookingCode: code,
          participantId: cleanId,
          bookingGroupId: "grp-demo-01",
          tripId: "trip-01",
        },
        issuer: {
          companyName: "Share Tour Jogja",
          legalName: "",
          tagline: "Open Trip & Sharing Tour Yogyakarta",
          website: "https://sharingtouryogyakarta.com",
          supportEmail: "dejaayajax@gmail.com",
          supportPhone: "081216916003",
          address: "Tegallayang 9, RT 02, Caturharjo, Pandak Bantul, Yogyakarta, 55761",
        },
        customer: {
          fullName: "Guest Traveler",
          email: "traveler@sharingtouryogyakarta.com",
          phoneNumber: "+62 812-3456-7890",
          identityNumber: "3578012345670001",
          identityType: "KTP",
          country: "Indonesia",
          nationality: "Indonesia",
          gender: "female",
        },
        tripDetails: {
          destinationId: defaultDest.id,
          destinationName: defaultDest.title,
          destinationSlug: defaultDest.slug,
          destinationCoverImage: defaultDest.coverImage,
          departureDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          returnDate: new Date(Date.now() + 4 * 86400000).toISOString(),
          duration: `${defaultDest.durationDays} Hari ${defaultDest.durationNights} Malam`,
          meetingPoint: defaultDest.meetingPoint,
          pickupLocation: "Hotel Santika Premiere Malang, Jl. Letjen Sutoyo No.79",
          pickupLatitude: -7.962145,
          pickupLongitude: 112.634125,
          pickupNotes: "Tunggu di lobi timur dekat drop-off point",
          roomPreference: "Single Supplement",
          roomType: "Standard",
          groupNumber: 1,
          vehicleModel: defaultDriver.vehicleModel,
          vehiclePlateNumber: defaultDriver.plateNumber,
          driverName: defaultDriver.fullName,
          driverPhone: defaultDriver.phoneNumber,
        },
        pricing: {
          currency: "IDR",
          items: [
            {
              itemNumber: 1,
              description: `Paket Trip Sharing - ${defaultDest.title} (1 Pax)`,
              category: "Trip Package",
              quantity: 1,
              unitPrice: defaultDest.pricePerPax,
              amount: defaultDest.pricePerPax,
            },
            {
              itemNumber: 2,
              description: "Premi Asuransi Perjalanan (Travel Insurance Protection & Emergency Assistance)",
              category: "Add-on Insurance",
              quantity: 1,
              unitPrice: 50000,
              amount: 50000,
            },
          ],
          basePrice: defaultDest.pricePerPax,
          insuranceFee: 50000,
          adminFee: 0,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: defaultDest.pricePerPax + 50000,
        },
        paymentDetails: {
          paymentId: `pay-${Date.now()}`,
          paymentMethod: "Midtrans Snap Gateway",
          midtransOrderId: `TRIP-${code}`,
          midtransTransactionId: `trx-${Date.now()}`,
          paymentStatus: "paid",
          transactionTime: new Date().toISOString(),
          completionTime: new Date().toISOString(),
          paymentProofUrl: null,
        },
        verification: {
          voucherQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(code)}`,
          invoiceUrl: `/bookings/${code}/invoice`,
        },
      };
    }

    const dest = foundParticipant.destination || foundParticipant.trip?.destination || MOCK_DESTINATIONS[0];
    const group = foundParticipant.group || foundParticipant.bookingGroup || { groupNumber: 1, capacity: 6, driver: null };
    const driver = group?.driver || MOCK_DRIVERS[0];
    const basePrice = foundParticipant.trip?.pricePerPax || dest?.pricePerPax || 850000;
    const insuranceFee = foundParticipant.hasInsurance ? (foundParticipant.insuranceFee || 50000) : 0;
    const totalAmount = foundParticipant.totalAmount || (basePrice + insuranceFee);
    const isPaid = foundParticipant.paymentStatus === "paid";
    const bookingCode = foundParticipant.bookingCode || cleanId || "TRV-0000";

    const items = [
      {
        itemNumber: 1,
        description: `Paket Trip Sharing - ${dest?.title || dest?.name || "Destinasi Wisata"} (1 Pax)`,
        category: "Trip Package",
        quantity: 1,
        unitPrice: basePrice,
        amount: basePrice,
      },
    ];

    if (foundParticipant.hasInsurance) {
      items.push({
        itemNumber: 2,
        description: "Premi Asuransi Perjalanan (Travel Insurance Protection & Emergency Assistance)",
        category: "Add-on Insurance",
        quantity: 1,
        unitPrice: insuranceFee,
        amount: insuranceFee,
      });
    }

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
      },
      issuer: {
        companyName: "Share Tour Jogja",
        legalName: "",
        tagline: "Open Trip & Sharing Tour Yogyakarta",
        website: "https://sharingtouryogyakarta.com",
        supportEmail: "dejaayajax@gmail.com",
        supportPhone: "081216916003",
        address: "Tegallayang 9, RT 02, Caturharjo, Pandak Bantul, Yogyakarta, 55761",
      },
      customer: {
        fullName: foundParticipant.fullName || "Traveler",
        email: foundParticipant.email || "traveler@sharingtouryogyakarta.com",
        phoneNumber: foundParticipant.phoneNumber || "-",
        identityNumber: foundParticipant.identityNumber && foundParticipant.identityNumber !== "-" ? foundParticipant.identityNumber : "-",
        identityType: "KTP",
        country: foundParticipant.nationality || "Indonesia",
        nationality: foundParticipant.nationality || "Indonesia",
        gender: foundParticipant.gender || "male",
      },
      tripDetails: {
        destinationId: dest?.id || "",
        destinationName: dest?.title || dest?.name || "Paket Wisata",
        destinationSlug: dest?.slug || "",
        destinationCoverImage: dest?.coverImage || "/images/dest-bromo.jpg",
        departureDate: foundParticipant.departureDate || foundParticipant.trip?.departureDate || foundParticipant.createdAt,
        returnDate: foundParticipant.trip?.returnDate || foundParticipant.departureDate || foundParticipant.createdAt,
        duration: `${dest?.durationDays || 2} Hari ${dest?.durationNights || 1} Malam`,
        meetingPoint: dest?.meetingPoint || "Meeting Point Destinasi",
        pickupLocation: foundParticipant.pickupLocation || dest?.meetingPoint || "Meeting Point Resmi Destinasi",
        pickupLatitude: foundParticipant.pickupLatitude ?? null,
        pickupLongitude: foundParticipant.pickupLongitude ?? null,
        pickupNotes: foundParticipant.pickupNotes || "",
        roomPreference: foundParticipant.roomPreference === "single" ? "Single Supplement" : "Twin Sharing",
        roomType: "Standard",
        groupNumber: group?.groupNumber || 1,
        vehicleModel: driver?.vehicleModel || "Toyota HiAce (6-Seater VIP)",
        vehiclePlateNumber: driver?.plateNumber || "N 1234 XY",
        driverName: driver?.fullName || "Driver Belum Ditugaskan",
        driverPhone: driver?.phoneNumber || "-",
      },
      pricing: {
        currency: "IDR",
        items,
        basePrice,
        insuranceFee,
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


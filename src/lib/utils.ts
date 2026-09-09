import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type {
  PaymentStatus,
  GroupStatus,
  Destination,
  TripStatus,
  Participant,
  BookingGroup,
  Trip,
  CheckInStatus,
} from "@/src/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | string | null): string {
  if (amount === undefined || amount === null) return "Rp 0";
  const numeric = typeof amount === "number" ? amount : Number(amount);
  if (isNaN(numeric) || !isFinite(numeric)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function getDestinationTitle(dest?: Partial<Destination> | null): string {
  if (!dest) return "Paket Wisata";
  return dest.title || dest.name || dest.tagline || "Paket Wisata";
}

export function getDestinationPrice(dest?: Partial<Destination> | Record<string, unknown> | null): number {
  if (!dest) return 0;
  const anyDest = dest as Record<string, unknown>;

  // 1. Direct root pricing fields
  let val: unknown =
    anyDest.pricePerPax ??
    anyDest.price ??
    anyDest.basePrice ??
    anyDest.startPrice ??
    anyDest.pricePerPerson ??
    anyDest.cost;

  // 2. Nested in trips or activeTrips arrays
  if (val === undefined || val === null || val === 0) {
    const trips = (anyDest.trips || anyDest.activeTrips) as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(trips) && trips.length > 0) {
      val =
        trips[0]?.pricePerPax ??
        trips[0]?.price ??
        trips[0]?.basePrice ??
        trips[0]?.startPrice;
    }
  }

  // 3. Single trip object
  if (val === undefined || val === null || val === 0) {
    const trip = anyDest.trip as Record<string, unknown> | undefined;
    if (trip && typeof trip === "object") {
      val = trip.pricePerPax ?? trip.price ?? trip.basePrice;
    }
  }

  // 4. Snake_case fallback fields
  if (val === undefined || val === null || val === 0) {
    val = anyDest.price_per_pax ?? anyDest.base_price ?? anyDest.start_price;
  }

  const numeric = typeof val === "number" ? val : Number(val);
  return isNaN(numeric) || !isFinite(numeric) ? 0 : numeric;
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...options,
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatDuration(days: number, nights: number): string {
  if (nights === 0) return `${days} Hari`;
  return `${days}D / ${nights}N`;
}

export function calculateOccupancyPercent(current: number, max: number = 6): number {
  if (!max || max <= 0) return 0;
  return Math.min(Math.round((current / max) * 100), 100);
}

export function getGroupStatusBadge(status: GroupStatus): { label: string; className: string } {
  switch (status) {
    case "open":
      return {
        label: "Slot Tersedia",
        className: "bg-emerald-100 text-emerald-800 border-emerald-300",
      };
    case "full":
      return {
        label: "Grup Penuh",
        className: "bg-amber-100 text-amber-800 border-amber-300",
      };
    case "in_progress":
      return {
        label: "Sedang Berjalan",
        className: "bg-sky-100 text-sky-800 border-sky-300",
      };
    case "completed":
      return {
        label: "Selesai",
        className: "bg-slate-100 text-slate-800 border-slate-300",
      };
    case "cancelled":
      return {
        label: "Dibatalkan",
        className: "bg-rose-100 text-rose-800 border-rose-300",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-800 border-slate-300",
      };
  }
}

export function getPaymentBadge(status: PaymentStatus): { label: string; className: string } {
  switch (status) {
    case "paid":
      return {
        label: "Lunas",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "pending":
      return {
        label: "Menunggu Pembayaran",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "failed":
      return {
        label: "Gagal",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    case "cancelled":
      return {
        label: "Dibatalkan",
        className: "bg-slate-50 text-slate-600 border-slate-200",
      };
    case "refunded":
      return {
        label: "Dikembalikan",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-50 text-slate-600 border-slate-200",
      };
  }
}

export function getTripStatusBadge(status: TripStatus | string): { label: string; className: string } {
  switch (status) {
    case "planning":
      return {
        label: "Perencanaan",
        className: "bg-slate-100 text-slate-700 border-slate-300",
      };
    case "published":
      return {
        label: "Dipublikasikan",
        className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      };
    case "scheduled":
      return {
        label: "Terjadwal",
        className: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case "active":
      return {
        label: "Aktif",
        className: "bg-teal-50 text-teal-700 border-teal-200",
      };
    case "ongoing":
      return {
        label: "Sedang Berjalan",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "departed":
      return {
        label: "Berangkat",
        className: "bg-violet-50 text-violet-700 border-violet-200",
      };
    case "completed":
      return {
        label: "Selesai",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "cancelled":
      return {
        label: "Dibatalkan",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-700 border-slate-300",
      };
  }
}

/**
 * Normalizes image URL (handles relative /uploads/ paths from backend)
 */
export function getImageUrl(path?: string | null, fallback?: string): string {
  const defaultFallback =
    fallback || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80";

  if (!path || typeof path !== "string" || path.trim() === "") {
    return defaultFallback;
  }

  const clean = path.trim();

  // Blob URLs from local sessions are transient and cannot be loaded across SSR or persistent storage.
  // Return defaultFallback deterministically on both server and client to prevent React hydration mismatch.
  if (clean.startsWith("blob:")) {
    return defaultFallback;
  }

  if (
    clean.startsWith("http://") ||
    clean.startsWith("https://") ||
    clean.startsWith("data:")
  ) {
    return clean;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace(/\/api\/?$/, "");
  const normalizedPath = clean.startsWith("/") ? clean : `/${clean}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Robustly normalizes raw participant payloads from backend (snake_case / camelCase)
 */
export function normalizeParticipant(rawRecord: unknown): Participant {
  if (!rawRecord || typeof rawRecord !== "object") {
    return {
      id: `part-${Date.now()}`,
      bookingCode: "TRV-UNKNOWN",
      tripId: "",
      bookingGroupId: "",
      fullName: "Traveler",
      email: "",
      phoneNumber: "",
      nationality: "Indonesia",
      identityNumber: "-",
      roomPreference: "shared",
      hasInsurance: false,
      insuranceFee: 0,
      totalAmount: 0,
      paymentStatus: "pending",
      checkInStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const raw = rawRecord as Record<string, unknown>;
  const user = (raw.user && typeof raw.user === "object") ? (raw.user as Record<string, unknown>) : undefined;
  const rawGroup = (raw.group || raw.bookingGroup || raw.booking_group) as BookingGroup | undefined;
  const rawTrip = (raw.trip || rawGroup?.trip) as Trip | undefined;
  const rawDest = (raw.destination || rawTrip?.destination) as Destination | undefined;

  const id = String(raw.id || raw.participant_id || raw.participantId || `part-${Date.now()}`);
  const bookingCode = String(raw.bookingCode || raw.booking_code || raw.code || "TRV-XXXX");
  const fullName = String(
    raw.fullName ||
      raw.full_name ||
      raw.name ||
      user?.fullName ||
      user?.full_name ||
      user?.name ||
      "Traveler"
  );
  const email = String(raw.email || user?.email || "");
  const phoneNumber = String(
    raw.phoneNumber ||
      raw.phone_number ||
      raw.phone ||
      user?.phoneNumber ||
      user?.phone_number ||
      ""
  );
  const identityNumber = String(
    raw.identityNumber ||
      raw.identity_number ||
      raw.nik ||
      raw.passport ||
      user?.identityNumber ||
      "-"
  );
  const nationality = String(raw.nationality || user?.nationality || "Indonesia");
  const roomPreference = (raw.roomPreference || raw.room_preference || "shared") as "shared" | "single" | "none";
  const hasInsurance = Boolean(raw.hasInsurance ?? raw.has_insurance ?? false);
  const insuranceFee = Number(raw.insuranceFee ?? raw.insurance_fee ?? (hasInsurance ? 50000 : 0));
  const totalAmount = Number(raw.totalAmount ?? raw.total_amount ?? raw.amount ?? raw.price ?? 850000);
  const paymentStatus = (raw.paymentStatus || raw.payment_status || "pending") as PaymentStatus;
  const checkInStatus = (raw.checkInStatus || raw.check_in_status || "pending") as CheckInStatus;
  const healthNotes =
    typeof raw.healthNotes === "string"
      ? raw.healthNotes
      : typeof raw.health_notes === "string"
      ? raw.health_notes
      : typeof raw.notes === "string"
      ? raw.notes
      : undefined;

  const pickupLocation =
    typeof raw.pickupLocation === "string"
      ? raw.pickupLocation
      : typeof raw.pickup_location === "string"
      ? raw.pickup_location
      : typeof raw.pickup_address === "string"
      ? raw.pickup_address
      : undefined;

  const pickupLatitude =
    typeof raw.pickupLatitude === "number"
      ? raw.pickupLatitude
      : typeof raw.pickup_latitude === "number"
      ? raw.pickup_latitude
      : undefined;

  const pickupLongitude =
    typeof raw.pickupLongitude === "number"
      ? raw.pickupLongitude
      : typeof raw.pickup_longitude === "number"
      ? raw.pickup_longitude
      : undefined;

  const pickupNotes =
    typeof raw.pickupNotes === "string"
      ? raw.pickupNotes
      : typeof raw.pickup_notes === "string"
      ? raw.pickup_notes
      : undefined;

  const tripId = String(raw.tripId || raw.trip_id || rawTrip?.id || "");
  const bookingGroupId = String(
    raw.bookingGroupId ||
      raw.booking_group_id ||
      raw.groupId ||
      raw.group_id ||
      rawGroup?.id ||
      ""
  );

  const departureDate =
    typeof raw.departureDate === "string"
      ? raw.departureDate
      : typeof raw.departure_date === "string"
      ? raw.departure_date
      : typeof rawTrip?.departureDate === "string"
      ? rawTrip.departureDate
      : typeof rawTrip?.departure_date === "string"
      ? rawTrip.departure_date
      : typeof raw.createdAt === "string"
      ? raw.createdAt
      : typeof raw.created_at === "string"
      ? raw.created_at
      : new Date().toISOString();

  const createdAt = String(raw.createdAt || raw.created_at || departureDate);
  const updatedAt = String(raw.updatedAt || raw.updated_at || createdAt);

  const voucherQrCode = String(
    raw.voucherQrCode ||
      raw.voucher_qr_code ||
      `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(bookingCode)}`
  );

  return {
    id,
    bookingCode,
    tripId,
    trip: rawTrip,
    bookingGroupId,
    group: rawGroup,
    bookingGroup: rawGroup,
    destination: rawDest,
    fullName,
    full_name: fullName,
    email,
    phoneNumber,
    phone_number: phoneNumber,
    identityNumber,
    identity_number: identityNumber,
    nationality,
    roomPreference,
    room_preference: roomPreference,
    hasInsurance,
    has_insurance: hasInsurance,
    insuranceFee,
    totalAmount,
    total_amount: totalAmount,
    paymentStatus,
    payment_status: paymentStatus,
    checkInStatus,
    check_in_status: checkInStatus,
    healthNotes,
    health_notes: healthNotes,
    pickupLocation,
    pickup_location: pickupLocation,
    pickupLatitude,
    pickup_latitude: pickupLatitude,
    pickupLongitude,
    pickup_longitude: pickupLongitude,
    pickupNotes,
    pickup_notes: pickupNotes,
    voucherQrCode,
    departureDate,
    departure_date: departureDate,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
  };
}

/**
 * Formats and separates pickup place name and secondary address
 */
export function parsePickupLocation(locationStr?: string | null): { placeName: string; address?: string } {
  if (!locationStr || typeof locationStr !== "string" || locationStr.trim() === "") {
    return { placeName: "Meeting Point Resmi Destinasi" };
  }
  const clean = locationStr.trim();
  const parenMatch = clean.match(/^(.*?)\s*\((.*?)\)$/);
  if (parenMatch) {
    return {
      placeName: parenMatch[1].trim(),
      address: parenMatch[2].trim(),
    };
  }
  const commaIdx = clean.indexOf(",");
  if (commaIdx > 0 && commaIdx < clean.length - 1) {
    return {
      placeName: clean.substring(0, commaIdx).trim(),
      address: clean.substring(commaIdx + 1).trim(),
    };
  }
  return { placeName: clean };
}



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

/**
 * Membersihkan karakter pemisah seperti strip (-), spasi, tanda kurung dari nomor telepon
 * Contoh: "0812-3456-7890" -> "081234567890", "+62 812-3456-7890" -> "+6281234567890"
 */
export function sanitizePhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Menghitung batas tanggal pemesanan paling awal berdasarkan batas waktu cutoff jam 19:00 WIB.
 * - Jika jam saat ini < 19:00 -> tanggal paling awal yang bisa dipesan adalah Besok (H+1).
 * - Jika jam saat ini >= 19:00 -> batas pemesanan H+1 telah ditutup, tanggal paling awal adalah Lusa (H+2).
 */
export function getEarliestBookingDate(now = new Date(), cutoffHour = 19): {
  dateISO: string;
  dateObj: Date;
  isAfterCutoff: boolean;
} {
  const isAfterCutoff = now.getHours() >= cutoffHour;
  const earliestDate = new Date(now);
  earliestDate.setHours(0, 0, 0, 0);

  const daysToAdd = isAfterCutoff ? 2 : 1;
  earliestDate.setDate(earliestDate.getDate() + daysToAdd);

  const year = earliestDate.getFullYear();
  const month = String(earliestDate.getMonth() + 1).padStart(2, "0");
  const day = String(earliestDate.getDate()).padStart(2, "0");
  const dateISO = `${year}-${month}-${day}`;

  return {
    dateISO,
    dateObj: earliestDate,
    isAfterCutoff,
  };
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

export function getDestinationTripCount(dest?: Partial<Destination> | Record<string, unknown> | null): number {
  if (!dest) return 0;
  const anyDest = dest as Record<string, unknown>;

  if (typeof anyDest.tripsCount === "number") return anyDest.tripsCount;
  if (typeof anyDest.totalTrips === "number") return anyDest.totalTrips;
  if (typeof anyDest.tripCount === "number") return anyDest.tripCount;
  if (Array.isArray(anyDest.trips)) return anyDest.trips.length;
  if (Array.isArray(anyDest.activeTrips)) return anyDest.activeTrips.length;
  if (Array.isArray(anyDest.scheduledTrips)) return anyDest.scheduledTrips.length;
  if (anyDest._count && typeof anyDest._count === "object") {
    const countObj = anyDest._count as Record<string, unknown>;
    if (typeof countObj.trips === "number") return countObj.trips;
  }

  return 0;
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

/**
 * Mengecek apakah suatu tanggal perjalanan telah terlewat (H+1 atau sudah selesai).
 * Batas toleransi diatur hingga akhir hari (23:59:59.999).
 */
export function isTripPast(departureDate?: string | null, returnDate?: string | null): boolean {
  const targetDateStr = returnDate || departureDate;
  if (!targetDateStr) return false;
  try {
    const target = new Date(targetDateStr);
    if (isNaN(target.getTime())) return false;
    // Set toleransi ke akhir hari tanggal target (23:59:59.999)
    target.setHours(23, 59, 59, 999);
    const now = new Date();
    return now.getTime() > target.getTime();
  } catch {
    return false;
  }
}

/**
 * Mengembalikan status efektif grup armada berdasarkan tanggal keberangkatan trip.
 * Jika tanggal sudah lampau dan status bukan 'cancelled', otomatis berstatus 'completed'.
 */
export function getEffectiveGroupStatus(
  originalStatus?: GroupStatus | string | null,
  departureDate?: string | null
): GroupStatus {
  const status = (originalStatus || "open") as GroupStatus;
  if (status === "cancelled") return "cancelled";
  if (isTripPast(departureDate)) {
    return "completed";
  }
  return status;
}

/**
 * Mengembalikan status efektif trip berdasarkan tanggal keberangkatan/kepulangan.
 */
export function getEffectiveTripStatus(
  originalStatus?: TripStatus | string | null,
  departureDate?: string | null,
  returnDate?: string | null
): TripStatus {
  const status = (originalStatus || "planning") as TripStatus;
  if (status === "cancelled") return "cancelled";
  if (isTripPast(departureDate, returnDate)) {
    return "completed";
  }
  return status;
}

export function getGroupStatusBadge(status: GroupStatus, departureDate?: string | null): { label: string; className: string } {
  const effectiveStatus = getEffectiveGroupStatus(status, departureDate);
  switch (effectiveStatus) {
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
        label: effectiveStatus,
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
      totalAmount: 0,
      paymentStatus: "pending",
      checkInStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const raw = rawRecord as Record<string, unknown>;
  const user = (raw.user && typeof raw.user === "object") ? (raw.user as Record<string, unknown>) : undefined;
  const customer = (raw.customer && typeof raw.customer === "object") ? (raw.customer as Record<string, unknown>) : undefined;
  const participantObj = (raw.participant && typeof raw.participant === "object") ? (raw.participant as Record<string, unknown>) : undefined;
  const rawGroup = (raw.group || raw.bookingGroup || raw.booking_group) as BookingGroup | undefined;
  const rawTrip = (raw.trip || rawGroup?.trip) as Trip | undefined;
  const rawDest = (raw.destination || rawTrip?.destination) as Destination | undefined;

  const id = String(raw.id || raw.participant_id || raw.participantId || participantObj?.id || `part-${Date.now()}`);
  const bookingCode = String(raw.bookingCode || raw.booking_code || raw.code || participantObj?.bookingCode || participantObj?.booking_code || "TRV-XXXX");
  const fullName = String(
    raw.fullName ||
      raw.full_name ||
      raw.name ||
      user?.fullName ||
      user?.full_name ||
      user?.name ||
      customer?.fullName ||
      customer?.full_name ||
      customer?.name ||
      participantObj?.fullName ||
      participantObj?.full_name ||
      participantObj?.name ||
      "Traveler"
  );
  const email = String(raw.email || user?.email || customer?.email || participantObj?.email || "");
  const phoneNumber = String(
    raw.phoneNumber ||
      raw.phone_number ||
      raw.phone ||
      user?.phoneNumber ||
      user?.phone_number ||
      customer?.phoneNumber ||
      customer?.phone_number ||
      participantObj?.phoneNumber ||
      participantObj?.phone_number ||
      ""
  );
  const nationality = String(raw.nationality || user?.nationality || customer?.nationality || participantObj?.nationality || "Indonesia");
  const fallbackPrice = rawTrip?.pricePerPax ?? getDestinationPrice(rawDest);
  const totalAmount = Number(raw.totalAmount ?? raw.total_amount ?? raw.amount ?? raw.price ?? fallbackPrice);
  const paymentStatus = (raw.paymentStatus || raw.payment_status || "pending") as PaymentStatus;
  const checkInStatus = (raw.checkInStatus || raw.check_in_status || "pending") as CheckInStatus;

  // Tanggal Lahir (DOB) Fallbacks
  const rawDob =
    raw.dateOfBirth ||
    raw.date_of_birth ||
    raw.dob ||
    raw.birthDate ||
    raw.birth_date ||
    raw.birth ||
    raw.tanggalLahir ||
    raw.tanggal_lahir ||
    raw.tglLahir ||
    raw.tgl_lahir ||
    user?.dateOfBirth ||
    user?.date_of_birth ||
    user?.dob ||
    user?.birthDate ||
    user?.birth_date ||
    user?.tanggalLahir ||
    customer?.dateOfBirth ||
    customer?.date_of_birth ||
    customer?.dob ||
    customer?.birthDate ||
    customer?.birth_date ||
    participantObj?.dateOfBirth ||
    participantObj?.date_of_birth ||
    participantObj?.dob;

  const dateOfBirth =
    typeof rawDob === "string" && rawDob.trim() !== ""
      ? rawDob.trim()
      : rawDob instanceof Date
      ? rawDob.toISOString().split("T")[0]
      : undefined;

  // Asuransi (Insurance)
  const rawHasInsurance =
    raw.hasInsurance ??
    raw.has_insurance ??
    raw.insurance ??
    raw.isInsured ??
    raw.is_insured ??
    user?.hasInsurance ??
    user?.has_insurance ??
    customer?.hasInsurance;

  const insuranceFee =
    typeof raw.insuranceFee === "number"
      ? raw.insuranceFee
      : typeof raw.insurance_fee === "number"
      ? raw.insurance_fee
      : undefined;

  const hasInsurance =
    Boolean(dateOfBirth && String(dateOfBirth).trim() !== "" && String(dateOfBirth).trim() !== "-") ||
    rawHasInsurance === true ||
    rawHasInsurance === "true" ||
    rawHasInsurance === 1 ||
    rawHasInsurance === "1" ||
    (typeof insuranceFee === "number" && insuranceFee > 0);

  // Titik Penjemputan (Pickup Location)
  const rawPickup =
    raw.pickupLocation ||
    raw.pickup_location ||
    raw.pickupAddress ||
    raw.pickup_address ||
    raw.pickup ||
    raw.pickupPoint ||
    raw.pickup_point ||
    raw.pickupSpot ||
    raw.pickup_spot ||
    raw.meetingPoint ||
    raw.meeting_point ||
    raw.titikJemput ||
    raw.titik_jemput ||
    raw.lokasiPenjemputan ||
    raw.lokasi_penjemputan ||
    raw.lokasiJemput ||
    raw.lokasi_jemput ||
    user?.pickupLocation ||
    user?.pickup_location ||
    user?.pickupAddress ||
    customer?.pickupLocation ||
    customer?.pickup_location ||
    participantObj?.pickupLocation ||
    participantObj?.pickup_location ||
    rawDest?.meetingPoint;

  const pickupLocation = typeof rawPickup === "string" && rawPickup.trim() !== "" ? rawPickup.trim() : undefined;

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

  // Catatan Penjemputan (Pickup Notes)
  const rawPickupNotes =
    raw.pickupNotes ||
    raw.pickup_notes ||
    raw.pickupNote ||
    raw.pickup_note ||
    raw.catatanJemput ||
    raw.catatan_jemput ||
    raw.catatanPenjemputan ||
    raw.catatan_penjemputan;

  const pickupNotes = typeof rawPickupNotes === "string" && rawPickupNotes.trim() !== "" ? rawPickupNotes.trim() : undefined;

  // Catatan Kesehatan / Medis (Health Notes)
  const rawHealth =
    raw.healthNotes ||
    raw.health_notes ||
    raw.medicalNotes ||
    raw.medical_notes ||
    raw.catatanKesehatan ||
    raw.catatan_kesehatan ||
    raw.riwayatPenyakit ||
    raw.riwayat_penyakit ||
    (typeof raw.notes === "string" && /alergi|sakit|asma|hamil|medis|diet/i.test(raw.notes) ? raw.notes : undefined);

  const healthNotes = typeof rawHealth === "string" && rawHealth.trim() !== "" ? rawHealth.trim() : undefined;

  // Kontak Darurat (Emergency Contact)
  let emergencyContact: Participant["emergencyContact"] = undefined;
  const rawEmerg = (raw.emergencyContact || raw.emergency_contact || raw.emergency || user?.emergencyContact || user?.emergency_contact) as Record<string, unknown> | undefined;

  if (rawEmerg && typeof rawEmerg === "object") {
    emergencyContact = {
      name: String(rawEmerg.name || rawEmerg.fullName || rawEmerg.full_name || rawEmerg.nama || ""),
      relationship: String(rawEmerg.relationship || rawEmerg.relation || rawEmerg.hubungan || "Kerabat"),
      phone: String(rawEmerg.phone || rawEmerg.phoneNumber || rawEmerg.phone_number || rawEmerg.noHp || rawEmerg.no_hp || ""),
    };
  } else {
    const emergName = String(
      raw.emergencyName ||
        raw.emergency_name ||
        raw.emergencyContactName ||
        raw.emergency_contact_name ||
        raw.namaKontakDarurat ||
        raw.nama_kontak_darurat ||
        ""
    );
    const emergPhone = String(
      raw.emergencyPhone ||
        raw.emergency_phone ||
        raw.emergencyContactPhone ||
        raw.emergency_contact_phone ||
        raw.noKontakDarurat ||
        raw.no_kontak_darurat ||
        raw.teleponKontakDarurat ||
        ""
    );
    const emergRel = String(
      raw.emergencyRelationship ||
        raw.emergency_relationship ||
        raw.emergencyRelation ||
        raw.emergency_relation ||
        raw.hubunganKontakDarurat ||
        raw.hubungan_kontak_darurat ||
        "Kerabat"
    );
    if (emergName || emergPhone) {
      emergencyContact = {
        name: emergName,
        phone: emergPhone,
        relationship: emergRel,
      };
    }
  }

  // Identitas / NIK / Paspor
  const rawIdNum =
    raw.identityNumber ||
    raw.identity_number ||
    raw.nik ||
    raw.idNumber ||
    raw.id_number ||
    raw.ktp ||
    raw.noKtp ||
    raw.no_ktp ||
    raw.passport ||
    raw.passportNumber ||
    raw.passport_number ||
    user?.identityNumber ||
    user?.identity_number ||
    user?.nik;
  const identityNumber = typeof rawIdNum === "string" && rawIdNum.trim() !== "" ? rawIdNum.trim() : typeof rawIdNum === "number" ? String(rawIdNum) : undefined;

  // Jenis Kelamin (Gender)
  const rawGender = String(raw.gender || raw.jenisKelamin || raw.jenis_kelamin || raw.sex || user?.gender || "").toLowerCase();
  const gender: Participant["gender"] =
    rawGender === "male" || rawGender === "laki-laki" || rawGender === "l" || rawGender === "pria"
      ? "male"
      : rawGender === "female" || rawGender === "perempuan" || rawGender === "p" || rawGender === "wanita"
      ? "female"
      : rawGender === "other"
      ? "other"
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
    booking_code: bookingCode,
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
    nationality,
    identityNumber,
    identity_number: identityNumber,
    dateOfBirth,
    date_of_birth: dateOfBirth,
    gender,
    roomPreference: typeof raw.roomPreference === "string" ? raw.roomPreference : typeof raw.room_preference === "string" ? raw.room_preference : undefined,
    room_preference: typeof raw.roomPreference === "string" ? raw.roomPreference : typeof raw.room_preference === "string" ? raw.room_preference : undefined,
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
    emergencyContact,
    hasInsurance,
    has_insurance: hasInsurance,
    insuranceFee,
    insurance_fee: insuranceFee,
    totalAmount,
    total_amount: totalAmount,
    paymentStatus,
    payment_status: paymentStatus,
    checkInStatus,
    check_in_status: checkInStatus,
    voucherQrCode,
    voucher_qr_code: voucherQrCode,
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

export interface DriverFormValidationInput {
  fullName: string;
  phoneNumber: string;
  email?: string;
  licenseNumber: string;
  experienceYears?: number;
}

/**
 * Validasi ketat untuk form input Driver (Nama, WhatsApp, SIM, Email, Pengalaman)
 */
export function validateDriverForm(input: DriverFormValidationInput): {
  isValid: boolean;
  errors: Record<string, string>;
  firstErrorMessage: string | null;
} {
  const errors: Record<string, string> = {};

  // 1. Nama Lengkap
  if (!input.fullName || input.fullName.trim().length === 0) {
    errors.fullName = "Nama lengkap pengemudi wajib diisi.";
  } else if (input.fullName.trim().length < 3) {
    errors.fullName = "Nama lengkap pengemudi minimal 3 karakter.";
  }

  // 2. Nomor WhatsApp / Telepon
  const rawPhone = input.phoneNumber || "";
  const cleanedPhone = rawPhone.replace(/[\s\-()]/g, "");
  if (!rawPhone || rawPhone.trim().length === 0) {
    errors.phoneNumber = "Nomor WhatsApp driver wajib diisi.";
  } else {
    const phoneRegex = /^(\+?[0-9]{9,15})$/;
    if (!phoneRegex.test(cleanedPhone) || cleanedPhone.replace(/\D/g, "").length < 9) {
      errors.phoneNumber =
        "Nomor WhatsApp tidak valid. Masukkan nomor telepon valid 9–15 digit (contoh: 08123456789 atau +628123456789).";
    }
  }

  // 3. Email (Opsional, tapi jika diisi harus valid)
  if (input.email && input.email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email.trim())) {
      errors.email = "Format email tidak valid (contoh: driver@tripsharing.local).";
    }
  }

  // 4. Nomor Lisensi SIM
  if (!input.licenseNumber || input.licenseNumber.trim().length === 0) {
    errors.licenseNumber = "Nomor lisensi SIM wajib diisi.";
  } else if (input.licenseNumber.trim().length < 5) {
    errors.licenseNumber = "Nomor SIM tidak valid. Minimal 5 karakter alfanumerik (contoh: SIM-A-99218201).";
  }

  // 5. Pengalaman Mengemudi
  if (input.experienceYears !== undefined && (isNaN(input.experienceYears) || input.experienceYears < 0)) {
    errors.experienceYears = "Pengalaman mengemudi minimal 0 tahun.";
  }

  const errorKeys = Object.keys(errors);
  const isValid = errorKeys.length === 0;
  const firstErrorMessage = isValid ? null : errors[errorKeys[0]];

  return {
    isValid,
    errors,
    firstErrorMessage,
  };
}

/**
 * Mengekstrak rincian field error dari response ApiError backend
 */
export function extractApiErrorDetails(err: unknown): {
  message: string;
  fieldErrors: Record<string, string>;
} {
  let message = "Terjadi kesalahan saat memproses data.";
  const fieldErrors: Record<string, string> = {};

  if (!err) return { message, fieldErrors };

  if (err instanceof Error) {
    message = err.message || message;
  }

  const errObj = err as Record<string, unknown>;
  const rawErrors = errObj.errors || errObj.details;

  if (Array.isArray(rawErrors)) {
    for (const item of rawErrors) {
      if (typeof item === "string") {
        message += ` ${item}`;
      } else if (typeof item === "object" && item !== null) {
        const fieldName = String(
          (item as Record<string, unknown>).field ||
          (item as Record<string, unknown>).path ||
          (item as Record<string, unknown>).param ||
          ""
        );
        const itemMsg = String(
          (item as Record<string, unknown>).message ||
          (item as Record<string, unknown>).msg ||
          ""
        );
        if (fieldName && itemMsg) {
          fieldErrors[fieldName] = itemMsg;
        }
      }
    }
  } else if (typeof rawErrors === "object" && rawErrors !== null) {
    for (const [k, v] of Object.entries(rawErrors as Record<string, unknown>)) {
      if (typeof v === "string") {
        fieldErrors[k] = v;
      } else if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") {
        fieldErrors[k] = v[0];
      }
    }
  }

  // Perbaiki pesan umum jika bertuliskan "Validation failed"
  if (message.toLowerCase().includes("validation failed")) {
    const errorCount = Object.keys(fieldErrors).length;
    if (errorCount > 0) {
      const fieldList = Object.keys(fieldErrors)
        .map((f) => {
          if (f === "phoneNumber" || f === "phone") return "Nomor WhatsApp";
          if (f === "licenseNumber") return "Nomor Lisensi SIM";
          if (f === "fullName" || f === "name") return "Nama Pengemudi";
          if (f === "email") return "Email";
          if (f === "experienceYears") return "Pengalaman Mengemudi";
          return f;
        })
        .join(", ");
      message = `Validasi gagal: Harap periksa kembali kolom (${fieldList}).`;
    } else {
      message = "Validasi data gagal: Harap periksa format nomor telepon (minimal 9 digit), nomor SIM (minimal 5 digit), dan kolom lainnya.";
    }
  }

  return { message, fieldErrors };
}



import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PaymentStatus, GroupStatus, Destination, TripStatus } from "@/src/types";

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


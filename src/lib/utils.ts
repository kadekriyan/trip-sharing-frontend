import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PaymentStatus, GroupStatus } from "@/src/types";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
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

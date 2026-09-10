"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Users,
  MapPin,
  Car,
  Phone,
  Ticket,
  Search,
  User as UserIcon,
  LogIn,
  Mail,
  ShieldCheck,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/src/components/ui/dialog";
import { bookingService } from "@/src/services/booking.service";
import { useAuth } from "@/src/context/auth-context";
import {
  formatCurrency,
  formatDate,
  getPaymentBadge,
  getDestinationTitle,
  parsePickupLocation,
} from "@/src/lib/utils";
import { printTicketVoucher } from "@/src/lib/ticket-printer";
import type { Participant } from "@/src/types";

function MyBookingsContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams?.get("bookingCode") || searchParams?.get("code") || "";

  const { user, isAuthenticated, isHydrated } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "pending">("all");
  const [bookings, setBookings] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Participant | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const handleSimulatePayment = async (participantId: string) => {
    setSimulatingId(participantId);
    try {
      const res = await bookingService.simulatePayment(participantId, "settle");
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === participantId ? { ...b, paymentStatus: "paid" } : b))
        );
      }
    } catch {
      // Silently handled
    } finally {
      setSimulatingId(null);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setIsLoading(true);
      try {
        const data = await bookingService.getMyBookings();
        if (isMounted) {
          setBookings(data);
          if (initialCode) {
            const matched = data.find(
              (b) => b.bookingCode?.toLowerCase() === initialCode.toLowerCase()
            );
            if (matched) {
              setSelectedVoucher(matched);
            }
          }
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, [initialCode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await bookingService.getMyBookings({
        bookingCode: searchQuery || undefined,
      });
      setBookings(data);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = Array.isArray(bookings)
    ? bookings.filter((b) => {
        if (!b) return false;
        if (activeTab === "paid" && b.paymentStatus !== "paid") return false;
        if (activeTab === "pending" && b.paymentStatus !== "pending") return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const code = (b.bookingCode || "").toLowerCase();
          const name = (b.fullName || "").toLowerCase();
          if (!code.includes(query) && !name.includes(query)) {
            return false;
          }
        }
        return true;
      })
    : [];

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#00677d] block mb-1">
              Tiket & Riwayat Perjalanan
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
              Booking Perjalanan Saya
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pantau status grup mobil 6 pax, jadwal penjemputan, kontak driver, dan e-voucher resmi Anda.
            </p>
          </div>

          {/* Quick Booking Search Form */}
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari Kode: TRV-XXXX..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-white border-slate-200 w-56"
              />
            </div>
            <Button type="submit" size="sm" className="h-9 font-bold">
              Cari
            </Button>
          </form>
        </div>

        {/* Guest Warning if not logged in */}
        {isHydrated && !isAuthenticated && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-amber-900">
              <span className="font-bold block">Anda belum masuk ke akun traveler.</span>
              <span>Masuk sekarang untuk melihat seluruh riwayat tiket otomatis, atau cari tiket via kode booking di atas.</span>
            </div>
            <Button asChild size="sm" className="gap-1.5 shrink-0">
              <Link href="/login?redirect=/bookings">
                <LogIn className="h-3.5 w-3.5" />
                Masuk ke Akun
              </Link>
            </Button>
          </div>
        )}

        {/* Main Grid: Left Bookings List + Right Profile Widget */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: BOOKINGS STREAM & TABS */}
          <div className="lg:col-span-8 space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua Tiket ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab("paid")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "paid"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Trip Lunas ({bookings.filter((p) => p.paymentStatus === "paid").length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "pending"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Menunggu Pembayaran ({bookings.filter((p) => p.paymentStatus === "pending").length})
              </button>
            </div>

            {/* Loading & Empty State */}
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <Ticket className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="font-heading font-bold text-base text-slate-700">Belum Ada Riwayat Pemesanan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Belum ada tiket perjalanan yang terdaftar pada sesi ini. Mulai eksplorasi destinasi dan buat booking pertama Anda.
                </p>
                <Button asChild className="mt-2" size="sm">
                  <Link href="/destinations">Jelajahi Destinasi Sekarang</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredBookings.map((booking) => {
                  const destTitle =
                    getDestinationTitle(booking.destination) !== "Paket Wisata"
                      ? getDestinationTitle(booking.destination)
                      : getDestinationTitle(booking.trip?.destination);
                  const destCover =
                    booking.destination?.coverImage ||
                    booking.trip?.destination?.coverImage ||
                    "/images/dest-bromo.jpg";
                  const destLocation =
                    booking.destination?.location ||
                    booking.trip?.destination?.location ||
                    "Indonesia";
                  const destSlug =
                    booking.destination?.slug ||
                    booking.trip?.destination?.slug ||
                    "";
                  const driver = booking.group?.driver;
                  const statusBadge = getPaymentBadge(booking.paymentStatus);

                  return (
                    <Card
                      key={booking.id}
                      className="overflow-hidden border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12">
                        {/* Image Preview */}
                        <div className="relative md:col-span-4 h-48 md:h-auto min-h-[180px]">
                          <Image
                            src={destCover}
                            alt={destTitle}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${statusBadge.className}`}
                            >
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>

                        {/* Details Content */}
                        <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[11px] font-mono font-bold text-slate-400 block">
                                  Kode: {booking.bookingCode}
                                </span>
                                <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                                  {destTitle}
                                </h3>
                              </div>
                              <span className="font-heading font-extrabold text-[#a43c12] text-base">
                                {formatCurrency(booking.totalAmount)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs text-slate-600">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-[#00677d]" />
                                <span className="font-semibold text-slate-800">
                                  {formatDate(booking.departureDate || booking.trip?.departureDate || booking.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-[#00677d]" />
                                <span>
                                  Grup #{booking.group?.groupNumber || 1} (
                                  {booking.group?.currentParticipants || 1}/6 Terisi)
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                                <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                                <span className="truncate">{destLocation}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pickup Location Info (if specified) */}
                          {booking.pickupLocation && (() => {
                            const parsed = parsePickupLocation(booking.pickupLocation);
                            return (
                              <div className="rounded-xl bg-teal-50/60 p-3 text-xs text-slate-700 flex items-start gap-2.5 border border-teal-100/80">
                                <MapPin className="h-4 w-4 text-[#00677d] shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-bold text-[#00677d] block text-[11px] uppercase tracking-wider">
                                    Lokasi Penjemputan:
                                  </span>
                                  <span className="font-heading font-extrabold text-slate-800 text-xs block">
                                    {parsed.placeName}
                                  </span>
                                  {parsed.address && (
                                    <span className="text-slate-600 text-[11px] block mt-0.5">
                                      {parsed.address}
                                    </span>
                                  )}
                                  {booking.pickupNotes && (
                                    <span className="text-slate-500 italic block text-[10px] mt-1 bg-white/70 p-1.5 rounded-lg border border-teal-100">
                                      Catatan: {booking.pickupNotes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Driver & Armada Info Bar (if assigned) */}
                          {driver ? (
                            <div className="rounded-xl bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-100">
                              <div className="flex items-center gap-2.5">
                                <Car className="h-4 w-4 text-[#00677d]" />
                                <div>
                                  <span className="font-bold text-slate-700 block">
                                    {driver.vehicleModel} ({driver.plateNumber})
                                  </span>
                                  <span className="text-slate-500 text-[11px]">
                                    Driver: {driver.fullName}
                                  </span>
                                </div>
                              </div>
                              {driver.phoneNumber && (
                                <a
                                  href={`https://wa.me/${driver.phoneNumber.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3" />
                                  WhatsApp Driver
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-500 flex items-center gap-2">
                              <Car className="h-4 w-4 text-slate-400" />
                              <span>Driver & armada akan diumumkan H-1 sebelum keberangkatan.</span>
                            </div>
                          )}

                          {/* Data Identitas Penumpang Box */}
                          <div className="rounded-xl bg-slate-50/80 p-3.5 text-xs text-slate-700 border border-slate-200/80 space-y-2">
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                              <span className="font-bold text-[#00677d] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5 text-[#00677d]" />
                                Data Identitas Penumpang
                              </span>
                              {booking.hasInsurance && (
                                <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  Termasuk Asuransi
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px] min-w-[70px]">Nama:</span>
                                <strong className="text-slate-800">{booking.fullName || "Guest Traveler"}</strong>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px] min-w-[70px]">NIK:</span>
                                <span className="font-mono font-bold text-slate-700">
                                  {booking.identityNumber && booking.identityNumber !== "-" ? booking.identityNumber : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px] min-w-[70px]">No. Telepon:</span>
                                <span className="text-slate-700 flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                                  {booking.phoneNumber || "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-[11px] min-w-[70px]">Email:</span>
                                <span className="text-slate-700 flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{booking.email || "—"}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                            <div className="text-xs text-slate-500">
                              <span>Total Biaya: <strong className="text-slate-800 font-heading font-extrabold">{formatCurrency(booking.totalAmount)}</strong></span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {booking.paymentStatus === "pending" ? (
                                <>
                                  <Button asChild size="sm" className="bg-[#ff7f50] text-white">
                                    <Link href={`/destinations/${destSlug || "bromo-sunrise-safari"}`}>
                                      Bayar Sekarang ({formatCurrency(booking.totalAmount)})
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={simulatingId === booking.id}
                                    onClick={() => handleSimulatePayment(booking.id)}
                                    className="text-[11px] font-semibold border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    title="Simulasi pembayaran langsung tanpa gateway Midtrans (Sandbox/Dev)"
                                  >
                                    {simulatingId === booking.id ? "Memproses..." : "⚡ Simulasi Lunas (Dev)"}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-slate-700 hover:text-[#00677d]"
                                  >
                                    <Link href={`/bookings/${encodeURIComponent(booking.bookingCode || booking.id)}/invoice`}>
                                      <FileText className="h-3.5 w-3.5 text-[#00677d]" />
                                      Faktur Resmi
                                    </Link>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedVoucher(booking)}
                                    className="gap-1.5"
                                  >
                                    <Ticket className="h-3.5 w-3.5 text-[#00677d]" />
                                    Lihat E-Voucher
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: TRAVELER PROFILE & STATS SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white text-center space-y-4">
              {isHydrated && isAuthenticated ? (
                <>
                  <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-[#00677d] to-[#00a3c4] text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-md">
                    {user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : <UserIcon className="h-8 w-8" />}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                      {user?.fullName || "Traveler Member"}
                    </h3>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <Badge variant="azure" className="mt-2 text-[10px]">
                      {user?.role === "admin" ? "Staff Administrator" : "Verified Traveler Member"}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-20 w-20 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <UserIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                      Guest Traveler
                    </h3>
                    <p className="text-xs text-slate-500">Belum Login</p>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#00677d] block">
                    {bookings.filter((b) => b.paymentStatus === "paid").length}
                  </span>
                  <span className="text-[10px] text-slate-500">Trip Selesai</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#ff7f50] block">
                    ⭐ 5.0
                  </span>
                  <span className="text-[10px] text-slate-500">Traveler Rating</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* DIGITAL E-VOUCHER DIALOG */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white print-voucher-card">
          {selectedVoucher && (
            <div>
              <div className="bg-[#00677d] p-6 text-white text-center space-y-1">
                <Badge variant="secondary" className="text-[10px] font-bold uppercase mb-2">
                  Official E-Voucher
                </Badge>
                <h3 className="font-heading font-extrabold text-xl">
                  {getDestinationTitle(selectedVoucher.destination) !== "Paket Wisata"
                    ? getDestinationTitle(selectedVoucher.destination)
                    : getDestinationTitle(selectedVoucher.trip?.destination) || "Trip Sharing Platform"}
                </h3>
                <p className="text-xs text-slate-100">
                  Tunjukkan kode QR ini kepada Driver saat penjemputan.
                </p>
              </div>

              <div className="p-6 space-y-5 text-center">
                {/* QR Code */}
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block">
                  <div className="relative h-36 w-36 mx-auto bg-white p-2 rounded-xl shadow-sm">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedVoucher.bookingCode}`}
                      alt="Booking QR Code"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                  <span className="font-mono font-bold text-sm text-[#00677d] mt-2 block tracking-widest">
                    {selectedVoucher.bookingCode}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Penumpang:</span>
                    <span className="font-bold text-slate-800">{selectedVoucher.fullName || "Traveler"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nomor Identitas (NIK):</span>
                    <span className="font-mono font-medium text-slate-800">
                      {selectedVoucher.identityNumber && selectedVoucher.identityNumber !== "-"
                        ? selectedVoucher.identityNumber
                        : "-"}
                    </span>
                  </div>
                  {selectedVoucher.phoneNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Telepon / WA:</span>
                      <span className="font-medium text-slate-800">{selectedVoucher.phoneNumber}</span>
                    </div>
                  )}
                  {selectedVoucher.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email Penumpang:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[210px] text-right">{selectedVoucher.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal Trip:</span>
                    <span className="font-bold text-[#00677d]">
                      {formatDate(selectedVoucher.departureDate || selectedVoucher.trip?.departureDate || selectedVoucher.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className="font-bold text-emerald-600 uppercase">Lunas (Paid)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Grup Mobil:</span>
                    <span className="font-bold text-[#00677d]">
                      Grup #{selectedVoucher.group?.groupNumber || 1} (Maks 6 Pax)
                    </span>
                  </div>
                  {selectedVoucher.pickupLocation && (() => {
                    const parsed = parsePickupLocation(selectedVoucher.pickupLocation);
                    return (
                      <div className="border-t border-slate-200 pt-2 text-left space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-slate-500 text-xs">Lokasi Jemput:</span>
                          <span className="font-heading font-extrabold text-[#00677d] text-xs text-right ml-2 max-w-[210px]">
                            {parsed.placeName}
                          </span>
                        </div>
                        {parsed.address && (
                          <div className="text-[11px] text-slate-500 text-right">
                            {parsed.address}
                          </div>
                        )}
                        {selectedVoucher.pickupNotes && (
                          <div className="text-[10px] text-slate-400 italic text-right">
                            Catatan: {selectedVoucher.pickupNotes}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {selectedVoucher.group?.driver && (
                    <div className="flex justify-between border-t border-slate-200 pt-1.5">
                      <span className="text-slate-500">Armada & Driver:</span>
                      <span className="font-semibold text-slate-800">
                        {selectedVoucher.group.driver.fullName} ({selectedVoucher.group.driver.vehicleModel})
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 no-print space-y-2">
                  <Button
                    onClick={() => {
                      const destTitle =
                        getDestinationTitle(selectedVoucher.destination) !== "Paket Wisata"
                          ? getDestinationTitle(selectedVoucher.destination)
                          : getDestinationTitle(selectedVoucher.trip?.destination) || "Trip Sharing Platform";
                      printTicketVoucher({
                        bookingCode: selectedVoucher.bookingCode,
                        destinationTitle: destTitle,
                        fullName: selectedVoucher.fullName || "Traveler",
                        email: selectedVoucher.email,
                        phoneNumber: selectedVoucher.phoneNumber,
                        identityNumber: selectedVoucher.identityNumber || "-",
                        groupNumber: selectedVoucher.group?.groupNumber || 1,
                        driverName: selectedVoucher.group?.driver?.fullName,
                        vehicleModel: selectedVoucher.group?.driver?.vehicleModel,
                        plateNumber: selectedVoucher.group?.driver?.plateNumber,
                        departureDate: formatDate(selectedVoucher.departureDate || selectedVoucher.trip?.departureDate || selectedVoucher.createdAt),
                        pickupLocation: selectedVoucher.pickupLocation,
                        pickupNotes: selectedVoucher.pickupNotes,
                      });
                    }}
                    className="w-full justify-center text-xs font-bold"
                  >
                    Cetak / Simpan E-Voucher (PDF)
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-center text-xs font-semibold gap-1.5 text-[#00677d] border-teal-200 hover:bg-teal-50"
                  >
                    <Link href={`/bookings/${encodeURIComponent(selectedVoucher.bookingCode || selectedVoucher.id)}/invoice`}>
                      <FileText className="h-3.5 w-3.5" />
                      Lihat Faktur Resmi (Invoice)
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00677d] border-t-transparent mx-auto" />
            <p className="text-xs text-slate-500">Memuat tiket & e-voucher...</p>
          </div>
        </div>
      }
    >
      <MyBookingsContent />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  AlertCircle,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { destinationService } from "@/src/services/destination.service";
import { bookingService } from "@/src/services/booking.service";
import { formatCurrency, formatDuration, calculateOccupancyPercent, getDestinationTitle, getDestinationPrice } from "@/src/lib/utils";
import type { Destination, BookingGroup } from "@/src/types";

interface DestinationDetailClientProps {
  initialDestination: Destination | null;
  slug: string;
}

export function DestinationDetailClient({ initialDestination, slug }: DestinationDetailClientProps) {
  const router = useRouter();

  const [destination] = useState<Destination | null>(initialDestination);
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [roomPref, setRoomPref] = useState<"shared" | "single" | "none">("shared");
  const [healthNotes, setHealthNotes] = useState("");
  const [hasInsurance, setHasInsurance] = useState(true);

  // Midtrans Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bca_va" | "mandiri_va" | "credit_card">("qris");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdParticipantId, setCreatedParticipantId] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadAvailability() {
      if (!initialDestination?.id) {
        setIsLoadingAvailability(false);
        return;
      }

      try {
        const availGroups = await destinationService.getTripAvailability(initialDestination.id);
        if (isMounted) {
          setGroups(availGroups || []);
          const openGroup = availGroups?.find((g) => g.status === "open" && g.currentParticipants < 6);
          if (openGroup) {
            setSelectedGroup(openGroup.id);
          } else if (availGroups && availGroups.length > 0) {
            setSelectedGroup(availGroups[0].id);
          }
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoadingAvailability(false);
      }
    }

    loadAvailability();
    return () => {
      isMounted = false;
    };
  }, [initialDestination]);

  if (!destination) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <PackageOpen className="h-16 w-16 text-slate-300 mx-auto" />
        <h1 className="font-heading text-2xl font-bold text-slate-800">
          Paket Wisata Tidak Ditemukan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Destinasi dengan tautan <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">{slug}</code> tidak tersedia atau telah dinonaktifkan.
        </p>
        <Button asChild className="gap-2">
          <Link href="/destinations">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog Destinasi
          </Link>
        </Button>
      </div>
    );
  }

  const basePrice = getDestinationPrice(destination);
  const insuranceFee = hasInsurance ? 50000 : 0;
  const roomSurcharge = roomPref === "single" ? 350000 : 0;
  const totalAmount = basePrice + insuranceFee + roomSurcharge;

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !phoneNumber || !identityNumber) {
      setErrorMessage("Mohon lengkapi semua data diri wajib (*) sebelum melanjutkan.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tripId: destination.id,
        destinationId: destination.id,
        bookingGroupId: selectedGroup || undefined,
        fullName,
        email,
        phoneNumber,
        identityNumber,
        nationality,
        roomPreference: roomPref,
        hasInsurance,
        healthNotes: healthNotes || undefined,
        captchaToken: "mock-captcha-token-verified-pass",
      };

      const result = await bookingService.createBooking(payload);

      setCreatedParticipantId(result.participant.id);
      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Gagal memproses pemesanan tiket.";
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      if (createdParticipantId) {
        await bookingService.simulatePaymentSettlement(createdParticipantId);
      }
      setIsPaymentModalOpen(false);
      router.push(`/bookings?status=success&code=${destination.slug || destination.id}`);
    } catch {
      setIsPaymentModalOpen(false);
      router.push("/bookings");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const inclusions = destination.inclusions || destination.includedFacilities || [];
  const exclusions = destination.exclusions || destination.excludedFacilities || [];

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Header Banner */}
      <div className="relative h-[45vh] min-h-[340px] max-h-[480px] w-full bg-slate-900">
        <Image
          src={destination.coverImage || destination.image || destination.imageUrl || "/images/dest-bromo.jpg"}
          alt={getDestinationTitle(destination)}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191c1e] via-black/40 to-black/30" />

        <div className="absolute inset-0 flex flex-col justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="self-start text-white hover:bg-white/20 gap-2 text-xs backdrop-blur-md"
          >
            <Link href="/destinations">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Katalog
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="coral" className="text-xs font-bold px-3 py-1 shadow-md">
                Trip Sharing Maks 6 Pax
              </Badge>
              {destination.category && (
                <Badge variant="secondary" className="text-xs font-bold bg-white/95 text-slate-800 shadow-md">
                  {destination.category}
                </Badge>
              )}
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              {getDestinationTitle(destination)}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-200 pt-1">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="h-4 w-4 text-[#ff7f50]" />
                {destination.location || "Indonesia"}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-4 w-4 text-[#00a3c4]" />
                {formatDuration(destination.durationDays || 2, destination.durationNights || 1)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-amber-300">
                ⭐ {destination.rating || 5.0} Rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: ITINERARY & FACILITY DETAILS (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-6">
              <div className="space-y-3">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#191c1e]">
                  Tentang Perjalanan Ini
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                  {destination.description}
                </p>
              </div>

              {/* USP Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                <div className="p-3.5 rounded-2xl bg-[#00677d]/5 border border-[#00677d]/10 text-center">
                  <Users className="h-5 w-5 text-[#00677d] mx-auto mb-1.5" />
                  <span className="font-heading font-bold text-xs text-[#00677d] block">Maksimal 6 Pax</span>
                  <span className="text-[10px] text-slate-500">Mobil tidak berdesakan</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#ff7f50]/5 border border-[#ff7f50]/10 text-center">
                  <Sparkles className="h-5 w-5 text-[#ff7f50] mx-auto mb-1.5" />
                  <span className="font-heading font-bold text-xs text-[#ff7f50] block">Biaya Patungan</span>
                  <span className="text-[10px] text-slate-500">Hemat hingga 60%</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                  <span className="font-heading font-bold text-xs text-emerald-600 block">Garansi Jalan</span>
                  <span className="text-[10px] text-slate-500">1 Orang pun berangkat</span>
                </div>
              </div>

              {/* Included / Excluded List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Fasilitas Termasuk
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {inclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" />
                    Tidak Termasuk
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {exclusions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Daily Itinerary Section */}
            {destination.itinerary && destination.itinerary.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-6">
                <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#191c1e]">
                  Rencana Perjalanan (Itinerary)
                </h2>

                <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {destination.itinerary.map((itin, idx) => (
                    <div key={idx} className="relative flex items-start gap-4">
                      <div className="h-7 w-7 rounded-full bg-[#00677d] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md ring-4 ring-white z-10">
                        {itin.day}
                      </div>

                      <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-heading font-bold text-sm text-[#191c1e]">
                            {itin.title}
                          </h4>
                          <span className="text-[11px] font-bold text-[#00677d] bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            Hari {itin.day}
                          </span>
                        </div>

                        <ul className="space-y-1.5 text-xs text-slate-600">
                          {itin.activities?.map((act, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-2">
                              <span className="text-[#ff7f50] font-bold">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: AUTO-GROUPING & BOOKING FORM (5 Cols) */}
          <div className="lg:col-span-5 space-y-6 sticky top-24">
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-6">
              {/* Price Header */}
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-500 block">Biaya Per Orang (Sharing):</span>
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#a43c12]">
                    {formatCurrency(basePrice)}
                  </span>
                </div>
                <Badge variant="coral" className="text-xs font-bold">
                  All-in Package
                </Badge>
              </div>

              {/* Group Availability Visualizer */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Pilih Grup Mobil (Maksimal 6 Orang)
                </label>

                {isLoadingAvailability ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center space-x-2 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00677d]" />
                    <span>Memuat ketersediaan slot grup...</span>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    Grup mobil baru akan dibuat otomatis saat pemesanan pertama.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {groups.map((grp) => {
                      const maxCap = grp.capacity || 6;
                      const isFull = grp.currentParticipants >= maxCap;
                      const isSelected = selectedGroup === grp.id;
                      const occupancy = calculateOccupancyPercent(grp.currentParticipants, maxCap);

                      return (
                        <div
                          key={grp.id}
                          onClick={() => !isFull && setSelectedGroup(grp.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#00677d] bg-[#00677d]/5 ring-2 ring-[#00677d]/20 shadow-sm"
                              : isFull
                              ? "border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#191c1e] flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-[#00677d]" />
                              {grp.name || `Grup Mobil #${grp.groupNumber}`}
                            </span>
                            <span className={isFull ? "text-rose-600" : "text-[#00677d]"}>
                              {grp.currentParticipants} / {maxCap} Kursi
                              {isFull ? " (Penuh)" : ` (Sisa ${maxCap - grp.currentParticipants})`}
                            </span>
                          </div>

                          <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full ${
                                isFull ? "bg-rose-500" : "bg-gradient-to-r from-[#00677d] to-[#ff7f50]"
                              }`}
                              style={{ width: `${occupancy}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Nama Lengkap Pemesan *
                  </label>
                  <Input
                    required
                    placeholder="Sesuai KTP / Paspor"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Email *
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="rian@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      No. WhatsApp *
                    </label>
                    <Input
                      required
                      placeholder="081234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Nomor Identitas (NIK / Paspor) *
                  </label>
                  <Input
                    required
                    placeholder="Untuk manifes perjalanan resmi"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="nationality-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Kewarganegaraan
                  </label>
                  <select
                    id="nationality-select"
                    aria-label="Pilih kewarganegaraan pemesan"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                  >
                    <option value="Indonesia">Indonesia (WNI)</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Lainnya (WNA)</option>
                  </select>
                </div>

                {/* Preference Options */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Preferensi Kamar
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRoomPref("shared")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        roomPref === "shared"
                          ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d] font-bold"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Sharing Room (Gratis)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoomPref("single")}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                        roomPref === "single"
                          ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d] font-bold"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      Private Room (+350rb)
                    </button>
                  </div>
                </div>

                {/* Insurance Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={(e) => setHasInsurance(e.target.checked)}
                    className="accent-[#00677d] h-4 w-4 mt-0.5 rounded"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Asuransi Perjalanan (+Rp 50.000)</span>
                    <span className="text-[11px] text-slate-500">Perlindungan medis dan evakuasi darurat selama trip.</span>
                  </div>
                </label>

                {/* Health & Special Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Catatan Khusus / Riwayat Kesehatan (Opsional)
                  </label>
                  <Input
                    placeholder="Misal: Alergi makanan, asma, dsb."
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                {/* Price Breakdown Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Tiket Trip Sharing:</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  {hasInsurance && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Asuransi Medis:</span>
                      <span>+Rp 50.000</span>
                    </div>
                  )}
                  {roomPref === "single" && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Surcharge Private Room:</span>
                      <span>+Rp 350.000</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#191c1e] pt-2 border-t border-slate-200">
                    <span>Total Tagihan:</span>
                    <span className="font-heading font-extrabold text-[#a43c12]">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center font-bold text-sm shadow-md"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Memproses Data..." : "Lanjut ke Pembayaran"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MIDTRANS SNAP PAYMENT SIMULATION MODAL */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <div className="bg-[#00677d] p-5 text-white">
            <Badge variant="coral" className="text-[10px] font-bold uppercase mb-1">
              Midtrans Payment Gateway
            </Badge>
            <DialogTitle className="font-heading font-extrabold text-xl text-white">
              Selesaikan Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-100">
              Pilih metode transaksi instan dan aman untuk mengunci kursi Anda.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Tagihan:</span>
                <span className="font-heading font-extrabold text-xl text-[#00677d]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                1 Pax (VIP)
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Metode Pembayaran
              </label>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "qris"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <QrCode className="h-4 w-4 text-[#00677d]" />
                    <span>QRIS (GoPay, OVO, ShopeePay, Dana, BCA)</span>
                  </div>
                  <Badge variant="success" className="text-[9px]">Instan</Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bca_va")}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "bca_va"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-[#00677d]" />
                    <span>BCA Virtual Account</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Otomatis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit_card")}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "credit_card"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-4 w-4 text-[#00677d]" />
                    <span>Kartu Kredit / Debit (Visa / Mastercard)</span>
                  </div>
                  <span className="text-[11px] text-slate-400">3D Secure</span>
                </button>
              </div>
            </div>

            {/* Simulated QR Code or Instructions */}
            {paymentMethod === "qris" && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="h-32 w-32 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                  <QrCode className="h-28 w-28 text-slate-800" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Pindai QRIS di atas dengan aplikasi m-Banking atau e-Wallet favorit Anda.
                </p>
              </div>
            )}

            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              size="lg"
              className="w-full justify-center font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              {isProcessingPayment ? "Memverifikasi Transaksi..." : "Saya Sudah Membayar (Simulasi Sukses)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState, useEffect, use } from "react";
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
  Clock,
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
import { formatCurrency, formatDuration, calculateOccupancyPercent } from "@/src/lib/utils";
import type { Destination, BookingGroup } from "@/src/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DestinationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [tripId, setTripId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
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
  const [snapToken, setSnapToken] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const dest = await destinationService.getDestinationBySlug(resolvedParams.slug);
        if (dest && isMounted) {
          setDestination(dest);
          const tId = dest.id;
          setTripId(tId);

          const avail = await destinationService.getTripAvailability(tId);
          if (isMounted) {
            setGroups(avail);
            if (avail.length > 0) {
              setSelectedGroup(avail[0].id);
            }
          }
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Memuat detail destinasi dan ketersediaan grup...
        </span>
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <PackageOpen className="h-12 w-12 text-slate-400" />
        <h2 className="font-heading font-extrabold text-xl text-[#191c1e]">
          Destinasi Tidak Ditemukan
        </h2>
        <p className="text-xs text-slate-500 max-w-sm">
          Paket wisata dengan slug &ldquo;{resolvedParams.slug}&rdquo; tidak terdaftar di database.
        </p>
        <Button asChild>
          <Link href="/destinations">Kembali ke Katalog</Link>
        </Button>
      </div>
    );
  }

  const insuranceFee = hasInsurance ? 50000 : 0;
  const privateRoomFee = roomPref === "single" ? 350000 : 0;
  const totalAmount = destination.pricePerPax + insuranceFee + privateRoomFee;

  const handleOpenPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName || !email || !phoneNumber || !identityNumber) {
      setErrorMessage("Harap lengkapi seluruh formulir data diri traveler wajib.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await bookingService.createBooking({
        tripId: tripId || destination.id,
        destinationId: destination.id,
        fullName,
        email,
        phoneNumber,
        nationality,
        identityNumber,
        gender: "other",
        roomPreference: roomPref,
        healthNotes,
        hasInsurance,
        captchaToken: "10000000-aaaa-bbbb-cccc-000000000001",
      });

      const participantId = res.participant.id;
      setCreatedParticipantId(participantId);

      // Fetch Midtrans Snap Token
      const snapData = await bookingService.getSnapToken(
        participantId,
        paymentMethod === "bca_va" || paymentMethod === "mandiri_va" ? "bank_transfer" : paymentMethod
      );
      setSnapToken(snapData.snapToken);
      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pemesanan. Silakan coba lagi.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePaymentSimulation = async () => {
    setIsProcessingPayment(true);
    try {
      await bookingService.simulatePaymentSettlement(createdParticipantId || "part-01");
      setTimeout(() => {
        setIsProcessingPayment(false);
        setIsPaymentModalOpen(false);
        router.push("/bookings?success=true");
      }, 1000);
    } catch {
      setIsProcessingPayment(false);
      alert("Gagal memproses simulasi pembayaran.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Top Back Navigation */}
      <div className="border-b border-slate-200/80 bg-white py-3.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/destinations"
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#00677d] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Katalog Destinasi
          </Link>
          <Badge variant="azure" className="text-xs font-bold">
            Maks 6 Orang per Grup Mobil
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* LEFT COLUMN: DESTINATION DETAILS, ITINERARY, & INCLUSIONS */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header Title & Tagline */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#00677d] mb-1.5">
                <MapPin className="h-4 w-4" />
                {destination.location}
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
                {destination.title}
              </h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                {destination.description}
              </p>
            </div>

            {/* Gallery Cover */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-stitch-card border border-slate-100">
              <Image
                src={destination.coverImage || "/images/dest-bromo.jpg"}
                alt={destination.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 right-4 bg-[#a43c12] text-white px-3.5 py-1.5 rounded-xl font-heading font-extrabold text-sm shadow-md">
                {formatCurrency(destination.pricePerPax)}
                <span className="text-[11px] font-normal opacity-90">/pax</span>
              </div>
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#5cd5f8]" />
                Durasi: {formatDuration(destination.durationDays, destination.durationNights)}
              </div>
            </div>

            {/* Highlights */}
            {destination.highlights && destination.highlights.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-4">
                <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#ff7f50]" />
                  Highlight Perjalanan
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {destination.highlights.map((hl, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Itinerary Timeline */}
            {destination.itinerary && destination.itinerary.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-6">
                <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00677d]" />
                  Rencana Perjalanan (Itinerary)
                </h2>
                <div className="space-y-6">
                  {destination.itinerary.map((day) => (
                    <div key={day.day} className="relative pl-6 border-l-2 border-[#00677d]/30 space-y-2">
                      <div className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-[#00677d] border-2 border-white shadow-sm" />
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff7f50] bg-orange-50 px-2 py-0.5 rounded-md">
                          Hari {day.day}
                        </span>
                        <h3 className="font-heading font-bold text-sm text-slate-800">
                          {day.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {day.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-3">
                <h2 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Termasuk Biaya (Inclusions)
                </h2>
                <ul className="space-y-2 text-xs text-slate-600">
                  {destination.inclusions && destination.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-3">
                <h2 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Tidak Termasuk (Exclusions)
                </h2>
                <ul className="space-y-2 text-xs text-slate-600">
                  {destination.exclusions && destination.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE GROUP STATUS & BOOKING FORM */}
          <div className="lg:col-span-5 space-y-6">
            {/* 1. Live Groups Occupancy Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00677d]" />
                  <span className="font-heading font-bold text-sm text-[#191c1e]">
                    Ketersediaan Slot Grup Mobil
                  </span>
                </div>
                <Badge variant="coral" className="text-[10px]">
                  Maks 6 Pax
                </Badge>
              </div>

              {groups.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  Grup mobil baru akan dibuat otomatis saat Anda melakukan reservasi pertama.
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => {
                    const isSelected = selectedGroup === group.id;
                    const percent = calculateOccupancyPercent(group.currentParticipants, group.capacity);
                    const remaining = group.capacity - group.currentParticipants;

                    return (
                      <div
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#00677d] bg-[#00677d]/5 ring-1 ring-[#00677d]"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-slate-800">
                            Grup Mobil #{group.groupNumber}
                          </span>
                          <span className="text-[11px] font-semibold text-[#00677d]">
                            {group.currentParticipants}/{group.capacity} Kursi ({remaining} Sisa)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Participant Registration Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-6 sticky top-24">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ff7f50] block">
                  Formulir Reservasi
                </span>
                <h2 className="font-heading font-extrabold text-lg text-[#191c1e]">
                  Data Diri Traveler
                </h2>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleOpenPayment} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Nama Lengkap (Sesuai KTP/Paspor) *
                  </label>
                  <Input
                    required
                    placeholder="Contoh: Budi Pratama"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Email Aktif *
                    </label>
                    <Input
                      required
                      type="email"
                      placeholder="budi@example.com"
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
                      type="tel"
                      placeholder="081234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      NIK / Paspor *
                    </label>
                    <Input
                      required
                      placeholder="3509123456780001"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      className="text-xs bg-slate-50 border-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Kewarganegaraan
                    </label>
                    <select
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                    >
                      <option value="Indonesia">Indonesia</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>
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
                    <span>{formatCurrency(destination.pricePerPax)}</span>
                  </div>
                  {hasInsurance && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Asuransi:</span>
                      <span>+Rp 50.000</span>
                    </div>
                  )}
                  {roomPref === "single" && (
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Kamar Privat:</span>
                      <span>+Rp 350.000</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold text-sm text-[#191c1e]">
                    <span>Total Pembayaran:</span>
                    <span className="font-heading font-extrabold text-[#a43c12] text-base">
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
                  {isSubmitting ? "Memproses Pemesanan..." : "Lanjut ke Pembayaran"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MIDTRANS PAYMENT MODAL OVERLAY */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-2xl">
          <DialogTitle className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
            <Lock className="h-5 w-5 text-emerald-600" />
            Midtrans Payment Gateway
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Pilih metode pembayaran aman untuk menyelesaikan reservasi slot grup Anda.
          </DialogDescription>

          <div className="space-y-4 pt-3">
            {/* Amount Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex justify-between items-center">
              <span className="text-xs text-slate-600 font-medium">Tagihan Resmi:</span>
              <span className="font-heading font-extrabold text-base text-[#a43c12]">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Methods Options */}
            <div className="space-y-2">
              <label
                onClick={() => setPaymentMethod("qris")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "qris"
                    ? "border-[#00677d] bg-[#00677d]/5 ring-1 ring-[#00677d]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">QRIS Instan (GoPay/OVO/BCA)</span>
                    <span className="text-[11px] text-slate-500">Bebas biaya admin & konfirmasi instan</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="midtransMethod"
                  checked={paymentMethod === "qris"}
                  onChange={() => setPaymentMethod("qris")}
                  className="accent-[#00677d]"
                />
              </label>

              <label
                onClick={() => setPaymentMethod("bca_va")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "bca_va"
                    ? "border-[#00677d] bg-[#00677d]/5 ring-1 ring-[#00677d]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-sky-100 text-[#00677d] flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">BCA Virtual Account</span>
                    <span className="text-[11px] text-slate-500">Verifikasi otomatis 24/7</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="midtransMethod"
                  checked={paymentMethod === "bca_va"}
                  onChange={() => setPaymentMethod("bca_va")}
                  className="accent-[#00677d]"
                />
              </label>

              <label
                onClick={() => setPaymentMethod("credit_card")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "credit_card"
                    ? "border-[#00677d] bg-[#00677d]/5 ring-1 ring-[#00677d]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Kartu Kredit / Debit</span>
                    <span className="text-[11px] text-slate-500">Visa, Mastercard, JCB</span>
                  </div>
                </div>
                <input
                  type="radio"
                  name="midtransMethod"
                  checked={paymentMethod === "credit_card"}
                  onChange={() => setPaymentMethod("credit_card")}
                  className="accent-[#00677d]"
                />
              </label>
            </div>

            {paymentMethod === "qris" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <div className="h-32 w-32 mx-auto bg-white border border-slate-300 rounded-lg p-2 flex items-center justify-center shadow-inner">
                  <QrCode className="h-24 w-24 text-slate-800" />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Scan QRIS menggunakan mobile banking / e-wallet
                </span>
                {snapToken && (
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Snap: {snapToken.slice(0, 16)}...
                  </span>
                )}
              </div>
            )}

            {paymentMethod === "bca_va" && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[11px] text-slate-500 block">Nomor Virtual Account BCA:</span>
                <div className="flex items-center justify-between font-mono font-bold text-base text-[#00677d]">
                  <span>8801 2984 7719 0021</span>
                  <span className="text-xs text-[#ff7f50] font-sans font-bold cursor-pointer">Salin</span>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleCompletePaymentSimulation}
                disabled={isProcessingPayment}
                className="w-full justify-center text-sm font-bold shadow-md"
              >
                {isProcessingPayment ? "Memproses Transaksi..." : "Selesaikan Pembayaran (Simulasi Midtrans)"}
              </Button>
              <span className="text-[10px] text-center text-slate-400 block mt-2">
                🔒 Transaksi dienkripsi dengan standar keamanan PCI-DSS 256-bit
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

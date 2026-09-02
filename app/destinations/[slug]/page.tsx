"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  QrCode,
  CreditCard,
  Building2,
  Sparkles,
  Clock,
  Car,
  AlertCircle,
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
import { MOCK_DESTINATIONS, MOCK_TRIPS } from "@/src/services/mockData";
import { destinationService } from "@/src/services/destination.service";
import { bookingService } from "@/src/services/booking.service";
import { formatCurrency, formatDuration, formatDate, calculateOccupancyPercent } from "@/src/lib/utils";
import type { Destination, Trip, BookingGroup } from "@/src/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DestinationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [destination, setDestination] = useState<Destination>(() => {
    return (
      MOCK_DESTINATIONS.find(
        (d) => d.slug === resolvedParams.slug || d.id === resolvedParams.slug
      ) || MOCK_DESTINATIONS[0]
    );
  });

  const [activeTrip, setActiveTrip] = useState<Trip>(() => {
    const trips = MOCK_TRIPS.filter((t) => t.destinationId === destination.id);
    return trips[0] || MOCK_TRIPS[0];
  });

  const [groups, setGroups] = useState<BookingGroup[]>(activeTrip.groups || []);
  const [selectedGroup, setSelectedGroup] = useState<string>(groups[0]?.id || "grp-01");
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
      try {
        const dest = await destinationService.getDestinationBySlug(resolvedParams.slug);
        if (dest && isMounted) {
          setDestination(dest);
          const avail = await destinationService.getTripAvailability(activeTrip.id);
          if (avail.length > 0 && isMounted) {
            setGroups(avail);
            setSelectedGroup(avail[0].id);
          }
        }
      } catch {
        // Fallback already in place
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug, activeTrip.id]);

  const insuranceFee = hasInsurance ? 50000 : 0;
  const privateRoomFee = roomPref === "single" ? 350000 : 0;
  const totalAmount = (destination?.pricePerPax || 850000) + insuranceFee + privateRoomFee;

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
        tripId: activeTrip.id,
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
      const snapData = await bookingService.getSnapToken(participantId, paymentMethod);
      setSnapToken(snapData.snapToken);

      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses booking.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompletePaymentSimulation = async () => {
    setIsProcessingPayment(true);
    try {
      await bookingService.simulateMidtransPayment(createdParticipantId || "part-01", paymentMethod);
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
                src={destination.coverImage}
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

            {/* Itinerary Accordion / List */}
            <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-6">
              <h2 className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#00677d]" />
                Rencana Perjalanan (Itinerary)
              </h2>

              <div className="space-y-6">
                {destination.itinerary && destination.itinerary.map((itin) => (
                  <div key={itin.day} className="relative pl-6 border-l-2 border-[#00a3c4]/40 space-y-2">
                    <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-[#00677d] text-white flex items-center justify-center text-[10px] font-bold">
                      {itin.day}
                    </div>
                    <h3 className="font-heading font-bold text-sm text-[#191c1e]">
                      Hari {itin.day}: {itin.title}
                    </h3>
                    {itin.description && (
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {itin.description}
                      </p>
                    )}
                    {itin.activities && (
                      <ul className="space-y-1 pt-1">
                        {itin.activities.map((act, i) => (
                          <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7f50]" />
                            {act}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Inclusions */}
              <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-3">
                <h3 className="font-heading font-bold text-sm text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Termasuk dalam Paket
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {destination.inclusions && destination.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Exclusions */}
              <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-3">
                <h3 className="font-heading font-bold text-sm text-rose-800 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Tidak Termasuk
                </h3>
                <ul className="space-y-2 text-xs text-slate-600">
                  {destination.exclusions && destination.exclusions.map((exc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{exc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Fleet & Meeting Point Info */}
            <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
                <Car className="h-4 w-4 text-[#00677d]" />
                Armada & Titik Kumpul (Meeting Point)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 block">Armada Perjalanan:</span>
                  <span>Toyota HiAce Premio / Elf Luxury (AC, Maks 6 Kursi Traveler)</span>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold text-slate-700 block">Meeting Point:</span>
                  <span>{destination.meetingPoint}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BOOKING FORM & GROUP SELECTION */}
          <div className="lg:col-span-5 space-y-6">
            {/* Group Availability Selector */}
            <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00677d]" />
                  Status Grup Armada
                </h3>
                <Badge variant="azure" className="text-[10px]">
                  {formatDate(activeTrip.departureDate)}
                </Badge>
              </div>

              <div className="space-y-3">
                {groups.map((grp) => {
                  const isSelected = selectedGroup === grp.id;
                  const remainingSeats = grp.capacity - grp.currentParticipants;
                  return (
                    <div
                      key={grp.id}
                      onClick={() => setSelectedGroup(grp.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-[#00677d] bg-[#00677d]/5 ring-2 ring-[#00677d]/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#191c1e]">
                          Grup {grp.groupNumber} ({grp.driver?.vehicleModel || "HiAce 6-Pax"})
                        </span>
                        <span className="text-[11px] font-bold text-[#00677d] bg-sky-50 px-2 py-0.5 rounded-md">
                          {grp.currentParticipants}/{grp.capacity} Terisi (Sisa {remainingSeats} Kursi)
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full"
                          style={{
                            width: `${calculateOccupancyPercent(grp.currentParticipants, grp.capacity)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Driver: {grp.driver?.fullName || "Pak Joko Santoso"} (Rating ⭐ {grp.driver?.rating || "5.0"})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Pemberitahuan:</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Booking Form (Data Diri Traveler) */}
            <form
              onSubmit={handleOpenPayment}
              className="rounded-2xl bg-white p-6 sm:p-8 shadow-stitch-card border border-slate-100 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#00677d]" />
                  Data Diri Traveler
                </h3>
                <span className="text-[11px] text-slate-400">1 Kursi</span>
              </div>

              {/* Input: Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Nama Lengkap (Sesuai KTP/Paspor) *
                </label>
                <Input
                  required
                  placeholder="Contoh: Siti Rahmawati"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Input: Email & No HP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Email Aktif *
                  </label>
                  <Input
                    required
                    type="email"
                    placeholder="siti.rahma@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    No. WhatsApp *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="081987654321"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Input: No KTP / Paspor & Kewarganegaraan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    No. KTP / Paspor *
                  </label>
                  <Input
                    required
                    placeholder="3201123456780002"
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Kewarganegaraan
                  </label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
                  >
                    <option value="Indonesia">Indonesia</option>
                    <option value="Malaysia">Malaysia</option>
                    <option value="Singapore">Singapore</option>
                    <option value="Australia">Australia</option>
                    <option value="Other">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Room Preference */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Preferensi Kamar (Jika Termasuk Penginapan)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer text-xs ${
                      roomPref === "shared"
                        ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d] font-bold"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Twin Sharing</span>
                      <input
                        type="radio"
                        name="roomPref"
                        checked={roomPref === "shared"}
                        onChange={() => setRoomPref("shared")}
                        className="accent-[#00677d]"
                      />
                    </div>
                    <span className="text-[10px] font-normal text-slate-500 mt-1">Termasuk dalam paket</span>
                  </label>

                  <label
                    className={`flex flex-col p-3 rounded-xl border cursor-pointer text-xs ${
                      roomPref === "single"
                        ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d] font-bold"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Private Room</span>
                      <input
                        type="radio"
                        name="roomPref"
                        checked={roomPref === "single"}
                        onChange={() => setRoomPref("single")}
                        className="accent-[#00677d]"
                      />
                    </div>
                    <span className="text-[10px] font-normal text-slate-500 mt-1">+ Rp 350.000 / malam</span>
                  </label>
                </div>
              </div>

              {/* Health Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Catatan Medis / Alergi Makanan (Opsional)
                </label>
                <Input
                  placeholder="Contoh: Alergi seafood ringan..."
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                />
              </div>

              {/* Insurance Checkbox */}
              <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasInsurance}
                    onChange={(e) => setHasInsurance(e.target.checked)}
                    className="mt-0.5 rounded accent-[#ff7f50]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-[#a43c12] block">
                      Proteksi Asuransi Perjalanan (+ Rp 50.000)
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Perlindungan medis darurat & kecelakaan selama durasi trip.
                    </span>
                  </div>
                </label>
              </div>

              {/* hCaptcha Security Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Lock className="h-4 w-4 text-[#00677d]" />
                  <span>hCaptcha Bot Protection</span>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Terverifikasi ✓
                </Badge>
              </div>

              {/* Price Breakdown & Total */}
              <div className="space-y-2 pt-4 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Harga Trip (1 Pax):</span>
                  <span>{formatCurrency(destination.pricePerPax)}</span>
                </div>
                {hasInsurance && (
                  <div className="flex justify-between text-slate-600">
                    <span>Asuransi Perjalanan:</span>
                    <span>+ {formatCurrency(50000)}</span>
                  </div>
                )}
                {roomPref === "single" && (
                  <div className="flex justify-between text-slate-600">
                    <span>Private Room Upgrade:</span>
                    <span>+ {formatCurrency(350000)}</span>
                  </div>
                )}
                <div className="flex justify-between font-heading font-extrabold text-base text-[#191c1e] pt-2 border-t border-slate-200">
                  <span>Total Pembayaran:</span>
                  <span className="text-[#a43c12]">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center text-base font-bold shadow-lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isSubmitting ? "Memproses Booking..." : `Lanjut ke Pembayaran (${formatCurrency(totalAmount)})`}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 4. MIDTRANS SNAP PAYMENT MODAL OVERLAY */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-[#00677d] to-[#00a3c4] p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                Midtrans Snap Payment
              </span>
              <Badge variant="secondary" className="text-[10px] font-bold">
                Order #{createdParticipantId ? createdParticipantId.slice(-6).toUpperCase() : "TRV-8921"}
              </Badge>
            </div>
            <DialogTitle className="text-lg font-bold text-white mt-2">
              Pilih Metode Pembayaran
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-100 mt-0.5">
              Total Tagihan: <strong className="text-white text-sm">{formatCurrency(totalAmount)}</strong>
            </DialogDescription>
          </div>

          {/* Payment Method Selector */}
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              {/* QRIS */}
              <label
                onClick={() => setPaymentMethod("qris")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === "qris"
                    ? "border-[#00677d] bg-[#00677d]/5 ring-1 ring-[#00677d]"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 text-[#ff7f50] flex items-center justify-center">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">QRIS (Instant)</span>
                    <span className="text-[11px] text-slate-500">GoPay, OVO, ShopeePay, BCA QR</span>
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

              {/* Virtual Account BCA */}
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

              {/* Credit Card */}
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

            {/* Mock QR / VA Display Area */}
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

            {/* Action Simulator Button */}
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

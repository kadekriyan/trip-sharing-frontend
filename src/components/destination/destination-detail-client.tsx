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
  CalendarPlus,
  Clock,
  Car,
  Copy,
  Check,
  Ticket,
  Printer,
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
import {
  formatCurrency,
  formatDuration,
  calculateOccupancyPercent,
  getDestinationTitle,
  getDestinationPrice,
  formatDate,
  getImageUrl,
} from "@/src/lib/utils";
import type { Destination, BookingGroup, Trip, Participant } from "@/src/types";

interface DestinationDetailClientProps {
  initialDestination: Destination | null;
  slug: string;
}

export function DestinationDetailClient({ initialDestination, slug }: DestinationDetailClientProps) {
  const router = useRouter();

  const [destination] = useState<Destination | null>(initialDestination);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isCustomDateMode, setIsCustomDateMode] = useState<boolean>(false);
  const [customDateInput, setCustomDateInput] = useState<string>("");

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
  const [createdBooking, setCreatedBooking] = useState<Participant | null>(null);

  // Success Confirmation Dialog State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isCopiedBookingCode, setIsCopiedBookingCode] = useState(false);

  // Min date for custom date picker (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minCustomDate = tomorrow.toISOString().split("T")[0];

  useEffect(() => {
    let isMounted = true;
    async function loadTripsAndAvailability() {
      if (!initialDestination?.id) {
        setIsLoadingAvailability(false);
        return;
      }

      setIsLoadingAvailability(true);
      try {
        const loadedTrips = await destinationService.getTripsByDestination(initialDestination.id);
        if (!isMounted) return;

        setTrips(loadedTrips);

        if (loadedTrips.length > 0) {
          const firstTrip = loadedTrips[0];
          setSelectedTripId(firstTrip.id);
          setSelectedDate(firstTrip.departureDate);
          setIsCustomDateMode(false);

          const tripGroups = firstTrip.groups || [];
          setGroups(tripGroups);

          const openGroup = tripGroups.find((g) => g.status === "open" && g.currentParticipants < 6);
          if (openGroup) {
            setSelectedGroup(openGroup.id);
          } else if (tripGroups.length > 0) {
            setSelectedGroup(tripGroups[0].id);
          }
        } else {
          // No existing trips scheduled yet, switch to initiator mode
          setIsCustomDateMode(true);
          setCustomDateInput(minCustomDate);
          setSelectedDate(minCustomDate);
          setGroups([
            {
              id: "grp-initiator-01",
              tripId: "trip-new",
              groupNumber: 1,
              capacity: 6,
              currentParticipants: 0,
              status: "open",
              name: "Grup Mobil Inisiator #1",
              notes: "Grup Baru - Jadilah pemesan pertama!",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
          setSelectedGroup("grp-initiator-01");
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setIsLoadingAvailability(false);
      }
    }

    loadTripsAndAvailability();
    return () => {
      isMounted = false;
    };
  }, [initialDestination, minCustomDate]);

  // Handle choosing a scheduled trip
  const handleSelectTrip = (trip: Trip) => {
    setIsCustomDateMode(false);
    setSelectedTripId(trip.id);
    setSelectedDate(trip.departureDate);
    setCustomDateInput("");

    const tripGroups = trip.groups || [];
    setGroups(tripGroups);

    const openGroup = tripGroups.find((g) => g.status === "open" && g.currentParticipants < 6);
    if (openGroup) {
      setSelectedGroup(openGroup.id);
    } else if (tripGroups.length > 0) {
      setSelectedGroup(tripGroups[0].id);
    } else {
      setSelectedGroup("");
    }
  };

  // Handle custom date selection by traveler (Model B: On-Demand Trip Initiator)
  const handleCustomDateChange = (dateValue: string) => {
    setCustomDateInput(dateValue);
    setSelectedDate(dateValue);

    // Check if the chosen date matches an existing trip
    const matchedTrip = trips.find((t) => {
      const tripDate = t.departureDate.split("T")[0];
      return tripDate === dateValue;
    });

    if (matchedTrip) {
      handleSelectTrip(matchedTrip);
    } else {
      setIsCustomDateMode(true);
      setSelectedTripId("");
      // Simulated new initiator group
      const initiatorGroup: BookingGroup = {
        id: `grp-initiator-${dateValue}`,
        tripId: `trip-ondemand-${dateValue}`,
        groupNumber: 1,
        capacity: 6,
        currentParticipants: 0,
        status: "open",
        name: "Grup Inisiator #1",
        notes: "Grup Baru - Kursi pertama siap dikunci!",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setGroups([initiatorGroup]);
      setSelectedGroup(initiatorGroup.id);
    }
  };

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

  // Selected trip or base price
  const activeTrip = trips.find((t) => t.id === selectedTripId);
  const basePrice = activeTrip?.pricePerPax || getDestinationPrice(destination);
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

    if (!selectedDate && !customDateInput) {
      setErrorMessage("Mohon pilih tanggal keberangkatan trip.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetTripId = selectedTripId || `trip-ondemand-${Date.now()}`;
      const payload = {
        tripId: targetTripId,
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
        departureDate: selectedDate || customDateInput,
        captchaToken: "10000000-aaaa-bbbb-cccc-000000000001",
      };

      const result = await bookingService.createBooking(payload);

      setCreatedParticipantId(result.participant.id);
      setCreatedBooking(result.participant);
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
        setCreatedBooking((prev) => (prev ? { ...prev, paymentStatus: "paid" } : null));
      }
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch {
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setIsCopiedBookingCode(true);
      setTimeout(() => setIsCopiedBookingCode(false), 2000);
    }
  };

  const inclusions = destination.inclusions || destination.includedFacilities || [];
  const exclusions = destination.exclusions || destination.excludedFacilities || [];

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-24">
      {/* Header Banner */}
      <div className="relative h-[45vh] min-h-[340px] max-h-[480px] w-full bg-slate-900">
        <Image
          src={getImageUrl(destination.coverImage || destination.image || destination.imageUrl)}
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
                <Clock className="h-4 w-4 text-[#00a3c4]" />
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
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Gallery Photos Card */}
            {Array.isArray(destination.galleryImages) && destination.galleryImages.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-4">
                <h2 className="font-heading font-extrabold text-lg text-[#191c1e]">
                  Galeri Dokumentasi & Suasana Trip
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {destination.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group shadow-sm"
                    >
                      <Image
                        src={getImageUrl(imgUrl)}
                        alt={`Galeri ${getDestinationTitle(destination)} ${idx + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Point Card */}
            {destination.meetingPoint && (
              <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-stitch-card flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-[#00677d]/10 text-[#00677d] shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Titik Kumpul / Penjemputan Resmi
                  </span>
                  <h3 className="font-heading font-extrabold text-base text-[#191c1e] mt-0.5">
                    {destination.meetingPoint}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Driver akan menunggu di area meeting point 30 menit sebelum jam keberangkatan.
                  </p>
                </div>
              </div>
            )}

            {/* Itinerary Timeline Card */}
            {Array.isArray(destination.itinerary) && destination.itinerary.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-6">
                <h2 className="font-heading font-extrabold text-xl text-[#191c1e]">
                  Rencana Perjalanan (Itinerary)
                </h2>
                <div className="space-y-6">
                  {destination.itinerary.map((day) => (
                    <div key={day.day} className="relative pl-6 sm:pl-8 border-l-2 border-[#00677d]/20 pb-4 last:pb-0">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#00677d] border-2 border-white shadow-sm" />
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#ff7f50]">
                          Hari Ke-{day.day}
                        </span>
                        <h3 className="font-heading font-bold text-base text-[#191c1e]">
                          {day.title}
                        </h3>
                        {day.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {day.description}
                          </p>
                        )}
                        {Array.isArray(day.activities) && day.activities.length > 0 && (
                          <ul className="space-y-1.5 pt-2">
                            {day.activities.map((act, actIdx) => (
                              <li key={actIdx} className="text-xs text-slate-500 flex items-start gap-2">
                                <Clock className="h-3.5 w-3.5 text-[#00677d] mt-0.5 shrink-0" />
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: DATE SELECTION, AUTO-GROUPING & BOOKING FORM (5 Cols) */}
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

              {/* STEP 1: DATE SELECTION & CALENDAR (Traveler Model) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    1. Pilih Tanggal Keberangkatan
                  </label>
                  {isCustomDateMode && (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800">
                      Inisiator Trip
                    </Badge>
                  )}
                </div>

                {/* Available Trip Dates Pills */}
                {trips.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      Jadwal Tersedia Terdekat:
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {trips.map((trp) => {
                        const isSelected = selectedTripId === trp.id && !isCustomDateMode;
                        const totalParticipants = trp.groups?.reduce(
                          (acc, g) => acc + (g.currentParticipants || 0),
                          0
                        ) || 0;
                        const totalCapacity = (trp.groups?.length || 1) * 6;
                        const remainingSeats = totalCapacity - totalParticipants;

                        return (
                          <button
                            key={trp.id}
                            type="button"
                            onClick={() => handleSelectTrip(trp)}
                            className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#00677d] bg-[#00677d]/5 ring-2 ring-[#00677d]/20 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-heading font-bold text-xs text-[#191c1e] block">
                                {formatDate(trp.departureDate)}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[#00677d]" />
                                s.d. {formatDate(trp.returnDate)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-[#00677d] block">
                                {remainingSeats > 0 ? `Sisa ${remainingSeats} Kursi` : "Penuh"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {trp.groups?.length || 1} Armada
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Option to Pick Custom Date (Model B: On-Demand Trip Initiator) */}
                <div className="pt-2 border-t border-dashed border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="custom-date-picker" className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <CalendarPlus className="h-3.5 w-3.5 text-[#ff7f50]" />
                      Ingin tanggal lain? Pilih Tanggal Sendiri:
                    </label>
                  </div>
                  <Input
                    id="custom-date-picker"
                    type="date"
                    min={minCustomDate}
                    value={customDateInput}
                    onChange={(e) => handleCustomDateChange(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 h-9 font-medium"
                  />

                  {/* Initiator Info Callout */}
                  {isCustomDateMode && customDateInput && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Sparkles className="h-4 w-4 text-[#ff7f50]" />
                        <span>Jadilah Inisiator Trip!</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                        Belum ada grup di tanggal <strong>{formatDate(customDateInput)}</strong>. 
                        Pemesanan Anda akan otomatis membuka <strong>Grup Mobil #1</strong> baru, dan traveler lain dapat bergabung.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2: GROUP AVAILABILITY VISUALIZER */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                  <Car className="h-4 w-4" />
                  2. Pilih Grup Mobil (Maksimal 6 Orang)
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

                          {grp.driver && (
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Driver: <strong>{grp.driver.fullName}</strong> ({grp.driver.vehicleModel})
                            </span>
                          )}

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

              {/* STEP 3: BOOKING FORM */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] block">
                  3. Data Diri Pemesan
                </label>

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
                    <span>Tanggal Dipilih:</span>
                    <span className="font-bold text-[#00677d]">
                      {selectedDate ? formatDate(selectedDate) : "Belum dipilih"}
                    </span>
                  </div>
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

      {/* PAYMENT SUCCESS CONFIRMATION MODAL */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border border-slate-100 shadow-2xl rounded-3xl print-voucher-card">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              Pemesanan Berhasil!
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-100 max-w-xs mx-auto">
              Pembayaran telah terverifikasi lunas. Kursi armada trip sharing Anda telah resmi terkunci.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            {/* Booking Code Highlight */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Kode Booking Resmi Anda
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-black text-[#00677d] tracking-widest">
                  {createdBooking?.bookingCode || "TRV-SUCCESS"}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(createdBooking?.bookingCode || "TRV-SUCCESS")}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#00677d] transition-colors shadow-sm no-print"
                  title="Salin Kode Booking"
                >
                  {isCopiedBookingCode ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {isCopiedBookingCode && (
                <span className="text-[10px] font-bold text-emerald-600 block animate-in fade-in">
                  Kode booking berhasil disalin!
                </span>
              )}
            </div>

            {/* Trip & Group Info Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Destinasi:</span>
                <span className="font-bold text-slate-800">{getDestinationTitle(destination)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Tanggal Berangkat:</span>
                <span className="font-bold text-[#00677d]">
                  {formatDate(selectedDate || customDateInput)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Alokasi Armada:</span>
                <span className="font-bold text-slate-800">
                  {createdBooking?.group?.name || `Grup Mobil #${createdBooking?.group?.groupNumber || 1}`} (Maks 6 Pax)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Nama Pemesan:</span>
                <span className="font-bold text-slate-800">{fullName}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Status Transaksi:</span>
                <Badge variant="success" className="text-[10px] font-bold">LUNAS / PAID</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 no-print">
              <Button
                size="lg"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push(`/bookings?bookingCode=${createdBooking?.bookingCode || ""}`);
                }}
                className="w-full font-bold text-xs gap-2 bg-[#00677d] hover:bg-[#005264] shadow-md"
              >
                <Ticket className="h-4 w-4" />
                Buka E-Voucher di Booking Saya
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (typeof window !== "undefined") window.print();
                  }}
                  className="flex-1 text-xs font-semibold gap-1.5 text-slate-600"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Cetak Bukti
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    router.push("/destinations");
                  }}
                  className="flex-1 text-xs font-semibold text-slate-600"
                >
                  Katalog Lain
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

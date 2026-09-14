"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
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
  ChevronDown,
  ShieldAlert,
  Info,
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
  parsePickupLocation,
} from "@/src/lib/utils";
import { printTicketVoucher } from "@/src/lib/ticket-printer";
import { TripCalendarPicker } from "@/src/components/destination/trip-calendar-picker";
import { GooglePlacesAutocomplete } from "@/src/components/ui/google-places-autocomplete";
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
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupPlaceName, setPickupPlaceName] = useState("");
  const [pickupLatitude, setPickupLatitude] = useState<number | undefined>(undefined);
  const [pickupLongitude, setPickupLongitude] = useState<number | undefined>(undefined);
  const [pickupNotes, setPickupNotes] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Field-level Validation Errors & DOM element refs for instant focus/scrolling
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fullNameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const dateOfBirthInputRef = useRef<HTMLInputElement>(null);

  // Travel Insurance Warning Modal State
  const [isInsuranceWarningOpen, setIsInsuranceWarningOpen] = useState(false);

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

          let tripGroups = firstTrip.groups || [];
          if (tripGroups.length === 0 && firstTrip.id) {
            try {
              const liveGroups = await destinationService.getTripAvailability(firstTrip.id);
              if (liveGroups && liveGroups.length > 0) {
                tripGroups = liveGroups;
              }
            } catch {
              // Fallback to existing
            }
          }
          setGroups(tripGroups);

          const openGroup = tripGroups.find(
            (g) => g.status === "open" && (g.currentParticipants || 0) < (g.capacity || 6)
          );
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
  const handleSelectTrip = async (trip: Trip) => {
    setIsCustomDateMode(false);
    setSelectedTripId(trip.id);
    setSelectedDate(trip.departureDate);
    setCustomDateInput("");

    let tripGroups = trip.groups || [];
    if (tripGroups.length === 0 && trip.id) {
      setIsLoadingAvailability(true);
      try {
        const liveGroups = await destinationService.getTripAvailability(trip.id);
        if (liveGroups && liveGroups.length > 0) {
          tripGroups = liveGroups;
        }
      } catch {
        // Silently handled
      } finally {
        setIsLoadingAvailability(false);
      }
    }
    setGroups(tripGroups);

    const openGroup = tripGroups.find(
      (g) => g.status === "open" && (g.currentParticipants || 0) < (g.capacity || 6)
    );
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
        name: "Initiator Group #1",
        notes: "New Group - First seat ready to book!",
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
          Tour Package Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          The tour destination with link <code className="bg-slate-100 px-1.5 py-0.5 rounded text-rose-600 font-mono text-xs">{slug}</code> is not available or has been disabled.
        </p>
        <Button asChild className="gap-2">
          <Link href="/destinations">
            <ArrowLeft className="h-4 w-4" />
            Back to Tour Catalog
          </Link>
        </Button>
      </div>
    );
  }

  // Selected trip or base price
  const activeTrip = trips.find((t) => t.id === selectedTripId);
  const basePrice = activeTrip?.pricePerPax || getDestinationPrice(destination);
  const totalAmount = basePrice;

  const validateBookingForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate Full Name (Min 2, Max 100, safe characters)
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errors.fullName = "Full name is required.";
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.fullName = "Full name must be between 2 and 100 characters.";
    } else if (!/^[a-zA-Z\s.'\-,]+$/u.test(trimmedName)) {
      errors.fullName = "Full name may only contain letters, spaces, and standard name punctuation.";
    }

    // Validate Email (RFC format)
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
      errors.email = "Invalid email format (e.g. traveler@domain.com).";
    }

    // Validate WhatsApp / Phone Number (Only numbers & safe symbols, 8 to 20 digits, no alphabets)
    const trimmedPhone = phoneNumber.trim();
    const cleanPhoneDigits = trimmedPhone.replace(/[\s\-()]/g, "");
    if (!trimmedPhone) {
      errors.phoneNumber = "WhatsApp / phone number is required.";
    } else if (/[a-zA-Z]/.test(trimmedPhone)) {
      errors.phoneNumber = "Phone number must not contain alphabet letters.";
    } else if (!/^\+?[0-9]{8,20}$/.test(cleanPhoneDigits)) {
      errors.phoneNumber = "Phone number must be between 8 and 20 valid digits (e.g. +6281234567890).";
    }

    // Validate Date of Birth (Optional, but if filled must be valid ISO date between 1900-01-01 and today)
    if (dateOfBirth) {
      const birthDateObj = new Date(dateOfBirth);
      const today = new Date();
      const minDate = new Date("1900-01-01");
      if (isNaN(birthDateObj.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        errors.dateOfBirth = "Invalid date of birth format (YYYY-MM-DD).";
      } else if (birthDateObj > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future.";
      } else if (birthDateObj < minDate) {
        errors.dateOfBirth = "Date of birth cannot be earlier than 1900.";
      }
    }

    // Validate Departure Date
    if (!selectedDate && !customDateInput) {
      errors.departureDate = "Please select your trip departure date.";
    }

    // Validate reCAPTCHA in production
    const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    const activeToken =
      captchaToken ||
      (process.env.NODE_ENV === "development" ? "dev-dummy-captcha-token" : null);

    if (!activeToken && process.env.NODE_ENV === "production" && recaptchaSiteKey) {
      errors.captcha = "Please complete the reCAPTCHA verification.";
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Auto-focus & smooth scroll to the first invalid field
      if (errors.fullName) {
        fullNameInputRef.current?.focus();
        fullNameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.email) {
        emailInputRef.current?.focus();
        emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.phoneNumber) {
        phoneInputRef.current?.focus();
        phoneInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (errors.dateOfBirth) {
        dateOfBirthInputRef.current?.focus();
        dateOfBirthInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setErrorMessage(
        errors.captcha ||
          errors.departureDate ||
          "Some fields contain errors. Please review the highlighted fields."
      );
      return false;
    }

    setErrorMessage(null);
    return true;
  };

  const executeBookingProcess = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const activeToken =
        captchaToken ||
        (process.env.NODE_ENV === "development" ? "dev-dummy-captcha-token" : null);

      const targetTripId = selectedTripId || `trip-ondemand-${Date.now()}`;
      const payload = {
        tripId: targetTripId,
        destinationId: destination.id,
        bookingGroupId: selectedGroup || undefined,
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        nationality: nationality.trim(),
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : undefined,
        healthNotes: healthNotes?.trim() || undefined,
        departureDate: selectedDate || customDateInput,
        pickupLocation:
          pickupPlaceName && pickupLocation && !pickupLocation.toLowerCase().includes(pickupPlaceName.toLowerCase())
            ? `${pickupPlaceName} (${pickupLocation})`
            : pickupLocation || pickupPlaceName || undefined,
        pickupLatitude: pickupLatitude,
        pickupLongitude: pickupLongitude,
        pickupNotes: pickupNotes?.trim() || undefined,
        captchaToken: activeToken || "dev-dummy-captcha-token",
      };

      const result = await bookingService.createBooking(payload);

      setCreatedParticipantId(result.participant.id);
      setCreatedBooking(result.participant);
      setIsPaymentModalOpen(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process tour booking.";
      setErrorMessage(errorMsg);
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateBookingForm();
    if (!isValid) return;

    // Check if traveler date of birth is empty -> prompt insurance confirmation
    if (!dateOfBirth) {
      setIsInsuranceWarningOpen(true);
      return;
    }

    await executeBookingProcess();
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
              Back to Catalog
            </Link>
          </Button>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="coral" className="text-xs font-bold px-3 py-1 shadow-md">
                Max 6 Pax Sharing Tour
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
                {destination.location || "Yogyakarta"}
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
                  About This Tour
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                  {destination.description}
                </p>
              </div>

              {/* USP Badges */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-4 border-t border-slate-100">
                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#00677d]/5 border border-[#00677d]/10 text-center flex flex-col items-center justify-center">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#00677d] mx-auto mb-1 sm:mb-1.5 shrink-0" />
                  <span className="font-heading font-bold text-[10px] sm:text-xs text-[#00677d] block leading-tight">Max 6 Guests</span>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 leading-tight block mt-0.5">Spacious & comfortable</span>
                </div>
                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[#ff7f50]/5 border border-[#ff7f50]/10 text-center flex flex-col items-center justify-center">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-[#ff7f50] mx-auto mb-1 sm:mb-1.5 shrink-0" />
                  <span className="font-heading font-bold text-[10px] sm:text-xs text-[#ff7f50] block leading-tight">Shared Cost</span>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 leading-tight block mt-0.5">Save up to 60%</span>
                </div>
                <div className="p-2 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center flex flex-col items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mx-auto mb-1 sm:mb-1.5 shrink-0" />
                  <span className="font-heading font-bold text-[10px] sm:text-xs text-emerald-600 block leading-tight">Guaranteed</span>
                  <span className="text-[8px] sm:text-[10px] text-slate-500 leading-tight block mt-0.5">Departs even with 1 pax</span>
                </div>
              </div>

              {/* Included / Excluded List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Included Facilities
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
                    Not Included
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
                  Tour Gallery & Atmosphere
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {destination.galleryImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 group shadow-sm"
                    >
                      <Image
                        src={getImageUrl(imgUrl)}
                        alt={`Gallery ${getDestinationTitle(destination)} ${idx + 1}`}
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
                    Meeting Point / Pickup Base
                  </span>
                  <h3 className="font-heading font-extrabold text-base text-[#191c1e] mt-0.5">
                    {destination.meetingPoint}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Driver will be ready at the meeting point 30 minutes before departure time.
                  </p>
                </div>
              </div>
            )}

            {/* Itinerary Timeline Card */}
            {Array.isArray(destination.itinerary) && destination.itinerary.length > 0 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-6">
                <h2 className="font-heading font-extrabold text-xl text-[#191c1e]">
                  Tour Itinerary
                </h2>
                <div className="space-y-6">
                  {destination.itinerary.map((day) => (
                    <div key={day.day} className="relative pl-6 sm:pl-8 border-l-2 border-[#00677d]/20 pb-4 last:pb-0">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-[#00677d] border-2 border-white shadow-sm" />
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#ff7f50]">
                          Day {day.day}
                        </span>
                        <h3 className="font-heading font-bold text-base text-[#191c1e]">
                          {day.title}
                        </h3>
                        {day.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {day.description}
                          </p>
                        )}
                        {(() => {
                          const acts: string[] = Array.isArray(day.activities)
                            ? day.activities
                            : typeof (day as unknown as { activities: unknown })?.activities === "string"
                            ? ((day as unknown as { activities: string }).activities as string)
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : [];
                          return (
                            acts.length > 0 && (
                              <ul className="space-y-1.5 pt-2">
                                {acts.map((act, actIdx) => (
                                  <li key={actIdx} className="text-xs text-slate-500 flex items-start gap-2">
                                    <Clock className="h-3.5 w-3.5 text-[#00677d] mt-0.5 shrink-0" />
                                    <span>{act}</span>
                                  </li>
                                ))}
                              </ul>
                            )
                          );
                        })()}
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
                  <span className="text-xs text-slate-500 block">Price Per Person (Sharing):</span>
                  <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#a43c12]">
                    {formatCurrency(basePrice)}
                  </span>
                </div>
                <Badge variant="coral" className="text-xs font-bold">
                  All-in Package
                </Badge>
              </div>

              {/* STEP 1: DATE SELECTION & CALENDAR (GetYourGuide Model) */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    1. Select Departure Date
                  </label>
                  {isCustomDateMode ? (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-800 font-bold">
                      Trip Initiator
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-[10px] font-bold">
                      Scheduled Active Trip
                    </Badge>
                  )}
                </div>

                {/* Primary Interactive Date Selector Trigger */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-slate-200 hover:border-[#00677d] bg-white transition-all shadow-sm hover:shadow text-left flex items-center justify-between group active:scale-[0.99]"
                    aria-expanded={isCalendarOpen}
                    aria-label="Open date selection calendar"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-11 w-11 rounded-2xl bg-teal-50 text-[#00677d] flex items-center justify-center font-bold shrink-0 group-hover:bg-[#00677d] group-hover:text-white transition-colors shadow-inner">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Selected Trip Date
                        </span>
                        <span className="font-heading font-extrabold text-sm sm:text-base text-[#191c1e] truncate block">
                          {selectedDate || customDateInput
                            ? formatDate(selectedDate || customDateInput)
                            : "Tap to select date..."}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-[#00677d] hidden sm:inline-block">
                        {isCalendarOpen ? "Close Calendar" : "Select on Calendar"}
                      </span>
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-teal-50 group-hover:text-[#00677d] transition">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isCalendarOpen ? "rotate-180 text-[#00677d]" : ""
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {/* Interactive GetYourGuide-Style Calendar (Mobile 1-Month / Desktop 2-Months) */}
                  {isCalendarOpen && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <TripCalendarPicker
                        selectedDate={selectedDate || customDateInput}
                        minDate={minCustomDate}
                        trips={trips}
                        pricePerPax={destination ? getDestinationPrice(destination) : 850000}
                        onSelectDate={(dateStr, matchedTrip) => {
                          if (matchedTrip) {
                            handleSelectTrip(matchedTrip);
                          } else {
                            handleCustomDateChange(dateStr);
                          }
                          setIsCalendarOpen(false);
                        }}
                        onClose={() => setIsCalendarOpen(false)}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Shortcuts: Upcoming Scheduled Trips */}
                {trips.length > 0 && !isCalendarOpen && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 block">
                      Upcoming Scheduled Trips:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trips.slice(0, 4).map((trp) => {
                        const isSelected = selectedTripId === trp.id && !isCustomDateMode;
                        const totalParticipants =
                          trp.groups && trp.groups.length > 0
                            ? trp.groups.reduce(
                                (acc, g) =>
                                  acc +
                                  (Number(g.currentParticipants) ||
                                    (Array.isArray(g.participants) ? g.participants.length : 0)),
                                0
                              )
                            : Number(trp.currentParticipants || trp.current_participants || 0);

                        const totalCapacity =
                          trp.groups && trp.groups.length > 0
                            ? trp.groups.reduce(
                                (acc, g) => acc + (Number(g.capacity || g.maxParticipants) || 6),
                                0
                              )
                            : Number(
                                trp.maxParticipants ||
                                  trp.max_participants ||
                                  (trp.maxGroups ? trp.maxGroups * 6 : 6)
                              );

                        const remainingSeats = Math.max(0, totalCapacity - totalParticipants);
                        const fleetCount =
                          trp.groups && trp.groups.length > 0 ? trp.groups.length : trp.maxGroups || 1;

                        return (
                          <button
                            key={trp.id}
                            type="button"
                            onClick={() => handleSelectTrip(trp)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-[#00677d] bg-teal-50/70 ring-1 ring-[#00677d] shadow-sm font-bold"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="font-heading font-bold text-xs text-[#191c1e] block">
                                {formatDate(trp.departureDate)}
                              </span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Clock className="h-3 w-3 text-[#00677d]" />
                                to {formatDate(trp.returnDate)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] font-extrabold text-[#00677d] block">
                                {remainingSeats > 0 ? `${remainingSeats} left` : "Sold Out"}
                              </span>
                              <span className="text-[9px] text-slate-400">
                                {fleetCount} Fleet
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Initiator Info Callout */}
                {isCustomDateMode && (selectedDate || customDateInput) && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <CalendarPlus className="h-4 w-4 text-[#ff7f50]" />
                      <span>Be the Trip Initiator!</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-normal">
                      No group is active on <strong>{formatDate(selectedDate || customDateInput)}</strong> yet.
                      Your booking will automatically initiate new <strong>Vehicle Group #1</strong>, allowing other travelers to join!
                    </p>
                  </div>
                )}
              </div>

              {/* STEP 2: GROUP AVAILABILITY VISUALIZER */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                  <Car className="h-4 w-4" />
                  2. Select Vehicle Group (Max 6 Guests)
                </label>

                {isLoadingAvailability ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center space-x-2 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00677d]" />
                    <span>Loading vehicle group slots...</span>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    A new vehicle group will be created automatically upon first booking.
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
                              {grp.name || `Vehicle Group #${grp.groupNumber}`}
                            </span>
                            <span className={isFull ? "text-rose-600" : "text-[#00677d]"}>
                              {grp.currentParticipants} / {maxCap} Seats
                              {isFull ? " (Full)" : ` (${maxCap - grp.currentParticipants} left)`}
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
                  3. Lead Guest Details
                </label>

                {/* Insurance Notice Banner */}
                <div className="p-3 rounded-xl bg-sky-50/80 border border-sky-200/80 text-[11px] text-sky-900 flex items-start gap-2">
                  <Info className="h-4 w-4 text-[#00677d] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Notice:</strong> Full name, date of birth, and nationality are used for issuing <strong>complimentary travel insurance</strong> for your safety and comfort.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Lead Guest Full Name *
                  </label>
                  <Input
                    ref={fullNameInputRef}
                    required
                    placeholder="As shown on Passport / ID"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: "" }));
                    }}
                    className={`text-xs transition-colors ${
                      fieldErrors.fullName
                        ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Email *
                    </label>
                    <Input
                      ref={emailInputRef}
                      required
                      type="email"
                      placeholder="traveler@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={`text-xs transition-colors ${
                        fieldErrors.email
                          ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      WhatsApp / Phone *
                    </label>
                    <Input
                      ref={phoneInputRef}
                      required
                      placeholder="+62 812 3456 7890"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        if (fieldErrors.phoneNumber) setFieldErrors((prev) => ({ ...prev, phoneNumber: "" }));
                      }}
                      className={`text-xs transition-colors ${
                        fieldErrors.phoneNumber
                          ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                        Date of Birth
                      </label>
                      <span className="text-[10px] text-slate-400 font-normal lowercase">
                        (for insurance)
                      </span>
                    </div>
                    <Input
                      ref={dateOfBirthInputRef}
                      type="date"
                      min="1900-01-01"
                      max={new Date().toISOString().split("T")[0]}
                      value={dateOfBirth}
                      onChange={(e) => {
                        setDateOfBirth(e.target.value);
                        if (fieldErrors.dateOfBirth) setFieldErrors((prev) => ({ ...prev, dateOfBirth: "" }));
                      }}
                      className={`text-xs transition-colors ${
                        fieldErrors.dateOfBirth
                          ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    />
                    {fieldErrors.dateOfBirth ? (
                      <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                        <AlertCircle className="h-3 w-3 shrink-0" />
                        {fieldErrors.dateOfBirth}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">
                        Required for insurance policy claim (optional if you decline insurance).
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="nationality-select" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Nationality
                    </label>
                    <select
                      id="nationality-select"
                      aria-label="Select guest nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                    >
                      <option value="Indonesia">Indonesia</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Australia">Australia</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other / International</option>
                    </select>
                  </div>
                </div>

                {/* INFORMASI PENJEMPUTAN (GOOGLE PLACES AUTOCOMPLETE) */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    Pickup Location Details
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Pickup Address / Landmark
                    </label>
                    <GooglePlacesAutocomplete
                      value={pickupLocation}
                      placeName={pickupPlaceName}
                      latitude={pickupLatitude}
                      longitude={pickupLongitude}
                      onChange={(sel) => {
                        setPickupLocation(sel.address);
                        setPickupPlaceName(sel.placeName || "");
                        setPickupLatitude(sel.latitude);
                        setPickupLongitude(sel.longitude);
                      }}
                      placeholder="Search hotel name, train station, airport, or address..."
                    />
                    <span className="text-[10px] text-slate-400 block">
                      Our fleet driver will pick you up directly at your hotel lobby or designated address in Yogyakarta.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      Special Pickup Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Waiting at hotel lobby near reception, traveling with 2 suitcases."
                      value={pickupNotes}
                      onChange={(e) => setPickupNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00677d] focus:bg-white focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Health & Special Notes */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Health & Dietary Notes (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Food allergies, motion sickness, asthma, etc."
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                {/* Price Breakdown Summary */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Selected Date:</span>
                    <span className="font-bold text-[#00677d]">
                      {selectedDate ? formatDate(selectedDate) : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Sharing Tour Ticket:</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#191c1e] pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="font-heading font-extrabold text-[#a43c12]">
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Google reCAPTCHA v2 Checkbox Widget */}
                {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                  <div className="my-3 flex flex-col items-center justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                      onChange={(token) => setCaptchaToken(token)}
                      onExpired={() => setCaptchaToken(null)}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full justify-center font-bold text-sm shadow-md"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Processing Booking..." : "Continue to Payment"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* TRAVEL INSURANCE CONFIRMATION WARNING MODAL */}
      <Dialog open={isInsuranceWarningOpen} onOpenChange={setIsInsuranceWarningOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-slate-100 shadow-2xl">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="font-heading font-bold text-lg text-slate-900">
                Travel Insurance Notice
              </DialogTitle>
              <span className="text-[11px] font-semibold text-amber-700">
                Passenger Safety Protection
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
            Date of birth was left blank. Date of birth is required to issue your complimentary <strong>travel insurance policy</strong>. If omitted, your trip will proceed <strong>without insurance coverage</strong>.
          </DialogDescription>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 mt-2 font-medium">
            Are you sure you want to proceed to payment without insurance?
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsInsuranceWarningOpen(false);
                setTimeout(() => {
                  dateOfBirthInputRef.current?.focus();
                  dateOfBirthInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 150);
              }}
              className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel (Add Birth Date)
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setIsInsuranceWarningOpen(false);
                executeBookingProcess();
              }}
              className="text-xs font-bold bg-[#00677d] hover:bg-[#005264] text-white shadow-sm"
            >
              Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MIDTRANS SNAP PAYMENT SIMULATION MODAL */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <div className="bg-[#00677d] p-5 text-white">
            <Badge variant="coral" className="text-[10px] font-bold uppercase mb-1">
              Midtrans Payment Gateway
            </Badge>
            <DialogTitle className="font-heading font-extrabold text-xl text-white">
              Complete Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-100">
              Choose an instant and secure payment method to lock in your tour seat.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Amount:</span>
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
                Payment Method
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
                  <Badge variant="success" className="text-[9px]">Instant</Badge>
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
                  <span className="text-[11px] text-slate-400">Automatic</span>
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
                    <span>Credit / Debit Card (Visa / Mastercard)</span>
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
                  Scan the QRIS code above with your mobile banking or e-wallet app.
                </p>
              </div>
            )}

            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              size="lg"
              className="w-full justify-center font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md"
            >
              {isProcessingPayment ? "Verifying Transaction..." : "I Have Paid (Simulate Success)"}
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
              Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-100 max-w-xs mx-auto">
              Your payment has been successfully verified. Your sharing tour seat is officially secured.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5">
            {/* Booking Code Highlight */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Your Official Booking Code
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-2xl font-black text-[#00677d] tracking-widest">
                  {createdBooking?.bookingCode || "TRV-SUCCESS"}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(createdBooking?.bookingCode || "TRV-SUCCESS")}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#00677d] transition-colors shadow-sm no-print"
                  title="Copy Booking Code"
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
                  Booking code copied to clipboard!
                </span>
              )}
            </div>

            {/* Trip & Group Info Summary */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-800">{getDestinationTitle(destination)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Departure Date:</span>
                <span className="font-bold text-[#00677d]">
                  {formatDate(selectedDate || customDateInput)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Fleet Allocation:</span>
                <span className="font-bold text-slate-800">
                  {createdBooking?.group?.name || `Vehicle Group #${createdBooking?.group?.groupNumber || 1}`} (Max 6 Pax)
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Lead Guest:</span>
                <span className="font-bold text-slate-800">{fullName}</span>
              </div>
              {(createdBooking?.pickupLocation || pickupLocation) && (() => {
                const rawLoc = createdBooking?.pickupLocation || pickupLocation;
                const parsed = parsePickupLocation(rawLoc);
                return (
                  <div className="py-2 border-b border-slate-100 space-y-1">
                    <div className="flex justify-between items-start text-xs">
                      <span className="text-slate-500 shrink-0">Pickup Location:</span>
                      <span className="font-extrabold text-[#00677d] text-right ml-2 max-w-[220px]">
                        {parsed.placeName}
                      </span>
                    </div>
                    {parsed.address && (
                      <div className="text-[11px] text-slate-500 text-right">
                        {parsed.address}
                      </div>
                    )}
                    {(createdBooking?.pickupNotes || pickupNotes) && (
                      <div className="text-[10px] text-slate-400 italic text-right">
                        Notes: {createdBooking?.pickupNotes || pickupNotes}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Payment Status:</span>
                <Badge variant="success" className="text-[10px] font-bold">CONFIRMED / PAID</Badge>
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
                Open E-Voucher in My Bookings
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const destTitle = getDestinationTitle(destination);
                    printTicketVoucher({
                      bookingCode: createdBooking?.bookingCode || "TRV-SUCCESS",
                      destinationTitle: destTitle,
                      fullName: createdBooking?.fullName || fullName || "Traveler",
                      identityNumber: createdBooking?.identityNumber,
                      dateOfBirth: createdBooking?.dateOfBirth || dateOfBirth || undefined,
                      groupNumber: createdBooking?.group?.groupNumber || 1,
                      driverName: createdBooking?.group?.driver?.fullName,
                      vehicleModel: createdBooking?.group?.driver?.vehicleModel,
                      plateNumber: createdBooking?.group?.driver?.plateNumber,
                      departureDate: formatDate(selectedDate || customDateInput),
                      pickupLocation: createdBooking?.pickupLocation || pickupLocation || undefined,
                      pickupNotes: createdBooking?.pickupNotes || pickupNotes || undefined,
                    });
                  }}
                  className="flex-1 text-xs font-semibold gap-1.5 text-slate-600"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Receipt
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
                  Explore More Tours
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

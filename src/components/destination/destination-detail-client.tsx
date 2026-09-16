"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
  PackageOpen,
  Clock,
  Car,
  Copy,
  Check,
  Ticket,
  Printer,
  ShieldAlert,
  Info,
  Trash2,
  UserPlus,
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
  calculateOccupancyPercent,
  getDestinationTitle,
  getDestinationPrice,
  formatDate,
  getImageUrl,
  parsePickupLocation,
  sanitizePhoneNumber,
  getEarliestBookingDate,
} from "@/src/lib/utils";
import { printTicketVoucher } from "@/src/lib/ticket-printer";
import { TripCalendarPicker } from "@/src/components/destination/trip-calendar-picker";
import { GooglePlacesAutocomplete } from "@/src/components/ui/google-places-autocomplete";
import { CountryCombobox } from "@/src/components/ui/country-combobox";
import {
  hasCountryConflict,
  findConflictingCountriesInGroup,
  isGroupCompatibleWithTraveler,
  isGroupCompatibleWithMultipleTravelers,
  findBestCompatibleGroup,
  checkInternalBookingConflicts,
  canonicalizeCountry,
} from "@/src/lib/country-conflict";
import type { Destination, BookingGroup, Trip, Participant, BulkBookingPayload, CreateBookingPayload } from "@/src/types";

export interface BookingItemState {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  nationality: string;
  gender: "male" | "female" | "other" | "";
  pickupLocation: string;
  pickupPlaceName: string;
  pickupLatitude?: number;
  pickupLongitude?: number;
  pickupNotes: string;
  healthNotes: string;
  usePrimaryPickup: boolean;
}

const createDefaultBookingItem = (isPrimary = false): BookingItemState => ({
  id: Math.random().toString(36).substring(2, 9),
  fullName: "",
  email: "",
  phoneNumber: "",
  dateOfBirth: "",
  nationality: "Indonesia",
  gender: "",
  pickupLocation: "",
  pickupPlaceName: "",
  pickupLatitude: undefined,
  pickupLongitude: undefined,
  pickupNotes: "",
  healthNotes: "",
  usePrimaryPickup: !isPrimary,
});

interface DestinationDetailClientProps {
  initialDestination: Destination | null;
  slug?: string;
}

export function DestinationDetailClient({ initialDestination }: DestinationDetailClientProps) {
  const router = useRouter();
  const [destination] = useState<Destination | null>(initialDestination);

  // Step 1: Trip & Date Selection State
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);
  const [customDateInput, setCustomDateInput] = useState("");

  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [, setIsLoadingAvailability] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 2: Multi-Booking / Dynamic Guest Items State
  const [bookingItems, setBookingItems] = useState<BookingItemState[]>([
    createDefaultBookingItem(true),
  ]);

  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Field-level Validation Errors & DOM element refs for instant focus/scrolling
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const itemInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Travel Insurance Warning Modal State
  const [isInsuranceWarningOpen, setIsInsuranceWarningOpen] = useState(false);

  // Midtrans Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"qris" | "bca_va" | "mandiri_va" | "credit_card">("qris");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [createdParticipants, setCreatedParticipants] = useState<Participant[]>([]);
  const [createdParticipantId, setCreatedParticipantId] = useState<string>("");
  const [createdBooking, setCreatedBooking] = useState<Participant | null>(null);

  // Success Confirmation Dialog State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Min date for booking based on 19:00 WIB cutoff
  const earliestBooking = useMemo(() => getEarliestBookingDate(), []);
  const minCustomDate = earliestBooking.dateISO;

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

        // Filter trips that are strictly >= minCustomDate (respecting 19:00 WIB cutoff)
        const validTrips = loadedTrips.filter((t) => {
          if (!t.departureDate) return false;
          return t.departureDate.split("T")[0] >= minCustomDate;
        });

        if (validTrips.length > 0) {
          const firstTrip = validTrips[0];
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
          // No existing valid trips scheduled yet, switch to initiator mode starting at earliest valid date
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
    setSelectedTripId(trip.id);
    setSelectedDate(trip.departureDate);
    setIsCustomDateMode(false);
    setCustomDateInput("");

    if (fieldErrors.departureDate) {
      setFieldErrors((prev) => ({ ...prev, departureDate: "" }));
    }

    setIsLoadingAvailability(true);
    try {
      const liveGroups = await destinationService.getTripAvailability(trip.id);
      if (liveGroups && liveGroups.length > 0) {
        setGroups(liveGroups);
        const openGroup = liveGroups.find(
          (g) => g.status === "open" && (g.currentParticipants || 0) < (g.capacity || 6)
        );
        setSelectedGroup(openGroup ? openGroup.id : liveGroups[0].id);
      } else {
        setGroups(trip.groups || []);
        if (trip.groups && trip.groups.length > 0) {
          setSelectedGroup(trip.groups[0].id);
        }
      }
    } catch {
      setGroups(trip.groups || []);
      if (trip.groups && trip.groups.length > 0) {
        setSelectedGroup(trip.groups[0].id);
      }
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // Handle choosing custom on-demand date
  const handleCustomDateSelect = (dateStr: string) => {
    setIsCustomDateMode(true);
    setSelectedTripId("");
    setSelectedDate(dateStr);
    setCustomDateInput(dateStr);

    if (fieldErrors.departureDate) {
      setFieldErrors((prev) => ({ ...prev, departureDate: "" }));
    }

    setGroups([
      {
        id: `grp-initiator-${Date.now()}`,
        tripId: "trip-custom",
        groupNumber: 1,
        capacity: 6,
        currentParticipants: 0,
        status: "open",
        name: "New Date Initiator Group",
        notes: "New Group - Your booking will open this trip schedule!",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setSelectedGroup(`grp-initiator-${Date.now()}`);
  };

  // Multi-Booking Item Handlers
  const handleAddBooking = () => {
    const maxAllowed = 20;
    if (bookingItems.length >= maxAllowed) {
      setErrorMessage(`Maximum booking limit in a single transaction is ${maxAllowed} travelers.`);
      return;
    }

    const primary = bookingItems[0];
    const newItem = createDefaultBookingItem(false);
    if (primary) {
      newItem.pickupLocation = primary.pickupLocation;
      newItem.pickupPlaceName = primary.pickupPlaceName;
      newItem.pickupLatitude = primary.pickupLatitude;
      newItem.pickupLongitude = primary.pickupLongitude;
      newItem.pickupNotes = primary.pickupNotes;
    }

    setBookingItems((prev) => [...prev, newItem]);
    setErrorMessage(null);
  };

  const handleRemoveBooking = (index: number) => {
    if (bookingItems.length <= 1) return;
    setBookingItems((prev) => prev.filter((_, i) => i !== index));

    // Clear any validation errors tied to this index
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`item_${index}_`)) {
          delete next[k];
        }
      });
      return next;
    });
  };

  const handleUpdateItem = <K extends keyof BookingItemState>(
    index: number,
    field: K,
    value: BookingItemState[K]
  ) => {
    setBookingItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // If updating primary traveler's pickup, also update items using primary pickup
      if (index === 0 && (field === "pickupLocation" || field === "pickupPlaceName" || field === "pickupLatitude" || field === "pickupLongitude" || field === "pickupNotes")) {
        for (let i = 1; i < updated.length; i++) {
          if (updated[i].usePrimaryPickup) {
            updated[i] = {
              ...updated[i],
              [field]: value,
            };
          }
        }
      }

      updated[index] = item;
      return updated;
    });

    const errorKey = `item_${index}_${String(field)}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  if (!destination) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <PackageOpen className="h-16 w-16 text-slate-300 mb-4 animate-bounce" />
        <h2 className="text-xl font-heading font-extrabold text-slate-800">
          Destination Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          The travel destination you are looking for may have been deactivated or the link is invalid.
        </p>
        <Button asChild className="mt-6 font-bold text-xs bg-[#00677d]">
          <Link href="/destinations">
            <ArrowLeft className="h-4 w-4" />
            Back to Destination Catalog
          </Link>
        </Button>
      </div>
    );
  }

  // Active trip & Pricing Calculation
  const destinationPrice = getDestinationPrice(destination);
  const activeTrip = trips.find((t) => t.id === selectedTripId);
  const basePrice = (activeTrip?.pricePerPax && activeTrip.pricePerPax > 0)
    ? activeTrip.pricePerPax
    : destinationPrice;
  const totalAmount = basePrice * bookingItems.length;

  // Evaluasi Konflik Geopolitik & Alokasi Armada Cerdas
  const requestedNationalities = useMemo(() => {
    return bookingItems.map((b) => b.nationality || "Indonesia");
  }, [bookingItems]);

  const internalBookingConflict = useMemo(() => {
    return checkInternalBookingConflicts(requestedNationalities);
  }, [requestedNationalities]);

  const compatibleGroup = useMemo(() => {
    if (!groups || groups.length === 0) return null;
    return findBestCompatibleGroup(groups, requestedNationalities, bookingItems.length);
  }, [groups, requestedNationalities, bookingItems.length]);

  const currentDefaultGroup = groups[0] || null;
  const currentDefaultGroupConflicts = useMemo(() => {
    if (!currentDefaultGroup) return [];
    const parts = currentDefaultGroup.participants || [];
    const allFound = new Set<string>();
    for (const nat of requestedNationalities) {
      const confs = findConflictingCountriesInGroup(nat, parts);
      confs.forEach((c) => allFound.add(c));
    }
    return Array.from(allFound);
  }, [currentDefaultGroup, requestedNationalities]);

  const isSmartSegregationActive = currentDefaultGroupConflicts.length > 0;

  const validateBookingForm = (): boolean => {
    const errors: Record<string, string> = {};
    let firstErrorRefKey: string | null = null;

    // Validate Departure Date based on cutoff 19:00 WIB
    const earliest = getEarliestBookingDate();
    const targetDate = (selectedDate || customDateInput || "").split("T")[0];
    if (!targetDate) {
      errors.departureDate = "Please select a trip departure date in Step 1.";
    } else if (targetDate < earliest.dateISO) {
      errors.departureDate = earliest.isAfterCutoff
        ? `Booking cutoff for tomorrow's trip is closed (19:00 WIB / UTC+7). Please select a date on or after ${formatDate(earliest.dateISO)}.`
        : `Departure date cannot be earlier than ${formatDate(earliest.dateISO)}.`;
    }

    // Validate each booking item
    bookingItems.forEach((item, index) => {
      const labelPrefix = bookingItems.length > 1 ? `Traveler #${index + 1}: ` : "";

      // Full Name (Min 2, Max 100, safe characters)
      const trimmedName = item.fullName.trim();
      const nameKey = `item_${index}_fullName`;
      if (!trimmedName) {
        errors[nameKey] = `${labelPrefix}Full name is required.`;
        if (!firstErrorRefKey) firstErrorRefKey = nameKey;
      } else if (trimmedName.length < 2 || trimmedName.length > 100) {
        errors[nameKey] = `${labelPrefix}Full name must be between 2 and 100 characters.`;
        if (!firstErrorRefKey) firstErrorRefKey = nameKey;
      } else if (!/^[a-zA-Z\s.'\-,]+$/u.test(trimmedName)) {
        errors[nameKey] = `${labelPrefix}Full name can only contain letters, spaces, and valid name punctuation.`;
        if (!firstErrorRefKey) firstErrorRefKey = nameKey;
      }

      // Email (Required for primary traveler; optional for additional, but RFC if provided)
      const trimmedEmail = item.email.trim();
      const emailKey = `item_${index}_email`;
      if (index === 0 && !trimmedEmail) {
        errors[emailKey] = "Primary traveler's email address is required.";
        if (!firstErrorRefKey) firstErrorRefKey = emailKey;
      } else if (trimmedEmail && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmedEmail)) {
        errors[emailKey] = `${labelPrefix}Invalid email address format (e.g. traveler@domain.com).`;
        if (!firstErrorRefKey) firstErrorRefKey = emailKey;
      }

      // Phone / WhatsApp Number (Required, 8 to 20 digits)
      const trimmedPhone = item.phoneNumber.trim();
      const cleanPhoneDigits = trimmedPhone.replace(/[\s\-()]/g, "");
      const phoneKey = `item_${index}_phoneNumber`;
      if (!trimmedPhone) {
        errors[phoneKey] = `${labelPrefix}WhatsApp / phone number is required.`;
        if (!firstErrorRefKey) firstErrorRefKey = phoneKey;
      } else if (/[a-zA-Z]/.test(trimmedPhone)) {
        errors[phoneKey] = `${labelPrefix}Phone number cannot contain alphabetic characters.`;
        if (!firstErrorRefKey) firstErrorRefKey = phoneKey;
      } else if (!/^\+?[0-9]{8,20}$/.test(cleanPhoneDigits)) {
        errors[phoneKey] = `${labelPrefix}Phone number must be between 8 and 20 valid digits (e.g. +6281234567890).`;
        if (!firstErrorRefKey) firstErrorRefKey = phoneKey;
      }

      // Date of Birth (Optional, but if filled must be valid ISO date)
      if (item.dateOfBirth) {
        const birthDateObj = new Date(item.dateOfBirth);
        const today = new Date();
        const minDate = new Date("1900-01-01");
        const dobKey = `item_${index}_dateOfBirth`;
        if (isNaN(birthDateObj.getTime()) || !/^\d{4}-\d{2}-\d{2}$/.test(item.dateOfBirth)) {
          errors[dobKey] = `${labelPrefix}Invalid date of birth format (YYYY-MM-DD).`;
          if (!firstErrorRefKey) firstErrorRefKey = dobKey;
        } else if (birthDateObj > today) {
          errors[dobKey] = `${labelPrefix}Date of birth cannot be in the future.`;
          if (!firstErrorRefKey) firstErrorRefKey = dobKey;
        } else if (birthDateObj < minDate) {
          errors[dobKey] = `${labelPrefix}Date of birth cannot be earlier than year 1900.`;
          if (!firstErrorRefKey) firstErrorRefKey = dobKey;
        }
      }
    });

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
      if (firstErrorRefKey && itemInputRefs.current[firstErrorRefKey]) {
        itemInputRefs.current[firstErrorRefKey]?.focus();
        itemInputRefs.current[firstErrorRefKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      setErrorMessage(
        errors.captcha ||
        errors.departureDate ||
        "Some fields contain invalid data. Please review the highlighted fields in red."
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
      const primaryItem = bookingItems[0];

      // Pada alur pemesanan publik, jangan kirimkan bookingGroupId statis agar backend auto-assigner
      // dapat mengevaluasi seluruh data peserta di database dan secara mutlak mengalokasikan armada yang bebas konflik atau membuka armada baru.
      const effectiveTargetGroupId = undefined;

      const bulkPayload: BulkBookingPayload = {
        captchaToken: activeToken || "dev-dummy-captcha-token",
        bookings: bookingItems.map((item, idx) => {
          const isUsePrimary = idx > 0 && item.usePrimaryPickup;
          const pLoc = isUsePrimary ? primaryItem.pickupLocation : item.pickupLocation;
          const pPlace = isUsePrimary ? primaryItem.pickupPlaceName : item.pickupPlaceName;
          const pLat = isUsePrimary ? primaryItem.pickupLatitude : item.pickupLatitude;
          const pLng = isUsePrimary ? primaryItem.pickupLongitude : item.pickupLongitude;
          const pNotes = isUsePrimary ? primaryItem.pickupNotes : item.pickupNotes;

          const effectivePickup =
            pPlace && pLoc && !pLoc.toLowerCase().includes(pPlace.toLowerCase())
              ? `${pPlace} (${pLoc})`
              : pLoc || pPlace || undefined;

          return {
            tripId: targetTripId,
            destinationId: destination.id,
            bookingGroupId: effectiveTargetGroupId,
            fullName: item.fullName.trim(),
            email: item.email?.trim() || primaryItem.email.trim(),
            phoneNumber: sanitizePhoneNumber(item.phoneNumber),
            nationality: item.nationality?.trim() || "Indonesia",
            dateOfBirth: item.dateOfBirth ? item.dateOfBirth.trim() : undefined,
            gender: (item.gender as "male" | "female" | "other") || undefined,
            healthNotes: item.healthNotes?.trim() || undefined,
            departureDate: selectedDate || customDateInput,
            pickupLocation: effectivePickup,
            pickupLatitude: pLat,
            pickupLongitude: pLng,
            pickupNotes: pNotes?.trim() || undefined,
          };
        }),
      };

      if (bookingItems.length === 1) {
        // Single item booking with bulk endpoint or fallback
        try {
          const bulkRes = await bookingService.createBulkBooking(bulkPayload);
          setCreatedParticipants(bulkRes.participants);
          setCreatedParticipantId(bulkRes.participants[0]?.id || "");
          setCreatedBooking(bulkRes.participants[0] || null);
          setIsPaymentModalOpen(true);
        } catch {
          const singlePayload: CreateBookingPayload = {
            ...bulkPayload.bookings[0],
            captchaToken: activeToken || "dev-dummy-captcha-token",
          };
          const singleRes = await bookingService.createBooking(singlePayload);
          setCreatedParticipants([singleRes.participant]);
          setCreatedParticipantId(singleRes.participant.id);
          setCreatedBooking(singleRes.participant);
          setIsPaymentModalOpen(true);
        }
      } else {
        // Multi-Item Bulk Booking
        const bulkRes = await bookingService.createBulkBooking(bulkPayload);
        setCreatedParticipants(bulkRes.participants);
        setCreatedParticipantId(bulkRes.participants[0]?.id || "");
        setCreatedBooking(bulkRes.participants[0] || null);
        setIsPaymentModalOpen(true);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to process ticket booking.";
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

    // Check if any traveler date of birth is empty -> prompt insurance confirmation
    const hasEmptyDob = bookingItems.some((item) => !item.dateOfBirth);
    if (hasEmptyDob) {
      setIsInsuranceWarningOpen(true);
      return;
    }

    await executeBookingProcess();
  };

  const handleConfirmPayment = async () => {
    setIsProcessingPayment(true);
    try {
      if (createdParticipants.length > 0) {
        await Promise.allSettled(
          createdParticipants.map((p) => bookingService.simulatePaymentSettlement(p.id))
        );
        setCreatedParticipants((prev) =>
          prev.map((p) => ({ ...p, paymentStatus: "paid" }))
        );
        setCreatedBooking((prev) => (prev ? { ...prev, paymentStatus: "paid" } : null));
      } else if (createdParticipantId) {
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

  const handleCopyCode = (code: string, index: number) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const inclusions = destination.inclusions || destination.includedFacilities || [];
  const exclusions = destination.exclusions || destination.excludedFacilities || [];
  const durationText =
    destination.durationDays && destination.durationNights
      ? `${destination.durationDays}D / ${destination.durationNights}N`
      : destination.durationDays
      ? `${destination.durationDays} Days`
      : "1 Day";

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 text-slate-900">
      {/* HEADER HERO BANNER */}
      <div className="relative h-[320px] sm:h-[420px] w-full bg-slate-900 overflow-hidden">
        <Image
          src={getImageUrl(destination.coverImage || destination.galleryImages?.[0])}
          alt={getDestinationTitle(destination)}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />

        <div className="absolute top-6 left-6 z-10">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 backdrop-blur-md text-xs font-bold gap-1.5"
          >
            <Link href="/destinations">
              <ArrowLeft className="h-4 w-4" />
              Back to Catalog
            </Link>
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-10 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="coral" className="font-bold text-[11px] shadow-sm">
                Trip Sharing VIP
              </Badge>
              {destination.category && (
                <Badge variant="outline" className="text-white border-white/40 backdrop-blur-md text-[11px]">
                  {destination.category}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
              {getDestinationTitle(destination)}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-200">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-[#ff6d3b]" />
                {destination.location || "Indonesia"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-teal-400" />
                {durationText}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                Max. 6 Pax per Fleet
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-2xl text-white md:text-right shrink-0">
            <span className="text-[11px] text-slate-300 block">Price per Person:</span>
            <span className="font-heading font-black text-2xl text-white">
              {formatCurrency(basePrice)}
            </span>
            <span className="text-[10px] text-slate-300 block">/ pax (All-inclusive Fleet)</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER (3-COLUMN DESKTOP / 1-COLUMN MOBILE) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: OVERVIEW, FASILITAS, MANIFES (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            {/* DESTINATION OVERVIEW */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="text-lg font-heading font-extrabold text-slate-900 flex items-center gap-2">
                <Info className="h-5 w-5 text-[#00677d]" />
                Description & Travel Experience
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {destination.description ||
                  "Enjoy exploring this spectacular destination with our shared journey concept. Save costs, meet new fellow travelers, and enjoy the comfort of VIP standard vehicles."}
              </p>

              {destination.meetingPoint && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 mt-4">
                  <MapPin className="h-5 w-5 text-[#00677d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Primary Meeting Point:
                    </span>
                    <span className="text-xs text-slate-600">{destination.meetingPoint}</span>
                  </div>
                </div>
              )}
            </div>

            {/* INCLUSIONS & EXCLUSIONS */}
            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
                <h2 className="text-lg font-heading font-extrabold text-slate-900">
                  Facilities & Package Inclusions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {inclusions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Included (Inclusions)
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {inclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4 text-rose-600" />
                        Not Included (Exclusions)
                      </h3>
                      <ul className="space-y-2 text-xs text-slate-600">
                        {exclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5 ml-1 mr-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: BOOKING FORM CARD (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-6 sticky top-6">
              <div className="border-b border-slate-100 pb-4">
                <Badge variant="azure" className="text-[10px] font-bold uppercase mb-1">
                  Ticket Reservation
                </Badge>
                <h2 className="text-xl font-heading font-extrabold text-slate-900">
                  Trip Booking Form
                </h2>
                <p className="text-xs text-slate-500">
                  Select your departure date and complete traveler details to lock your seats.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {/* STEP 1: PILIH JADWAL & ARMADA */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Step 1: Departure Date
                    </label>
                    {isCustomDateMode && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        New Trip Initiator
                      </span>
                    )}
                  </div>

                  {fieldErrors.departureDate && (
                    <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {fieldErrors.departureDate}
                    </p>
                  )}

                  {/* Trip Calendar Picker */}
                  <TripCalendarPicker
                    trips={trips}
                    selectedDate={selectedDate}
                    onSelectDate={(dateStr, matchedTrip) => {
                      if (matchedTrip) {
                        handleSelectTrip(matchedTrip);
                      } else {
                        handleCustomDateSelect(dateStr);
                      }
                    }}
                  />

                  {/* Armada Group Status */}
                  {selectedDate && groups.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Car className="h-3.5 w-3.5 text-[#00677d]" />
                          Vehicle Fleet Allocation:
                        </span>
                        <span className="text-[11px] font-semibold text-teal-700">
                          {compatibleGroup
                            ? `Vehicle #${compatibleGroup.groupNumber || 1} (${compatibleGroup.driver?.vehicleModel || "HiAce VIP"})`
                            : isSmartSegregationActive
                            ? "New Vehicle Fleet (Group Initiator)"
                            : groups[0]?.driver?.vehicleModel || "HiAce Commuter VIP (6 Seats)"}
                        </span>
                      </div>

                      {/* Smart Segregation Info Banner */}
                      {isSmartSegregationActive && !compatibleGroup && (
                        <div className="p-2.5 rounded-xl bg-teal-50/90 border border-teal-200/80 text-[11px] text-teal-900 flex items-start gap-2 shadow-xs">
                          <Info className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                          <div className="leading-relaxed">
                            <span className="font-bold">Smart Fleet Allocation:</span> Your party is automatically allocated to a new vehicle fleet to ensure social harmony and group comfort.
                          </div>
                        </div>
                      )}

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#00677d] h-full transition-all duration-300"
                          style={{
                            width: `${calculateOccupancyPercent(
                              compatibleGroup ? (compatibleGroup.currentParticipants || 0) : 0,
                              compatibleGroup ? (compatibleGroup.capacity || 6) : 6
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>
                          Occupied: {compatibleGroup ? (compatibleGroup.currentParticipants || 0) : 0} / {compatibleGroup ? (compatibleGroup.capacity || 6) : 6} Seats
                        </span>
                        <span>
                          {(compatibleGroup ? (compatibleGroup.capacity || 6) : 6) - (compatibleGroup ? (compatibleGroup.currentParticipants || 0) : 0)} Seats Available
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* STEP 2: MULTI-BOOKING DATA TRAVELER */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#00677d] flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Step 2: Traveler Details ({bookingItems.length} Traveler{bookingItems.length > 1 ? "s" : ""})
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      * Required fields
                    </span>
                  </div>

                  {/* Multi-Booking Internal Harmony Info */}
                  {internalBookingConflict.hasConflict && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Group Harmony Note:</span> Your booking contains travelers with nationalities{" "}
                        {internalBookingConflict.conflicts.map((c, i) => (
                          <span key={i} className="font-semibold underline">
                            {c.countryA} &amp; {c.countryB}
                          </span>
                        ))}
                        . All travelers in this party will still be processed together in this single booking.
                      </div>
                    </div>
                  )}

                  {/* CARDS LIST OF BOOKING ITEMS */}
                  <div className="space-y-4">
                    {bookingItems.map((item, index) => {
                      const isPrimary = index === 0;
                      const nameError = fieldErrors[`item_${index}_fullName`];
                      const emailError = fieldErrors[`item_${index}_email`];
                      const phoneError = fieldErrors[`item_${index}_phoneNumber`];
                      const dobError = fieldErrors[`item_${index}_dateOfBirth`];

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-4 border transition-all ${
                            isPrimary
                              ? "bg-slate-50/70 border-slate-200"
                              : "bg-white border-teal-100 shadow-sm"
                          }`}
                        >
                          {/* Item Header */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </div>
                              <span className="text-xs font-extrabold text-slate-800">
                                {isPrimary ? "Primary Traveler (Traveler #1)" : `Traveler #${index + 1}`}
                              </span>
                              {isPrimary && (
                                <Badge variant="azure" className="text-[9px] py-0 px-1.5">
                                  Primary
                                </Badge>
                              )}
                            </div>

                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleRemoveBooking(index)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition-colors p-1 rounded-md hover:bg-rose-50"
                                title="Remove this traveler"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Full Name */}
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                Full Name *
                              </label>
                              <Input
                                ref={(el) => {
                                  itemInputRefs.current[`item_${index}_fullName`] = el;
                                }}
                                required
                                placeholder="e.g. John Doe"
                                value={item.fullName}
                                onChange={(e) => handleUpdateItem(index, "fullName", e.target.value)}
                                className={`text-xs transition-colors ${
                                  nameError
                                    ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                                    : "bg-white border-slate-200"
                                }`}
                              />
                              {nameError && (
                                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  {nameError}
                                </p>
                              )}
                            </div>

                            {/* Email & Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                  Email {isPrimary ? "*" : "(Optional)"}
                                </label>
                                <Input
                                  ref={(el) => {
                                    itemInputRefs.current[`item_${index}_email`] = el;
                                  }}
                                  type="email"
                                  required={isPrimary}
                                  placeholder={isPrimary ? "john@example.com" : "Traveler email"}
                                  value={item.email}
                                  onChange={(e) => handleUpdateItem(index, "email", e.target.value)}
                                  className={`text-xs transition-colors ${
                                    emailError
                                      ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                                      : "bg-white border-slate-200"
                                  }`}
                                />
                                {emailError && (
                                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    {emailError}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                  WhatsApp / Phone *
                                </label>
                                <Input
                                  ref={(el) => {
                                    itemInputRefs.current[`item_${index}_phoneNumber`] = el;
                                  }}
                                  required
                                  placeholder="+6281234567890"
                                  value={item.phoneNumber}
                                  onChange={(e) => handleUpdateItem(index, "phoneNumber", e.target.value)}
                                  className={`text-xs transition-colors ${
                                    phoneError
                                      ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                                      : "bg-white border-slate-200"
                                  }`}
                                />
                                {phoneError && (
                                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    {phoneError}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Date of Birth & Nationality */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                    Date of Birth
                                  </label>
                                  <span className="text-[10px] text-slate-400 font-normal lowercase">
                                    (insurance)
                                  </span>
                                </div>
                                <Input
                                  ref={(el) => {
                                    itemInputRefs.current[`item_${index}_dateOfBirth`] = el;
                                  }}
                                  type="date"
                                  min="1900-01-01"
                                  max={new Date().toISOString().split("T")[0]}
                                  value={item.dateOfBirth}
                                  onChange={(e) => handleUpdateItem(index, "dateOfBirth", e.target.value)}
                                  className={`text-xs transition-colors ${
                                    dobError
                                      ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/30 text-rose-950"
                                      : "bg-white border-slate-200"
                                  }`}
                                />
                                {dobError && (
                                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in fade-in">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    {dobError}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                  Nationality
                                </label>
                                <CountryCombobox
                                  value={item.nationality}
                                  onChange={(val) => handleUpdateItem(index, "nationality", val)}
                                />
                              </div>
                            </div>

                            {/* Pickup Location Section */}
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              {!isPrimary && (
                                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#00677d] py-1">
                                  <input
                                    type="checkbox"
                                    checked={item.usePrimaryPickup}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      handleUpdateItem(index, "usePrimaryPickup", checked);
                                      if (checked && bookingItems[0]) {
                                        handleUpdateItem(index, "pickupLocation", bookingItems[0].pickupLocation);
                                        handleUpdateItem(index, "pickupPlaceName", bookingItems[0].pickupPlaceName);
                                        handleUpdateItem(index, "pickupLatitude", bookingItems[0].pickupLatitude);
                                        handleUpdateItem(index, "pickupLongitude", bookingItems[0].pickupLongitude);
                                        handleUpdateItem(index, "pickupNotes", bookingItems[0].pickupNotes);
                                      }
                                    }}
                                    className="rounded border-slate-300 text-[#00677d] focus:ring-[#00677d] h-4 w-4"
                                  />
                                  <span>Use same pickup location as Primary Traveler</span>
                                </label>
                              )}

                              {(!item.usePrimaryPickup || isPrimary) && (
                                <div className="space-y-2">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                      Pickup Location / Address
                                    </label>
                                    <GooglePlacesAutocomplete
                                      value={item.pickupLocation}
                                      placeName={item.pickupPlaceName}
                                      latitude={item.pickupLatitude}
                                      longitude={item.pickupLongitude}
                                      onChange={(sel) => {
                                        handleUpdateItem(index, "pickupLocation", sel.address);
                                        handleUpdateItem(index, "pickupPlaceName", sel.placeName || "");
                                        handleUpdateItem(index, "pickupLatitude", sel.latitude);
                                        handleUpdateItem(index, "pickupLongitude", sel.longitude);
                                      }}
                                      placeholder="Search hotel, airport, station, or address..."
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                      Special Pickup Notes (Optional)
                                    </label>
                                    <textarea
                                      rows={2}
                                      placeholder="e.g. Wait at hotel main lobby, 1 large luggage."
                                      value={item.pickupNotes}
                                      onChange={(e) => handleUpdateItem(index, "pickupNotes", e.target.value)}
                                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#00677d] focus:outline-none transition-colors resize-none"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Health & Special Notes */}
                            <div className="space-y-1 pt-1">
                              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                Special Notes / Medical / Dietary (Optional)
                              </label>
                              <Input
                                placeholder="Food allergies, asthma, motion sickness, etc."
                                value={item.healthNotes}
                                onChange={(e) => handleUpdateItem(index, "healthNotes", e.target.value)}
                                className="text-xs bg-white border-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ADD ANOTHER BOOKING BUTTON */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddBooking}
                    className="w-full py-5 border-dashed border-2 border-[#00677d]/40 text-[#00677d] hover:bg-[#00677d]/5 hover:border-[#00677d] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>+ Add Another Traveler (Traveler #{bookingItems.length + 1})</span>
                  </Button>
                </div>

                {/* STEP 3: PRICE BREAKDOWN & SUMMARY */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-50/40 border border-slate-200/80 space-y-2.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Selected Date:</span>
                    <span className="font-bold text-[#00677d]">
                      {selectedDate ? formatDate(selectedDate) : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Ticket Price per Person:</span>
                    <span>{formatCurrency(basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Travelers:</span>
                    <span className="font-bold text-slate-800">{bookingItems.length} Pax</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#191c1e] pt-2.5 border-t border-slate-200">
                    <div>
                      <span>Total Amount:</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        ({bookingItems.length} x {formatCurrency(basePrice)})
                      </span>
                    </div>
                    <span className="font-heading font-black text-lg text-[#a43c12]">
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
                  className="w-full justify-center font-bold text-sm shadow-md bg-[#00677d] hover:bg-[#005264]"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? "Processing Booking..."
                    : `Proceed to Payment (${formatCurrency(totalAmount)})`}
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
                Travel Insurance Confirmation
              </DialogTitle>
              <span className="text-[11px] font-semibold text-amber-700">
                Trip Safety Coverage
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-2">
            Some travelers&apos; date of birth fields are unassigned. Date of birth is required for issuing official <strong>travel insurance</strong> policies. Travelers without date of birth <strong>will not be covered by insurance</strong> during the trip.
          </DialogDescription>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 mt-2 font-medium">
            Are you sure you want to proceed with this booking?
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsInsuranceWarningOpen(false)}
              className="text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel (Enter Date of Birth)
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
              Yes, Proceed to Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MIDTRANS SNAP PAYMENT SIMULATION MODAL */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0 overflow-hidden bg-white max-h-[90dvh] flex flex-col rounded-2xl sm:rounded-3xl border border-slate-100 shadow-2xl [&>button]:text-white/80 [&>button]:hover:text-white">
          <div className="bg-[#00677d] p-4 sm:p-5 text-white shrink-0">
            <Badge variant="coral" className="text-[10px] font-bold uppercase mb-1">
              Midtrans Payment Gateway
            </Badge>
            <DialogTitle className="font-heading font-extrabold text-lg sm:text-xl text-white">
              Complete Your Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-100">
              Choose a secure instant payment method to guarantee seats for your entire party.
            </DialogDescription>
          </div>

          <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
            <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 block">Total Amount:</span>
                <span className="font-heading font-extrabold text-lg sm:text-xl text-[#00677d]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 bg-white px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl border border-slate-200">
                {createdParticipants.length || bookingItems.length} Pax (VIP)
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Payment Method
              </label>

              <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("qris")}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "qris"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <QrCode className="h-4 w-4 shrink-0 text-[#00677d]" />
                    <span>QRIS (GoPay, OVO, ShopeePay, Dana, BCA)</span>
                  </div>
                  <Badge variant="success" className="text-[9px] shrink-0">Instant</Badge>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bca_va")}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "bca_va"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <Building2 className="h-4 w-4 shrink-0 text-[#00677d]" />
                    <span>BCA Virtual Account</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0">Automatic</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("credit_card")}
                  className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-xs font-bold transition-all ${
                    paymentMethod === "credit_card"
                      ? "border-[#00677d] bg-[#00677d]/5 text-[#00677d]"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <CreditCard className="h-4 w-4 shrink-0 text-[#00677d]" />
                    <span>Credit / Debit Card (Visa / Mastercard)</span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 shrink-0">3D Secure</span>
                </button>
              </div>
            </div>

            {/* Simulated QR Code or Instructions */}
            {paymentMethod === "qris" && (
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2 sm:space-y-3">
                <div className="h-24 w-24 sm:h-32 sm:w-32 mx-auto bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shadow-sm">
                  <QrCode className="h-20 w-20 sm:h-28 sm:w-28 text-slate-800" />
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Scan the QRIS code above with your mobile banking or e-wallet application.
                </p>
              </div>
            )}

            <Button
              onClick={handleConfirmPayment}
              disabled={isProcessingPayment}
              size="lg"
              className="w-full justify-center font-bold text-xs sm:text-sm py-2.5 sm:py-3 h-auto sm:h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md rounded-xl"
            >
              {isProcessingPayment ? "Verifying Transaction..." : "I Have Completed Payment (Simulate Success)"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PAYMENT SUCCESS CONFIRMATION MODAL */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden bg-white border border-slate-100 shadow-2xl rounded-3xl print-voucher-card">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white text-center space-y-2">
            <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-xl sm:text-2xl text-white">
              Booking Successful!
            </DialogTitle>
            <DialogDescription className="text-xs text-emerald-100 max-w-sm mx-auto">
              Payment confirmed for {createdParticipants.length || bookingItems.length} traveler(s). Your trip sharing vehicle seats are locked!
            </DialogDescription>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* List of Issued Booking Codes / Tickets */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Tickets &amp; Booking Codes
              </span>

              {(createdParticipants.length > 0 ? createdParticipants : [createdBooking]).filter(Boolean).map((participant, pIdx) => (
                <div
                  key={participant?.id || pIdx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {participant?.fullName || bookingItems[pIdx]?.fullName || "Traveler"}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Code: <strong className="text-[#00677d] font-bold text-sm">{participant?.bookingCode || "TRV-SUCCESS"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 no-print">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(participant?.bookingCode || "TRV-SUCCESS", pIdx)}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-[#00677d] transition-colors shadow-sm"
                      title="Copy Code"
                    >
                      {copiedIndex === pIdx ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const destTitle = getDestinationTitle(destination);
                        printTicketVoucher({
                          bookingCode: participant?.bookingCode || "TRV-SUCCESS",
                          destinationTitle: destTitle,
                          fullName: participant?.fullName || "Traveler",
                          identityNumber: participant?.identityNumber,
                          dateOfBirth: participant?.dateOfBirth,
                          groupNumber: participant?.group?.groupNumber || 1,
                          driverName: participant?.group?.driver?.fullName,
                          vehicleModel: participant?.group?.driver?.vehicleModel,
                          plateNumber: participant?.group?.driver?.plateNumber,
                          departureDate: formatDate(selectedDate || customDateInput),
                          pickupLocation: participant?.pickupLocation || undefined,
                          pickupNotes: participant?.pickupNotes || undefined,
                        });
                      }}
                      className="text-xs font-bold gap-1 px-2.5 bg-white border-slate-200 text-slate-700"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Trip Details Summary */}
            <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Destination:</span>
                <span className="font-bold text-slate-800">{getDestinationTitle(destination)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Departure Date:</span>
                <span className="font-bold text-[#00677d]">
                  {formatDate(selectedDate || customDateInput)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Payment Status:</span>
                <Badge variant="success" className="text-[10px] font-bold">PAID</Badge>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 no-print">
              <Button
                size="lg"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  const firstCode = createdParticipants[0]?.bookingCode || createdBooking?.bookingCode || "";
                  router.push(`/bookings?bookingCode=${firstCode}`);
                }}
                className="w-full font-bold text-xs gap-2 bg-[#00677d] hover:bg-[#005264] shadow-md"
              >
                <Ticket className="h-4 w-4" />
                View E-Vouchers in My Bookings
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  router.push("/destinations");
                }}
                className="w-full text-xs font-semibold text-slate-600"
              >
                Back to Destination Catalog
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

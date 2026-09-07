"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Plus,
  Search,
  Clock,
  Users,
  Car,
  MapPin,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { adminService } from "@/src/services/admin.service";
import {
  formatCurrency,
  formatDate,
  calculateOccupancyPercent,
  getDestinationTitle,
  getPaymentBadge,
  getTripStatusBadge,
} from "@/src/lib/utils";
import type { Trip, Destination, Driver, CreateTripPayload, UpdateTripPayload, TripStatus } from "@/src/types";

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [expandedTripParticipants, setExpandedTripParticipants] = useState<Record<string, boolean>>({});

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formDestinationId, setFormDestinationId] = useState("");
  const [formDepartureDate, setFormDepartureDate] = useState("");
  const [formReturnDate, setFormReturnDate] = useState("");
  const [formPricePerPax, setFormPricePerPax] = useState<number>(0);
  const [formMaxParticipants, setFormMaxParticipants] = useState<number>(6);
  const [formMaxGroups, setFormMaxGroups] = useState<number>(2);
  const [formDriverId, setFormDriverId] = useState("");
  const [formStatus, setFormStatus] = useState<TripStatus>("planning");
  const [formNotes, setFormNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [editStatus, setEditStatus] = useState<TripStatus>("scheduled");
  const [editPricePerPax, setEditPricePerPax] = useState<number>(0);
  const [editDepartureDate, setEditDepartureDate] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editMaxParticipants, setEditMaxParticipants] = useState<number>(6);
  const [editMaxGroups, setEditMaxGroups] = useState<number>(2);
  const [editNotes, setEditNotes] = useState("");

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification / Feedback State
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tripsData, destsData, driversData] = await Promise.all([
        adminService.getTrips(),
        adminService.getDestinations(),
        adminService.getDrivers(),
      ]);
      setTrips(tripsData);
      setDestinations(destsData);
      setDrivers(driversData);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const [tripsData, destsData, driversData] = await Promise.all([
          adminService.getTrips(),
          adminService.getDestinations(),
          adminService.getDrivers(),
        ]);
        if (isMounted) {
          setTrips(tripsData);
          setDestinations(destsData);
          setDrivers(driversData);
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);


  // When a destination is selected in Create Form, autofill default price
  const handleDestinationChange = (destId: string) => {
    setFormDestinationId(destId);
    const dest = destinations.find((d) => d.id === destId);
    if (dest) {
      setFormPricePerPax(dest.pricePerPax || dest.basePrice || 850000);
    }
  };

  // Open Create Modal with clean defaults
  const handleOpenCreateModal = () => {
    setFormError(null);
    if (destinations.length > 0) {
      const firstDest = destinations[0];
      setFormDestinationId(firstDest.id);
      setFormPricePerPax(firstDest.pricePerPax || firstDest.basePrice || 850000);
    } else {
      setFormDestinationId("");
      setFormPricePerPax(850000);
    }

    // Default dates: 2 days ahead at 07:00 to 4 days ahead at 17:00
    const now = new Date();
    const depart = new Date(now);
    depart.setDate(depart.getDate() + 2);
    depart.setHours(7, 0, 0, 0);

    const ret = new Date(depart);
    ret.setDate(ret.getDate() + 2);
    ret.setHours(17, 0, 0, 0);

    const pad = (n: number) => String(n).padStart(2, "0");
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setFormDepartureDate(formatLocal(depart));
    setFormReturnDate(formatLocal(ret));
    setFormMaxParticipants(6);
    setFormMaxGroups(2);
    setFormDriverId(drivers[0]?.id || "");
    setFormStatus("planning");
    setFormNotes("");
    setIsCreateModalOpen(true);
  };

  // Submit Create Trip
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formDestinationId) {
      setFormError("Pilih destinasi wisata terlebih dahulu.");
      return;
    }
    if (!formDepartureDate || !formReturnDate) {
      setFormError("Tanggal berangkat dan tanggal pulang wajib diisi.");
      return;
    }

    const departDateObj = new Date(formDepartureDate);
    const returnDateObj = new Date(formReturnDate);
    const now = new Date(Date.now() - 60000); // 1-minute buffer

    if (departDateObj < now) {
      setFormError("Tanggal berangkat tidak boleh di masa lampau (minimal hari ini).");
      return;
    }
    if (returnDateObj < departDateObj) {
      setFormError("Tanggal pulang tidak boleh lebih awal dari tanggal berangkat.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTripPayload = {
        destinationId: formDestinationId,
        destination_id: formDestinationId,
        departureDate: departDateObj.toISOString(),
        departure_date: departDateObj.toISOString(),
        returnDate: returnDateObj.toISOString(),
        return_date: returnDateObj.toISOString(),
        pricePerPax: Number(formPricePerPax) || 850000,
        maxParticipants: Number(formMaxParticipants) || 6,
        max_participants: Number(formMaxParticipants) || 6,
        maxGroups: Number(formMaxGroups) || Math.ceil((Number(formMaxParticipants) || 6) / 6),
        initialDriverId: formDriverId || undefined,
        status: formStatus,
        notes: formNotes || undefined,
      };

      await adminService.createTrip(payload);
      setIsCreateModalOpen(false);
      setFeedback({ type: "success", message: "Jadwal trip baru berhasil dibuat!" });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat jadwal trip.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setEditStatus(trip.status);
    setEditPricePerPax(trip.pricePerPax);
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setEditDepartureDate(
      trip.departureDate ? formatLocal(new Date(trip.departureDate)) : ""
    );
    setEditReturnDate(
      trip.returnDate ? formatLocal(new Date(trip.returnDate)) : ""
    );
    setEditMaxParticipants(
      trip.maxParticipants ||
        trip.max_participants ||
        (trip.groups?.length ? trip.groups.length * 6 : 6)
    );
    setEditMaxGroups(trip.maxGroups || (trip.groups?.length ? trip.groups.length : 2));
    setEditNotes(trip.notes || "");
    setIsEditModalOpen(true);
  };

  // Submit Edit Trip
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrip) return;

    if (editDepartureDate) {
      const editDepartObj = new Date(editDepartureDate);
      const now = new Date(Date.now() - 60000);
      if (editDepartObj < now && (editingTrip.status === "scheduled" || editingTrip.status === "planning")) {
        setFeedback({ type: "error", message: "Tanggal berangkat tidak boleh di masa lampau." });
        return;
      }
      if (editReturnDate) {
        const editReturnObj = new Date(editReturnDate);
        if (editReturnObj < editDepartObj) {
          setFeedback({ type: "error", message: "Tanggal pulang tidak boleh lebih awal dari tanggal berangkat." });
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: UpdateTripPayload = {
        status: editStatus,
        pricePerPax: Number(editPricePerPax),
        departureDate: editDepartureDate ? new Date(editDepartureDate).toISOString() : undefined,
        departure_date: editDepartureDate ? new Date(editDepartureDate).toISOString() : undefined,
        returnDate: editReturnDate ? new Date(editReturnDate).toISOString() : undefined,
        return_date: editReturnDate ? new Date(editReturnDate).toISOString() : undefined,
        maxParticipants: Number(editMaxParticipants),
        max_participants: Number(editMaxParticipants),
        maxGroups: Number(editMaxGroups),
        notes: editNotes,
      };

      await adminService.updateTrip(editingTrip.id, payload);
      setIsEditModalOpen(false);
      setFeedback({ type: "success", message: `Jadwal trip #${editingTrip.id} berhasil diperbarui.` });
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui jadwal trip.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Trip
  const handleDeleteConfirm = async () => {
    if (!deletingTrip) return;
    setIsDeleting(true);
    try {
      await adminService.deleteTrip(deletingTrip.id);
      setIsDeleteModalOpen(false);
      setFeedback({ type: "success", message: "Jadwal trip berhasil dihapus dari sistem." });
      loadData();
    } catch {
      setFeedback({ type: "error", message: "Gagal menghapus trip." });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered trips computation
  const filteredTrips = trips.filter((t) => {
    if (selectedDestinationFilter !== "all" && t.destinationId !== selectedDestinationFilter) {
      return false;
    }
    if (selectedStatusFilter !== "all" && t.status !== selectedStatusFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (t.destination?.title || t.destination?.name || "").toLowerCase();
      const loc = (t.destination?.location || "").toLowerCase();
      const id = t.id.toLowerCase();
      const notes = (t.notes || "").toLowerCase();
      if (!title.includes(q) && !loc.includes(q) && !id.includes(q) && !notes.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Analytics Metrics
  const totalScheduled = trips.filter((t) => ["scheduled", "planning", "published", "active"].includes(t.status)).length;
  const totalOngoing = trips.filter((t) => ["ongoing", "departed"].includes(t.status)).length;
  const totalArmadaCount = trips.reduce((acc, t) => acc + (t.groups?.length || 0), 0);
  const totalParticipantsAll = trips.reduce(
    (acc, t) =>
      acc +
      (t.currentParticipants ||
        t.groups?.reduce((gAcc, g) => gAcc + (g.currentParticipants || 0), 0) ||
        0),
    0
  );
  const totalCapacityAll = trips.reduce(
    (acc, t) =>
      acc + (t.maxParticipants || t.max_participants || (t.groups?.length || 1) * 6),
    0
  );
  const avgOccupancy =
    totalCapacityAll > 0 ? Math.round((totalParticipantsAll / totalCapacityAll) * 100) : 0;

  const getStatusBadge = (status: TripStatus | string) => {
    const badgeInfo = getTripStatusBadge(status);
    return (
      <span
        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeInfo.className}`}
      >
        {badgeInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#00677d] block mb-1">
            Operasional Keberangkatan
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Manajemen Jadwal Trip & Armada
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola jadwal keberangkatan, alokasi armada mobil sharing (maks 6 pax), dan tarif trip.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          size="sm"
          className="font-bold gap-2 shadow-sm shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Jadwalkan Trip Baru
        </Button>
      </div>

      {/* FEEDBACK TOAST / ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* METRIC OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Trip Terjadwal</span>
            <Calendar className="h-4 w-4 text-[#00677d]" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
            {totalScheduled}
          </span>
          <span className="text-[11px] text-slate-400">Siap berangkat</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Trip Berjalan</span>
            <Clock className="h-4 w-4 text-[#ff7f50]" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-[#ff7f50] block">
            {totalOngoing}
          </span>
          <span className="text-[11px] text-slate-400">Sedang di rute</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Armada Mobil</span>
            <Car className="h-4 w-4 text-[#00a3c4]" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
            {totalArmadaCount} Unit
          </span>
          <span className="text-[11px] text-slate-400">Kapasitas {totalCapacityAll} Pax</span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rasio Okupansi</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="font-heading font-extrabold text-2xl text-emerald-600 block">
            {avgOccupancy}%
          </span>
          <span className="text-[11px] text-slate-400">{totalParticipantsAll} peserta terisi</span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-stitch-card flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari destinasi atau kode trip..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50 border-slate-200 h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Destination Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="Filter berdasarkan destinasi"
              value={selectedDestinationFilter}
              onChange={(e) => setSelectedDestinationFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Destinasi</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {getDestinationTitle(d)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              aria-label="Filter berdasarkan status trip"
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="planning">Perencanaan (Planning)</option>
              <option value="published">Dipublikasikan (Published)</option>
              <option value="scheduled">Terjadwal (Scheduled)</option>
              <option value="active">Aktif (Active)</option>
              <option value="ongoing">Sedang Berjalan (Ongoing)</option>
              <option value="departed">Berangkat (Departed)</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* TRIP LIST VIEW */}
      {isLoading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-slate-100 shadow-stitch-card">
          <Loader2 className="h-8 w-8 animate-spin text-[#00677d] mx-auto" />
          <p className="text-xs text-slate-500">Memuat jadwal trip dan data armada...</p>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="p-12 text-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-stitch-card">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto" />
          <h2 className="font-heading text-lg font-bold text-slate-800">
            Tidak Ada Jadwal Trip Ditemukan
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedDestinationFilter !== "all" || selectedStatusFilter !== "all"
              ? "Tidak ada jadwal trip yang cocok dengan filter pencarian Anda."
              : "Belum ada jadwal trip yang dibuat. Klik tombol di bawah untuk membuat jadwal pertama."}
          </p>
          <Button onClick={handleOpenCreateModal} size="sm" className="font-bold">
            <Plus className="h-4 w-4 mr-1.5" /> Jadwalkan Trip Baru
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTrips.map((trip) => {
            const dest =
              trip.destination ||
              destinations.find((d) => d.id === trip.destinationId) ||
              destinations[0];

            const totalTripParticipants =
              trip.groups?.reduce((acc, g) => acc + (g.currentParticipants || 0), 0) || 0;
            const tripCapacity = (trip.groups?.length || 1) * 6;
            const tripOccupancy = calculateOccupancyPercent(totalTripParticipants, tripCapacity);

            return (
              <div
                key={trip.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-stitch-card transition-all hover:border-slate-200 space-y-5"
              >
                {/* Trip Card Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start gap-3.5">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <Image
                        src={dest?.coverImage || dest?.image || "/images/dest-bromo.jpg"}
                        alt={getDestinationTitle(dest)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#191c1e]">
                          {getDestinationTitle(dest)}
                        </h3>
                        {getStatusBadge(trip.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#ff7f50]" />
                          {dest?.location || "Indonesia"}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-slate-400">ID: {trip.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(trip)}
                      className="h-8 text-xs font-semibold gap-1 text-slate-700"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingTrip(trip);
                        setIsDeleteModalOpen(true);
                      }}
                      className="h-8 text-xs font-semibold gap-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs font-bold gap-1 bg-[#00677d] hover:bg-[#005264]"
                    >
                      <Link href={`/admin/participants?tripId=${trip.id}`}>
                        <span>Kelola Peserta</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Date, Pricing & Occupancy Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Departure & Return */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Waktu Perjalanan
                    </span>
                    <div className="font-bold text-[#191c1e]">
                      {formatDate(trip.departureDate)}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      s.d. {formatDate(trip.returnDate)}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tarif Sharing Per Pax
                    </span>
                    <div className="font-heading font-extrabold text-base text-[#a43c12]">
                      {formatCurrency(trip.pricePerPax)}
                    </div>
                    <span className="text-[10px] text-slate-400">All-in Package</span>
                  </div>

                  {/* Armada Groups */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Alokasi Armada
                    </span>
                    <div className="font-bold text-[#00677d] flex items-center gap-1.5">
                      <Car className="h-4 w-4" />
                      <span>{trip.groups?.length || 0} Mobil (Maks {trip.maxGroups || 2})</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {trip.groups?.filter((g) => g.status === "open").length || 0} grup open
                    </span>
                  </div>

                  {/* Occupancy Progress */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Okupansi</span>
                      <span className="text-[#00677d]">{totalTripParticipants} / {tripCapacity} Pax</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00677d] to-[#ff7f50]"
                        style={{ width: `${tripOccupancy}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block text-right font-medium">
                      {tripOccupancy}% Terisi
                    </span>
                  </div>
                </div>

                {/* Notes and Guide Display if available */}
                {(trip.notes || trip.guide) && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs">
                    {trip.notes && (
                      <div className="text-slate-600">
                        <span className="font-bold text-slate-700">Catatan:</span> {trip.notes}
                      </div>
                    )}
                    {trip.notes && trip.guide && <span className="text-slate-300">•</span>}
                    {trip.guide && (
                      <div className="text-slate-600 flex items-center gap-1.5">
                        <span className="font-bold text-slate-700">Pemandu:</span>
                        <span className="font-semibold text-[#00677d]">{trip.guide.name}</span>
                        {trip.guide.phone && (
                          <span className="text-slate-400 font-mono text-[11px]">({trip.guide.phone})</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-group / Armada List */}
                {Array.isArray(trip.groups) && trip.groups.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-600 block mb-2">
                      Rincian Armada & Driver:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {trip.groups.map((group) => {
                        const isGroupFull = group.currentParticipants >= (group.capacity || 6);
                        return (
                          <div
                            key={group.id}
                            className="p-3 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-[#191c1e] flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-[#00677d]" />
                                {group.name || `Grup Mobil #${group.groupNumber}`}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {group.driver
                                  ? `${group.driver.fullName} (${group.driver.plateNumber})`
                                  : "Driver belum ditugaskan"}
                              </span>
                            </div>
                            <Badge
                              variant={isGroupFull ? "destructive" : "secondary"}
                              className="text-[10px] font-bold"
                            >
                              {group.currentParticipants} / {group.capacity || 6} Pax
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Participants Section Toggle & Detail */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedTripParticipants((prev) => ({
                          ...prev,
                          [trip.id]: !prev[trip.id],
                        }))
                      }
                      className="h-8 text-xs font-bold gap-1.5 text-[#00677d] hover:bg-[#00677d]/10 px-3"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {expandedTripParticipants[trip.id]
                          ? "Sembunyikan Daftar Peserta"
                          : `Lihat Data Peserta (${trip.participants?.length || totalTripParticipants} Orang)`}
                      </span>
                      {expandedTripParticipants[trip.id] ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1 text-slate-700"
                    >
                      <Link href={`/admin/participants/new?tripId=${trip.id}`}>
                        <Plus className="h-3 w-3" /> Tambah Peserta Manual
                      </Link>
                    </Button>
                  </div>

                  {expandedTripParticipants[trip.id] && (
                    <div className="mt-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      {!trip.participants || trip.participants.length === 0 ? (
                        <div className="text-center py-6 text-xs text-slate-400">
                          Belum ada peserta yang memesan trip ini. Kursi masih terbuka untuk dipesan.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                <th className="py-2 px-3">Kode Booking</th>
                                <th className="py-2 px-3">Nama Peserta</th>
                                <th className="py-2 px-3">Kontak</th>
                                <th className="py-2 px-3">Alokasi Grup</th>
                                <th className="py-2 px-3">Kamar & Asuransi</th>
                                <th className="py-2 px-3">Status Bayar</th>
                                <th className="py-2 px-3 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/60 bg-white">
                              {trip.participants.map((p) => {
                                const payBadge = getPaymentBadge(p.paymentStatus);
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-bold text-[#00677d]">
                                      {p.bookingCode}
                                    </td>
                                    <td className="py-2.5 px-3 font-bold text-slate-800">
                                      {p.fullName}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-600 space-y-0.5 text-[11px]">
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-slate-400" />
                                        <span>{p.email}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-slate-400" />
                                        <span>{p.phoneNumber}</span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-[#00677d] font-bold text-[11px]">
                                        <Car className="h-3 w-3" />
                                        Grup #{p.group?.groupNumber || 1}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                                      <div>{p.roomPreference === "single" ? "Kamar Single (+Rp350rb)" : "Twin Sharing"}</div>
                                      {p.hasInsurance && (
                                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                          <ShieldCheck className="h-3 w-3" /> Asuransi
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span
                                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${payBadge.className}`}
                                      >
                                        {payBadge.label}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[11px] px-2.5 text-[#00677d]"
                                      >
                                        <Link href={`/admin/participants?search=${p.bookingCode}`}>
                                          Kelola
                                        </Link>
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE TRIP MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-xl text-[#191c1e]">
              Jadwalkan Trip Keberangkatan Baru
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat jadwal trip baru pada paket destinasi dengan alokasi armada mobil sharing.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {/* Destinasi Selection */}
            <div className="space-y-1.5">
              <label htmlFor="modal-dest-select" className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Pilih Destinasi Wisata *
              </label>
              <select
                id="modal-dest-select"
                required
                value={formDestinationId}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getDestinationTitle(d)} ({d.location})
                  </option>
                ))}
              </select>
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tanggal Berangkat *
                </label>
                <Input
                  required
                  type="datetime-local"
                  min={(() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  })()}
                  value={formDepartureDate}
                  onChange={(e) => setFormDepartureDate(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tanggal Pulang *
                </label>
                <Input
                  required
                  type="datetime-local"
                  min={formDepartureDate || (() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  })()}
                  value={formReturnDate}
                  onChange={(e) => setFormReturnDate(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Status & Max Participants */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="create-status-select" className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Status Awal *
                </label>
                <select
                  id="create-status-select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as TripStatus)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="planning">Perencanaan (Planning)</option>
                  <option value="published">Dipublikasikan (Published)</option>
                  <option value="scheduled">Terjadwal (Scheduled)</option>
                  <option value="active">Aktif (Active)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Kapasitas Total Peserta (Pax) *
                </label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={formMaxParticipants}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setFormMaxParticipants(p);
                    setFormMaxGroups(Math.max(1, Math.ceil(p / 6)));
                  }}
                  className="text-xs bg-slate-50 border-slate-200 font-bold"
                />
              </div>
            </div>

            {/* Price & Max Groups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tarif Per Pax (IDR) *
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="10000"
                  value={formPricePerPax}
                  onChange={(e) => setFormPricePerPax(Number(e.target.value))}
                  className="text-xs bg-slate-50 border-slate-200 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Maksimal Armada Mobil
                </label>
                <Input
                  required
                  type="number"
                  min="1"
                  max="20"
                  value={formMaxGroups}
                  onChange={(e) => setFormMaxGroups(Number(e.target.value))}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Driver Perdana */}
            <div className="space-y-1.5">
              <label htmlFor="modal-driver-select" className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Driver Perdana (Grup #1)
              </label>
              <select
                id="modal-driver-select"
                value={formDriverId}
                onChange={(e) => setFormDriverId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="">-- Tetapkan Nanti --</option>
                {drivers.map((drv) => (
                  <option key={drv.id} value={drv.id}>
                    {drv.fullName} ({drv.vehicleModel} - {drv.plateNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Catatan Operasional / Meeting Point (Opsional)
              </label>
              <Input
                placeholder="Misal: Meeting point di Stasiun Karangasem, standby jam 06:00..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan & Publikasikan Trip"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT TRIP MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-xl text-[#191c1e]">
              Edit Status & Jadwal Trip
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui status pelaksanaan atau rincian tarif jadwal trip #{editingTrip?.id}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="modal-status-select" className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Status Pelaksanaan Trip *
              </label>
              <select
                id="modal-status-select"
                value={editStatus}
                onChange={(e) =>
                  setEditStatus(e.target.value as TripStatus)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="planning">Perencanaan (Planning)</option>
                <option value="published">Dipublikasikan (Published)</option>
                <option value="scheduled">Terjadwal (Scheduled)</option>
                <option value="active">Aktif (Active)</option>
                <option value="ongoing">Sedang Berjalan (Ongoing)</option>
                <option value="departed">Berangkat (Departed)</option>
                <option value="completed">Selesai (Completed)</option>
                <option value="cancelled">Dibatalkan (Cancelled)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Kapasitas Peserta (Pax)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={editMaxParticipants}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setEditMaxParticipants(p);
                    setEditMaxGroups(Math.max(1, Math.ceil(p / 6)));
                  }}
                  className="text-xs bg-slate-50 border-slate-200 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tarif Per Pax (IDR)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={editPricePerPax}
                  onChange={(e) => setEditPricePerPax(Number(e.target.value))}
                  className="text-xs bg-slate-50 border-slate-200 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tanggal Berangkat
                </label>
                <Input
                  type="datetime-local"
                  min={(() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  })()}
                  value={editDepartureDate}
                  onChange={(e) => setEditDepartureDate(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Tanggal Pulang
                </label>
                <Input
                  type="datetime-local"
                  min={editDepartureDate || (() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, "0");
                    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                  })()}
                  value={editReturnDate}
                  onChange={(e) => setEditReturnDate(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Catatan Operasional / Meeting Point
              </label>
              <Input
                placeholder="Misal: Jadwal telah dikonfirmasi pemandu..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="text-xs bg-slate-50 border-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting} className="font-bold">
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-sm p-6 bg-white">
          <div className="space-y-3 text-center">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Jadwal Trip Ini?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Jadwal trip <strong>{deletingTrip?.id}</strong> dan alokasi grup armada terkait akan dihapus dari sistem.
            </DialogDescription>
          </div>

          <div className="flex justify-center gap-2.5 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Trip"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

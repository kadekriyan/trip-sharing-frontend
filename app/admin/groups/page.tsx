"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  Plus,
  Search,
  Users,
  Car,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserCheck,
  UserX,
  Phone,
  ChevronDown,
  ChevronUp,
  Filter,
  DollarSign,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
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
} from "@/src/lib/utils";
import type {
  BookingGroup,
  Trip,
  Driver,
  GroupStatus,
  CreateBookingGroupPayload,
  UpdateBookingGroupPayload,
} from "@/src/types";

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tripFilter, setTripFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Accordion state
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({});

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTripId, setCreateTripId] = useState("");
  const [createDriverId, setCreateDriverId] = useState("");
  const [createGroupNumber, setCreateGroupNumber] = useState<number | undefined>(undefined);
  const [createMaxPax, setCreateMaxPax] = useState<number>(6);
  const [createPricePerPax, setCreatePricePerPax] = useState<number>(0);
  const [createStatus, setCreateStatus] = useState<GroupStatus>("open");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BookingGroup | null>(null);
  const [editMaxPax, setEditMaxPax] = useState<number>(6);
  const [editPricePerPax, setEditPricePerPax] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<GroupStatus>("open");
  const [editGroupNumber, setEditGroupNumber] = useState<number>(1);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Driver Assignment Modal State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [groupForDriver, setGroupForDriver] = useState<BookingGroup | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [driverModalError, setDriverModalError] = useState<string | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<BookingGroup | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Success Notification
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [groupsData, tripsData, driversData] = await Promise.all([
        adminService.getGroups(),
        adminService.getTrips(),
        adminService.getDrivers(),
      ]);
      setGroups(groupsData);
      setTrips(tripsData);
      setDrivers(driversData);
    } catch (err) {
      console.error("Gagal memuat data grup armada:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const [groupsData, tripsData, driversData] = await Promise.all([
          adminService.getGroups(),
          adminService.getTrips(),
          adminService.getDrivers(),
        ]);
        if (isMounted) {
          setGroups(groupsData);
          setTrips(tripsData);
          setDrivers(driversData);
        }
      } catch (err) {
        console.error("Gagal inisialisasi data grup armada:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Trip Selection in Create Modal
  const handleCreateTripChange = (tId: string) => {
    setCreateTripId(tId);
    const foundTrip = trips.find((t) => t.id === tId);
    if (foundTrip) {
      setCreatePricePerPax(foundTrip.pricePerPax || 0);
      const nextNum = (foundTrip.groups?.length || 0) + 1;
      setCreateGroupNumber(nextNum);
    }
  };

  // Toggle accordion
  const toggleParticipants = (groupId: string) => {
    setExpandedParticipants((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const firstTrip = trips[0];
    const firstTripId = firstTrip?.id || "";
    setCreateTripId(firstTripId);
    setCreateDriverId("");
    setCreateMaxPax(6);
    setCreatePricePerPax(firstTrip?.pricePerPax || 850000);
    setCreateStatus("open");
    setCreateGroupNumber((firstTrip?.groups?.length || 0) + 1);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  // Submit Create Group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTripId) {
      setCreateError("Silakan pilih jadwal trip terlebih dahulu.");
      return;
    }
    if (createMaxPax < 1 || createMaxPax > 15) {
      setCreateError("Kapasitas maksimal harus antara 1 sampai 15 pax.");
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const payload: CreateBookingGroupPayload = {
        tripId: createTripId,
        driverId: createDriverId || undefined,
        groupNumber: createGroupNumber,
        maxParticipants: createMaxPax,
        capacity: createMaxPax,
        pricePerPerson: createPricePerPax,
        status: createStatus,
      };

      await adminService.createGroup(payload);
      setIsCreateModalOpen(false);
      showSuccess("Grup armada baru berhasil ditambahkan!");
      await fetchData();
    } catch (err: unknown) {
      setCreateError(
        (err as { message?: string })?.message || "Gagal membuat grup armada baru."
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (group: BookingGroup) => {
    setEditingGroup(group);
    setEditMaxPax(group.capacity || group.maxParticipants || 6);
    setEditPricePerPax(group.pricePerPerson || group.trip?.pricePerPax || 0);
    setEditStatus(group.status || "open");
    setEditGroupNumber(group.groupNumber || 1);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Submit Edit Group
  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;

    if (editMaxPax < (editingGroup.currentParticipants || 0)) {
      setEditError(
        `Kapasitas tidak boleh lebih kecil dari jumlah penumpang saat ini (${editingGroup.currentParticipants} Pax).`
      );
      return;
    }

    setIsSubmittingEdit(true);
    setEditError(null);

    try {
      const payload: UpdateBookingGroupPayload = {
        maxParticipants: editMaxPax,
        capacity: editMaxPax,
        pricePerPerson: editPricePerPax,
        status: editStatus,
        groupNumber: editGroupNumber,
      };

      await adminService.updateGroup(editingGroup.id, payload);
      setIsEditModalOpen(false);
      showSuccess("Data grup armada berhasil diperbarui!");
      await fetchData();
    } catch (err: unknown) {
      setEditError(
        (err as { message?: string })?.message || "Gagal memperbarui grup armada."
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Driver Assignment Modal
  const handleOpenDriverModal = (group: BookingGroup) => {
    setGroupForDriver(group);
    setSelectedDriverId(group.driverId || "");
    setDriverModalError(null);
    setIsDriverModalOpen(true);
  };

  // Submit Driver Assignment
  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForDriver) return;

    setIsSubmittingDriver(true);
    setDriverModalError(null);

    try {
      const driverIdToSet = selectedDriverId ? selectedDriverId : null;
      const res = await adminService.assignDriverToGroup(groupForDriver.id, driverIdToSet);
      setIsDriverModalOpen(false);
      showSuccess(res.message || "Penugasan driver berhasil diperbarui!");
      await fetchData();
    } catch (err: unknown) {
      setDriverModalError(
        (err as { message?: string })?.message || "Gagal menugaskan driver."
      );
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (group: BookingGroup) => {
    setGroupToDelete(group);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  // Submit Delete Group
  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    const currentParts = groupToDelete.currentParticipants || groupToDelete.participants?.length || 0;
    if (currentParts > 0) {
      setDeleteError(
        "Tidak dapat menghapus armada yang memiliki peserta aktif. Silakan pindahkan peserta terlebih dahulu di menu Manajemen Peserta."
      );
      return;
    }

    setIsSubmittingDelete(true);
    setDeleteError(null);

    try {
      await adminService.deleteGroup(groupToDelete.id);
      setIsDeleteModalOpen(false);
      showSuccess("Grup armada berhasil dihapus.");
      await fetchData();
    } catch (err: unknown) {
      setDeleteError(
        (err as { message?: string })?.message || "Gagal menghapus grup armada."
      );
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setTripFilter("all");
    setDriverFilter("all");
    setStatusFilter("all");
  };

  // Filtered Groups Client-Side
  const filteredGroups = groups.filter((g) => {
    if (tripFilter !== "all" && g.tripId !== tripFilter) return false;
    if (driverFilter !== "all" && g.driverId !== driverFilter) return false;
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const destName = g.trip?.destination?.name || g.trip?.destination?.title || "";
      const driverName = g.driver?.fullName || g.driver?.name || "";
      const plate = g.driver?.plateNumber || g.driver?.vehiclePlat || "";
      const vehicle = g.driver?.vehicleType || g.driver?.vehicleModel || "";
      const groupName = g.name || `Grup Mobil #${g.groupNumber}`;
      return (
        destName.toLowerCase().includes(q) ||
        driverName.toLowerCase().includes(q) ||
        plate.toLowerCase().includes(q) ||
        vehicle.toLowerCase().includes(q) ||
        groupName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalGroupsCount = groups.length;
  const readyGroupsCount = groups.filter((g) => g.status === "open" || g.status === "confirmed").length;
  const fullGroupsCount = groups.filter((g) => g.status === "full" || (g.currentParticipants >= (g.capacity || 6))).length;
  const unassignedDriverCount = groups.filter((g) => !g.driverId && !g.driver).length;

  const renderStatusBadge = (status: GroupStatus) => {
    switch (status) {
      case "open":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Slot Tersedia (Open)</Badge>;
      case "waiting":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold">Menunggu Kuota</Badge>;
      case "full":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold">Grup Penuh</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">Terkonfirmasi Jalan</Badge>;
      case "in_progress":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-semibold">Sedang Perjalanan</Badge>;
      case "completed":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold">Selesai</Badge>;
      case "cancelled":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold">Dibatalkan</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00677d] uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Manajemen Operasional Armada</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Grup Armada Mobil
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola unit mobil 6-seater, atur kapasitas penumpang, harga per pax, dan penugasan sopir armada.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-[#00677d] hover:bg-[#005264] text-white shadow-md shadow-[#00677d]/20 rounded-xl px-5 py-2.5 font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Grup Armada</span>
        </Button>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Armada</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalGroupsCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Unit armada terdaftar</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Siap Berangkat</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-2">{readyGroupsCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Open & Terkonfirmasi</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Armada Penuh</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-purple-600 mt-2">{fullGroupsCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Kapasitas 100% terisi</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tanpa Driver</span>
            <div className={`p-2 rounded-xl ${unassignedDriverCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-black mt-2 ${unassignedDriverCount > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {unassignedDriverCount}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Perlu penugasan sopir</span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Filter className="h-4 w-4 text-[#00677d]" />
            <span>Filter & Pencarian Armada</span>
          </div>
          {(searchQuery || tripFilter !== "all" || driverFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari destinasi, driver, plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
          </div>

          {/* Trip Selector */}
          <div>
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Jadwal Trip</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {getDestinationTitle(t.destination)} ({formatDate(t.departureDate)})
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Penugasan Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.name} ({d.plateNumber || d.vehiclePlat || "Tanpa Plat"})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Status Grup</option>
              <option value="open">Slot Tersedia (Open)</option>
              <option value="waiting">Menunggu Kuota (Waiting)</option>
              <option value="full">Grup Penuh (Full)</option>
              <option value="confirmed">Terkonfirmasi (Confirmed)</option>
              <option value="in_progress">Sedang Jalan (In Progress)</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="cancelled">Dibatalkan (Cancelled)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
          <span className="text-sm font-medium text-slate-500">Memuat data grup armada...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="p-4 rounded-full bg-slate-100 text-slate-400 w-fit mx-auto">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada grup armada ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || tripFilter !== "all" || driverFilter !== "all" || statusFilter !== "all"
              ? "Tidak ada data grup armada yang cocok dengan filter pencarian saat ini."
              : "Belum ada grup armada yang terdaftar. Klik tombol Tambah Grup Armada di atas untuk membuat unit baru."}
          </p>
          {(searchQuery || tripFilter !== "all" || driverFilter !== "all" || statusFilter !== "all") && (
            <Button onClick={handleResetFilters} variant="outline" className="text-xs rounded-xl mt-2">
              Reset Semua Filter
            </Button>
          )}
        </Card>
      ) : (
        /* Groups Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredGroups.map((group) => {
            const dest = group.trip?.destination;
            const destTitle = getDestinationTitle(dest);
            const currentPax = group.currentParticipants || group.participants?.length || 0;
            const maxPax = group.capacity || group.maxParticipants || 6;
            const percent = calculateOccupancyPercent(currentPax, maxPax);
            const price = group.pricePerPerson || group.trip?.pricePerPax || 0;
            const totalRevenue = price * currentPax;
            const isExpanded = !!expandedParticipants[group.id];
            const participantsList = group.participants || [];

            return (
              <Card
                key={group.id}
                className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Card Top: Destination & Group Info */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-[#00677d] bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
                          {group.name || `Grup Mobil #${group.groupNumber}`}
                        </span>
                        {renderStatusBadge(group.status)}
                      </div>
                      <h3 className="font-heading text-lg font-bold text-slate-900 mt-1">
                        {destTitle}
                      </h3>
                      {dest?.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                          <span>{dest.location}</span>
                        </p>
                      )}
                    </div>

                    {/* Destination Thumbnail */}
                    {dest?.coverImage && (
                      <div className="relative h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm">
                        <Image
                          src={dest.coverImage}
                          alt={destTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* Trip Schedule & Price */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Jadwal Berangkat</span>
                      <p className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-[#00677d]" />
                        {group.trip?.departureDate ? formatDate(group.trip.departureDate) : "-"}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Harga per Pax</span>
                      <p className="font-extrabold text-[#ff7f50] flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {formatCurrency(price)}
                      </p>
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-600 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span>Kapasitas Kursi Armada:</span>
                      </span>
                      <span className="font-bold text-slate-800">
                        {currentPax} / {maxPax} Pax ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          percent >= 100
                            ? "bg-purple-600"
                            : percent >= 70
                            ? "bg-emerald-500"
                            : "bg-[#00677d]"
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{maxPax - currentPax} kursi tersisa</span>
                      <span>Est. Terkumpul: {formatCurrency(totalRevenue)}</span>
                    </div>
                  </div>

                  {/* Driver Section */}
                  <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-slate-400" />
                        <span>Sopir & Armada Mobil</span>
                      </span>
                      <button
                        onClick={() => handleOpenDriverModal(group)}
                        className="text-[11px] font-bold text-[#00677d] hover:text-[#005264] flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        <span>{group.driver ? "Ganti Driver" : "Tugaskan Driver"}</span>
                      </button>
                    </div>

                    {group.driver ? (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2.5">
                          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-teal-50 border border-teal-100 flex items-center justify-center text-xs font-bold text-[#00677d]">
                            {group.driver.photoUrl ? (
                              <Image
                                src={group.driver.photoUrl}
                                alt={group.driver.fullName || group.driver.name || "Driver"}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              (group.driver.fullName || group.driver.name || "D").charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{group.driver.fullName || group.driver.name}</span>
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0 font-semibold">
                                Aktif
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{group.driver.vehicleType || group.driver.vehicleModel || "Toyota HiAce"}</span>
                              <span>•</span>
                              <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1 rounded">
                                {group.driver.plateNumber || group.driver.vehiclePlat || "N 1234 XY"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {(group.driver.phoneNumber || group.driver.phone) && (
                          <a
                            href={`https://wa.me/${(group.driver.phoneNumber || group.driver.phone || "").replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                            title="Chat WhatsApp Driver"
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-800 text-xs">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <span className="font-semibold">Belum ada driver yang ditugaskan</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenDriverModal(group)}
                          className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-[11px] font-bold rounded-lg px-2.5"
                        >
                          Tugaskan
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Accordion: Participants List */}
                  <div>
                    <button
                      onClick={() => toggleParticipants(group.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-[#00677d]" />
                        <span>Daftar Penumpang ({participantsList.length} Orang)</span>
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-slate-50/60 rounded-xl border border-slate-200/60 space-y-2">
                        {participantsList.length === 0 ? (
                          <p className="text-[11px] text-slate-400 text-center py-2">
                            Belum ada penumpang di armada ini.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {participantsList.map((p, idx) => {
                              const payBadge = getPaymentBadge(p.paymentStatus);
                              return (
                                <div
                                  key={p.id || idx}
                                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 text-xs"
                                >
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900">{p.fullName}</span>
                                      <span className="text-[10px] font-mono text-slate-400">
                                        ({p.bookingCode})
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                      <span>{p.phoneNumber || p.email}</span>
                                      {p.nationality && (
                                        <>
                                          <span>•</span>
                                          <span>{p.nationality}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={`${payBadge.className} text-[10px] font-semibold`}>
                                      {payBadge.label}
                                    </Badge>
                                    <Link
                                      href={`/admin/participants?search=${p.bookingCode}`}
                                      className="text-[11px] font-bold text-[#00677d] hover:underline"
                                    >
                                      Kelola
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Action Buttons */}
                <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDriverModal(group)}
                      className="text-xs font-semibold rounded-xl text-slate-700 hover:text-[#00677d] flex items-center gap-1.5"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>Driver</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditModal(group)}
                      className="text-xs font-semibold rounded-xl text-slate-700 hover:text-[#00677d] flex items-center gap-1.5"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDeleteModal(group)}
                    className="text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Modal Buat Grup Baru (POST /api/admin/groups)                         */}
      {/* ========================================================================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00677d]" />
              <span>Tambah Grup Armada Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat unit rombongan mobil baru di bawah jadwal trip tertentu.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
            {/* Pilih Trip */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Pilih Jadwal Trip <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={createTripId}
                onChange={(e) => handleCreateTripChange(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Pilih Jadwal Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getDestinationTitle(t.destination)} — {formatDate(t.departureDate)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Nomor Urut Grup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor Urut Grup</label>
                <Input
                  type="number"
                  min={1}
                  value={createGroupNumber || ""}
                  onChange={(e) => setCreateGroupNumber(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Auto (1, 2, ...)"
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              {/* Kapasitas Pax */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kapasitas Kursi (Pax)</label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  required
                  value={createMaxPax}
                  onChange={(e) => setCreateMaxPax(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Harga per Pax */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Harga per Pax (IDR)</label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  required
                  value={createPricePerPax}
                  onChange={(e) => setCreatePricePerPax(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              {/* Status Awal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Awal</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as GroupStatus)}
                  className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="open">Slot Tersedia (Open)</option>
                  <option value="waiting">Menunggu Kuota (Waiting)</option>
                  <option value="confirmed">Terkonfirmasi (Confirmed)</option>
                </select>
              </div>
            </div>

            {/* Pilih Driver Opsional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tugaskan Sopir (Opsional)</label>
              <select
                value={createDriverId}
                onChange={(e) => setCreateDriverId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Belum Ditugaskan --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.name} — {d.vehicleType || d.vehicleModel || "HiAce"} ({d.plateNumber || d.vehiclePlat || "Tanpa Plat"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-xs rounded-xl font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingCreate}
                className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isSubmittingCreate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Grup Armada</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. Modal Edit Properti Grup (PATCH /api/admin/groups/:id)                 */}
      {/* ========================================================================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-[#00677d]" />
              <span>Edit Properti Grup Armada</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingGroup?.name || `Grup Mobil #${editingGroup?.groupNumber}`} — {getDestinationTitle(editingGroup?.trip?.destination)}
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateGroup} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              {/* Nomor Urut */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor Urut Grup</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editGroupNumber}
                  onChange={(e) => setEditGroupNumber(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              {/* Status Grup */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Grup</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as GroupStatus)}
                  className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="open">Slot Tersedia (Open)</option>
                  <option value="waiting">Menunggu Kuota (Waiting)</option>
                  <option value="full">Grup Penuh (Full)</option>
                  <option value="confirmed">Terkonfirmasi (Confirmed)</option>
                  <option value="in_progress">Sedang Jalan (In Progress)</option>
                  <option value="completed">Selesai (Completed)</option>
                  <option value="cancelled">Dibatalkan (Cancelled)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kapasitas Maksimal */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kapasitas Maksimal (Pax)</label>
                <Input
                  type="number"
                  min={1}
                  max={15}
                  required
                  value={editMaxPax}
                  onChange={(e) => setEditMaxPax(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
                <span className="text-[10px] text-slate-400">
                  Saat ini: {editingGroup?.currentParticipants || 0} pax terdaftar
                </span>
              </div>

              {/* Harga per Pax */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Harga per Pax (IDR)</label>
                <Input
                  type="number"
                  min={0}
                  step={10000}
                  required
                  value={editPricePerPax}
                  onChange={(e) => setEditPricePerPax(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs rounded-xl font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingEdit}
                className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isSubmittingEdit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. Modal Penugasan / Pemindahan Driver (PATCH /api/admin/groups/:id/driver)*/}
      {/* ========================================================================= */}
      <Dialog open={isDriverModalOpen} onOpenChange={setIsDriverModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-[#00677d]" />
              <span>Penugasan Driver Armada</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tugaskan, ubah sopir, atau copot driver untuk unit armada ini.
            </DialogDescription>
          </DialogHeader>

          {driverModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{driverModalError}</span>
            </div>
          )}

          <form onSubmit={handleAssignDriver} className="space-y-4 pt-2">
            {/* Info Armada Saat Ini */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
              <div className="font-bold text-slate-900">
                {groupForDriver?.name || `Grup Mobil #${groupForDriver?.groupNumber}`}
              </div>
              <div className="text-slate-500">
                Destinasi: {getDestinationTitle(groupForDriver?.trip?.destination)}
              </div>
              <div className="text-slate-500">
                Jadwal: {groupForDriver?.trip?.departureDate ? formatDate(groupForDriver.trip.departureDate) : "-"}
              </div>
            </div>

            {/* Dropdown Driver */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Copot Driver / Tidak Ditugaskan --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.name} — {d.vehicleType || d.vehicleModel || "HiAce"} ({d.plateNumber || d.vehiclePlat || "Tanpa Plat"})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDriverModalOpen(false)}
                className="text-xs rounded-xl font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDriver}
                className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isSubmittingDriver ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Konfirmasi Penugasan</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. Modal Konfirmasi Hapus Grup (DELETE /api/admin/groups/:id)             */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>Hapus Grup Armada</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2 text-xs text-slate-600">
            <p>
              Apakah Anda yakin ingin menghapus{" "}
              <strong className="text-slate-900">
                {groupToDelete?.name || `Grup Mobil #${groupToDelete?.groupNumber}`}
              </strong>{" "}
              pada destinasi{" "}
              <strong className="text-slate-900">
                {getDestinationTitle(groupToDelete?.trip?.destination)}
              </strong>
              ?
            </p>

            {(groupToDelete?.currentParticipants || groupToDelete?.participants?.length || 0) > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Perhatian:</strong> Grup ini masih memiliki{" "}
                  {groupToDelete?.currentParticipants || groupToDelete?.participants?.length} peserta aktif.
                  Hapus hanya diizinkan untuk grup kosong.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs rounded-xl font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={
                isSubmittingDelete ||
                (groupToDelete?.currentParticipants || groupToDelete?.participants?.length || 0) > 0
              }
              onClick={handleDeleteGroup}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
            >
              {isSubmittingDelete ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Hapus Sekarang</span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

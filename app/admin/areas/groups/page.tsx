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
  Sparkles,
  Printer,
  FileText,
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
import { printGroupManifest } from "@/src/lib/manifest-printer";
import {
  formatCurrency,
  formatDate,
  calculateOccupancyPercent,
  getDestinationTitle,
  getDestinationPrice,
  getPaymentBadge,
  getEffectiveGroupStatus,
  isTripPast,
  evaluateDriverAvailability,
  extractApiErrorDetails,
} from "@/src/lib/utils";
import type {
  BookingGroup,
  Trip,
  Driver,
  Vehicle,
  GroupStatus,
  CreateBookingGroupPayload,
  UpdateBookingGroupPayload,
} from "@/src/types";

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tripFilter, setTripFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Accordion state
  const [expandedParticipants, setExpandedParticipants] = useState<Record<string, boolean>>({});

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTripId, setCreateTripId] = useState("");
  const [createDriverId, setCreateDriverId] = useState("");
  const [createVehicleId, setCreateVehicleId] = useState("");
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
  const [editDriverId, setEditDriverId] = useState<string>("");
  const [editVehicleId, setEditVehicleId] = useState<string>("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Driver Assignment Modal State
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [groupForDriver, setGroupForDriver] = useState<BookingGroup | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [driverModalError, setDriverModalError] = useState<string | null>(null);

  // Vehicle Assignment Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [groupForVehicle, setGroupForVehicle] = useState<BookingGroup | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [vehicleModalError, setVehicleModalError] = useState<string | null>(null);

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
      const [groupsData, tripsData, driversData, vehiclesData] = await Promise.all([
        adminService.getGroups(),
        adminService.getTrips(),
        adminService.getDrivers(),
        adminService.getVehicles(),
      ]);
      setGroups(groupsData);
      setTrips(tripsData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error("Gagal memuat data grup armada:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    setCreateVehicleId("");
    setCreateMaxPax(6);
    setCreatePricePerPax(firstTrip?.pricePerPax || (firstTrip?.destination ? getDestinationPrice(firstTrip.destination) : 0));
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

    if (createDriverId) {
      const selectedTrip = trips.find((t) => t.id === createTripId);
      const chosenDriver = drivers.find((d) => d.id === createDriverId);
      if (selectedTrip && chosenDriver) {
        const avail = evaluateDriverAvailability(chosenDriver, selectedTrip.departureDate);
        if (!avail.isAvailable) {
          setCreateError(
            `Driver ${chosenDriver.fullName || chosenDriver.name} tidak dapat ditugaskan: ${avail.reason}`
          );
          return;
        }
      }
    }

    setIsSubmittingCreate(true);
    setCreateError(null);

    try {
      const payload: CreateBookingGroupPayload = {
        tripId: createTripId,
        driverId: createDriverId ? createDriverId : undefined,
        vehicleId: createVehicleId ? createVehicleId : undefined,
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
      const details = extractApiErrorDetails(err);
      setCreateError(details.message || "Gagal membuat grup armada baru.");
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
    setEditDriverId(group.driverId || group.driver?.id || "");
    setEditVehicleId(group.vehicleId || group.vehicle?.id || "");
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

    if (editDriverId && editDriverId !== editingGroup.driverId) {
      const tripDate = editingGroup.trip?.departureDate;
      const chosenDriver = drivers.find((d) => d.id === editDriverId);
      if (chosenDriver && tripDate) {
        const avail = evaluateDriverAvailability(chosenDriver, tripDate);
        if (!avail.isAvailable) {
          setEditError(
            `Driver ${chosenDriver.fullName || chosenDriver.name} tidak dapat ditugaskan: ${avail.reason}`
          );
          return;
        }
      }
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
        driverId: editDriverId ? editDriverId : null,
        vehicleId: editVehicleId ? editVehicleId : null,
      };

      await adminService.updateGroup(editingGroup.id, payload);
      setIsEditModalOpen(false);
      showSuccess("Data grup armada berhasil diperbarui!");
      await fetchData();
    } catch (err: unknown) {
      const details = extractApiErrorDetails(err);
      setEditError(details.message || "Gagal memperbarui grup armada.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Driver Assignment Modal
  const handleOpenDriverModal = (group: BookingGroup) => {
    setGroupForDriver(group);
    setSelectedDriverId(group.driverId || group.driver?.id || "");
    setDriverModalError(null);
    setIsDriverModalOpen(true);
  };

  // Submit Driver Assignment
  const handleAssignDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForDriver) return;

    if (selectedDriverId && selectedDriverId !== groupForDriver.driverId) {
      const tripDate = groupForDriver.trip?.departureDate;
      const chosenDriver = drivers.find((d) => d.id === selectedDriverId);
      if (chosenDriver && tripDate) {
        const avail = evaluateDriverAvailability(chosenDriver, tripDate);
        if (!avail.isAvailable) {
          setDriverModalError(
            `Driver ${chosenDriver.fullName || chosenDriver.name} tidak dapat ditugaskan: ${avail.reason}`
          );
          return;
        }
      }
    }

    setIsSubmittingDriver(true);
    setDriverModalError(null);

    try {
      const dId = selectedDriverId ? selectedDriverId : null;
      await adminService.assignDriverToGroup(groupForDriver.id, dId);
      setIsDriverModalOpen(false);
      showSuccess(
        dId
          ? "Driver berhasil ditugaskan ke grup armada!"
          : "Driver berhasil dicopot dari grup armada."
      );
      await fetchData();
    } catch (err: unknown) {
      const details = extractApiErrorDetails(err);
      setDriverModalError(details.message || "Gagal menugaskan driver.");
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Open Vehicle Assignment Modal
  const handleOpenVehicleModal = (group: BookingGroup) => {
    setGroupForVehicle(group);
    setSelectedVehicleId(group.vehicleId || group.vehicle?.id || "");
    setVehicleModalError(null);
    setIsVehicleModalOpen(true);
  };

  // Submit Vehicle Assignment
  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForVehicle) return;

    setIsSubmittingVehicle(true);
    setVehicleModalError(null);

    try {
      const vId = selectedVehicleId ? selectedVehicleId : null;
      await adminService.assignVehicleToGroup(groupForVehicle.id, vId);
      setIsVehicleModalOpen(false);
      showSuccess(
        vId
          ? "Unit armada fisik berhasil dipasangkan ke grup!"
          : "Unit armada berhasil dilepaskan dari grup."
      );
      await fetchData();
    } catch (err: unknown) {
      setVehicleModalError(
        (err as { message?: string })?.message || "Gagal memasangkan armada."
      );
    } finally {
      setIsSubmittingVehicle(false);
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

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setTripFilter("all");
    setDriverFilter("all");
    setVehicleFilter("all");
    setStatusFilter("all");
  };

  // Filter logic
  const filteredGroups = groups.filter((group) => {
    const dest = group.trip?.destination;
    const destTitle = getDestinationTitle(dest).toLowerCase();
    const destLoc = (dest?.location || "").toLowerCase();
    const driverName = (group.driver?.fullName || group.driver?.name || "").toLowerCase();
    const vehicleName = (group.vehicle?.name || group.driver?.vehicleModel || "").toLowerCase();
    const vehiclePlate = (group.vehicle?.plateNumber || group.vehicle?.plate_number || group.driver?.plateNumber || "").toLowerCase();
    const groupName = (group.name || `Grup Mobil #${group.groupNumber}`).toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      destTitle.includes(query) ||
      destLoc.includes(query) ||
      driverName.includes(query) ||
      vehicleName.includes(query) ||
      vehiclePlate.includes(query) ||
      groupName.includes(query);

    const matchesTrip = tripFilter === "all" || group.tripId === tripFilter;
    const matchesDriver =
      driverFilter === "all" ||
      (driverFilter === "none" && !group.driverId && !group.driver) ||
      group.driverId === driverFilter ||
      group.driver?.id === driverFilter;

    const matchesVehicle =
      vehicleFilter === "all" ||
      (vehicleFilter === "none" && !group.vehicleId && !group.vehicle) ||
      group.vehicleId === vehicleFilter ||
      group.vehicle?.id === vehicleFilter;

    const effectiveStatus = getEffectiveGroupStatus(group.status, group.trip?.departureDate);
    const matchesStatus = statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesTrip && matchesDriver && matchesVehicle && matchesStatus;
  });

  // Aggregated Stats
  const totalGroupsCount = groups.length;
  const readyGroupsCount = groups.filter((g) => {
    const eff = getEffectiveGroupStatus(g.status, g.trip?.departureDate);
    return eff === "open" || eff === "confirmed";
  }).length;
  const fullGroupsCount = groups.filter((g) => {
    const eff = getEffectiveGroupStatus(g.status, g.trip?.departureDate);
    const current = g.currentParticipants || g.participants?.length || 0;
    const max = g.capacity || g.maxParticipants || 6;
    return (current >= max || eff === "full") && eff !== "completed" && eff !== "cancelled";
  }).length;
  const unassignedDriverCount = groups.filter((g) => {
    const eff = getEffectiveGroupStatus(g.status, g.trip?.departureDate);
    return !g.driverId && !g.driver && eff !== "completed" && eff !== "cancelled";
  }).length;

  const getStatusBadge = (status: GroupStatus, departureDate?: string | null) => {
    const effective = getEffectiveGroupStatus(status, departureDate);
    switch (effective) {
      case "open":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">Tersedia (Open)</Badge>;
      case "waiting":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-semibold">Menunggu Kuota</Badge>;
      case "full":
        return <Badge className="bg-purple-50 text-purple-700 border-purple-200 font-semibold">Grup Penuh</Badge>;
      case "confirmed":
        return <Badge className="bg-[#00677d]/10 text-[#00677d] border-[#00677d]/30 font-semibold">Terkonfirmasi</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">Sedang Jalan</Badge>;
      case "completed":
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-slate-500" />
            <span>Selesai (Completed)</span>
          </Badge>
        );
      case "cancelled":
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200 font-semibold">Dibatalkan</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold">{effective}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00677d] uppercase tracking-wider mb-1">
            <Layers className="h-4 w-4" />
            <span>Manajemen Operasional Rombongan</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Grup Rombongan Mobil
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola unit rombongan mobil 6-seater, atur kapasitas, harga per pax, serta pasangkan personil Driver dan Master Armada.
          </p>
        </div>
        <Button
          onClick={handleOpenCreateModal}
          className="bg-[#00677d] hover:bg-[#005264] text-white shadow-md shadow-[#00677d]/20 rounded-xl px-5 py-2.5 font-semibold flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Grup Mobil</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase">Total Grup</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalGroupsCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Unit rombongan aktif</span>
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
            <span className="text-xs font-bold text-slate-500 uppercase">Rombongan Penuh</span>
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
            <span>Filter & Pencarian Rombongan</span>
          </div>
          {(searchQuery || tripFilter !== "all" || driverFilter !== "all" || vehicleFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <option value="all">Semua Driver</option>
              <option value="none">Tanpa Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.fullName || d.name} (SIM: {d.licenseNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Master Armada</option>
              <option value="none">Tanpa Armada Fisik</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.plateNumber || v.plate_number})
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
              <option value="all">Semua Status</option>
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
          <span className="text-sm font-medium text-slate-500">Memuat data grup rombongan...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <Card className="p-12 text-center rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="p-4 rounded-full bg-slate-100 text-slate-400 w-fit mx-auto">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak ada grup armada ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || tripFilter !== "all" || driverFilter !== "all" || vehicleFilter !== "all" || statusFilter !== "all"
              ? "Tidak ada data grup yang cocok dengan filter pencarian saat ini."
              : "Belum ada grup armada yang terdaftar. Klik tombol Tambah Grup Mobil di atas untuk membuat unit baru."}
          </p>
          {(searchQuery || tripFilter !== "all" || driverFilter !== "all" || vehicleFilter !== "all" || statusFilter !== "all") && (
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
            const price = group.pricePerPerson || group.trip?.pricePerPax || (dest ? getDestinationPrice(dest) : 0);
            const totalRevenue = price * currentPax;
            const isExpanded = expandedParticipants[group.id] || false;
            const participantsList = group.participants || [];

            const assignedVehicle = group.vehicle || group.driver?.vehicle;
            const vehicleTitle = assignedVehicle?.name || group.driver?.vehicleModel || group.driver?.vehicleType;
            const vehiclePlate = assignedVehicle?.plateNumber || assignedVehicle?.plate_number || group.driver?.plateNumber || group.driver?.vehiclePlat;

            const departureDate = group.trip?.departureDate;
            const isPast = isTripPast(departureDate) && group.status !== "cancelled";

            return (
              <Card
                key={group.id}
                className={`rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                  isPast
                    ? "bg-slate-50/70 border-slate-200/90"
                    : "bg-white border-slate-200/80"
                }`}
              >
                <div className="p-5 md:p-6 space-y-4">
                  {/* Card Header: Title & Group Number */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-white text-xs font-bold ${
                            isPast ? "bg-slate-600" : "bg-[#00677d]"
                          }`}
                        >
                          Mobil #{group.groupNumber}
                        </span>
                        {getStatusBadge(group.status, departureDate)}
                      </div>
                      <h3 className="font-heading font-bold text-base text-slate-900 leading-tight">
                        {destTitle}
                      </h3>
                      {dest?.location && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dest.location}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printGroupManifest(group)}
                        className="h-8 px-2.5 text-xs text-[#00677d] border-teal-200 hover:bg-teal-50 hover:text-[#005264] rounded-lg gap-1.5 font-bold shadow-xs transition-all"
                        title="Cetak Surat Jalan & Manifes Penumpang (PDF A4)"
                      >
                        <Printer className="h-3.5 w-3.5 text-[#00677d]" />
                        <span className="hidden sm:inline">Cetak Surat Jalan</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(group)}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-[#00677d] hover:bg-slate-100 rounded-lg"
                        title="Edit Properti Grup"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDeleteModal(group)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus Grup"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Schedule & Price Info */}
                  <div className={`grid grid-cols-2 gap-3 p-3 rounded-xl border text-xs ${
                    isPast ? "bg-slate-100/70 border-slate-200/80" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Jadwal Keberangkatan</span>
                      <p className="font-semibold text-slate-700 flex items-center gap-1">
                        <Calendar className={`h-3.5 w-3.5 ${isPast ? "text-slate-400" : "text-[#00677d]"}`} />
                        {departureDate ? formatDate(departureDate) : "-"}
                        {isPast && (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                            Lampau
                          </span>
                        )}
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
                        <span>Kapasitas Kursi Penumpang:</span>
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

                  {/* Operational Section: Driver & Vehicle Boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Driver Box */}
                    <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5 text-[#00677d]" />
                          <span>Personil Driver</span>
                        </span>
                        <button
                          onClick={() => handleOpenDriverModal(group)}
                          className="text-[11px] font-bold text-[#00677d] hover:underline"
                        >
                          {group.driver ? "Ganti" : "Tugaskan"}
                        </button>
                      </div>

                      {group.driver ? (
                        (() => {
                          const driverAvail = departureDate
                            ? evaluateDriverAvailability(group.driver, departureDate)
                            : null;
                          return (
                            <div className="space-y-1.5 pt-0.5">
                              <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                  <span className="font-bold text-xs text-slate-900 block truncate">
                                    {group.driver.fullName || group.driver.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    SIM: {group.driver.licenseNumber}
                                  </span>
                                </div>
                                {(group.driver.phoneNumber || group.driver.phone) && (
                                  <a
                                    href={`https://wa.me/${(group.driver.phoneNumber || group.driver.phone || "").replace(/[^0-9]/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                    title="WhatsApp Driver"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                )}
                              </div>
                              {driverAvail && !driverAvail.isAvailable && (
                                <div className="px-2 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{driverAvail.statusText}: {driverAvail.reason}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="text-[11px] text-amber-700 italic flex items-center gap-1 py-1">
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Belum ada driver</span>
                        </div>
                      )}
                    </div>

                    {/* Master Armada Physical Vehicle Box */}
                    <div className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <Car className="h-3.5 w-3.5 text-[#00677d]" />
                          <span>Unit Armada</span>
                        </span>
                        <button
                          onClick={() => handleOpenVehicleModal(group)}
                          className="text-[11px] font-bold text-[#00677d] hover:underline"
                        >
                          {assignedVehicle || vehicleTitle ? "Ganti" : "Pasang"}
                        </button>
                      </div>

                      {vehicleTitle ? (
                        <div className="pt-0.5 space-y-0.5">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {vehicleTitle}
                          </span>
                          <span className="font-mono font-extrabold text-[10px] text-[#00677d] bg-white px-1.5 py-0.2 rounded border border-slate-200 inline-block">
                            {vehiclePlate || "NO-PLATE"}
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 italic flex items-center gap-1 py-1">
                          <Car className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>Belum ada armada</span>
                        </div>
                      )}
                    </div>
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
                          <>
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
                                      <p className="text-[10px] text-slate-500">{p.phoneNumber}</p>
                                    </div>
                                    <div>
                                      <Badge className={`${payBadge.className} text-[10px] px-2 py-0.5`}>
                                        {payBadge.label}
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Action Button: Print / Download Manifest for Driver */}
                            <div className="pt-2 border-t border-slate-200/80">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => printGroupManifest(group)}
                                className="w-full justify-center py-2 text-xs font-bold text-[#00677d] bg-white border-teal-200 hover:bg-teal-50 rounded-xl gap-2 shadow-2xs transition-all"
                              >
                                <Printer className="h-3.5 w-3.5 text-[#00677d]" />
                                <span>Download / Cetak Manifes Penumpang (PDF A4)</span>
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Meta */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">ID: {group.id.slice(0, 8)}...</span>
                  <span>Diperbarui: {formatDate(group.updatedAt)}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Modal Tambah Grup Armada Baru (POST /api/admin/groups)                 */}
      {/* ========================================================================= */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#00677d]" />
              <span>Tambah Grup Rombongan Mobil</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Buat unit mobil baru untuk jadwal trip tertentu, serta tentukan driver dan armadanya.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateGroup} className="space-y-4 pt-2">
            {/* Trip Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Jadwal Trip *</label>
              <select
                required
                value={createTripId}
                onChange={(e) => handleCreateTripChange(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="" disabled>-- Pilih Destinasi & Jadwal Trip --</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getDestinationTitle(t.destination)} — {formatDate(t.departureDate)}
                  </option>
                ))}
              </select>
            </div>

            {/* Driver & Vehicle Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {(() => {
                  const selectedCreateTrip = trips.find((t) => t.id === createTripId);
                  const selectedCreateDriver = drivers.find((d) => d.id === createDriverId);
                  const selectedCreateDriverAvail = selectedCreateDriver
                    ? evaluateDriverAvailability(selectedCreateDriver, selectedCreateTrip?.departureDate)
                    : null;

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Personil Driver (Opsional)</label>
                        {selectedCreateTrip && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(selectedCreateTrip.departureDate)}
                          </span>
                        )}
                      </div>
                      <select
                        value={createDriverId}
                        onChange={(e) => setCreateDriverId(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                      >
                        <option value="">-- Tanpa Driver --</option>
                        {drivers.map((d) => {
                          const avail = evaluateDriverAvailability(d, selectedCreateTrip?.departureDate);
                          return (
                            <option
                              key={d.id}
                              value={d.id}
                              disabled={!avail.isAvailable}
                            >
                              {d.fullName || d.name} {avail.isAvailable ? "✓ [Siap]" : `✗ [${avail.statusText}]`}
                            </option>
                          );
                        })}
                      </select>
                      {selectedCreateDriverAvail && (
                        <p
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            selectedCreateDriverAvail.isAvailable ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{selectedCreateDriverAvail.statusText}: {selectedCreateDriverAvail.reason}</span>
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Master Armada (Opsional)</label>
                <select
                  value={createVehicleId}
                  onChange={(e) => setCreateVehicleId(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="">-- Tanpa Armada --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plateNumber || v.plate_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Group Number & Max Pax */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor Mobil</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={createGroupNumber || 1}
                  onChange={(e) => setCreateGroupNumber(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kapasitas Maksimal</label>
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

            {/* Price per pax & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Harga per Pax (Rp)</label>
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Status Grup</label>
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
                className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-md shadow-[#00677d]/20"
              >
                {isSubmittingCreate ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Buat Grup Mobil</span>
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
              <span>Edit Properti Grup Mobil</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui kapasitas, harga, status, driver, dan armada fisik grup ini.
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor Mobil</label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={editGroupNumber}
                  onChange={(e) => setEditGroupNumber(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kapasitas Maksimal</label>
                <Input
                  type="number"
                  min={editingGroup?.currentParticipants || 1}
                  max={15}
                  required
                  value={editMaxPax}
                  onChange={(e) => setEditMaxPax(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                {(() => {
                  const tripDate = editingGroup?.trip?.departureDate;
                  const selectedEditDriver = drivers.find((d) => d.id === editDriverId);
                  const selectedEditDriverAvail = selectedEditDriver
                    ? evaluateDriverAvailability(selectedEditDriver, tripDate)
                    : null;

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700">Personil Driver</label>
                        {tripDate && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(tripDate)}
                          </span>
                        )}
                      </div>
                      <select
                        value={editDriverId}
                        onChange={(e) => setEditDriverId(e.target.value)}
                        className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                      >
                        <option value="">-- Tanpa Driver --</option>
                        {drivers.map((d) => {
                          const avail = evaluateDriverAvailability(d, tripDate);
                          const isCurrentDriver = d.id === editingGroup?.driverId;
                          return (
                            <option
                              key={d.id}
                              value={d.id}
                              disabled={!avail.isAvailable && !isCurrentDriver}
                            >
                              {d.fullName || d.name} {avail.isAvailable ? "✓ [Siap]" : `✗ [${avail.statusText}]`}
                            </option>
                          );
                        })}
                      </select>
                      {selectedEditDriverAvail && (
                        <p
                          className={`text-[10px] font-medium flex items-center gap-1 ${
                            selectedEditDriverAvail.isAvailable ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          <AlertCircle className="h-3 w-3 shrink-0" />
                          <span>{selectedEditDriverAvail.statusText}: {selectedEditDriverAvail.reason}</span>
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Master Armada</label>
                <select
                  value={editVehicleId}
                  onChange={(e) => setEditVehicleId(e.target.value)}
                  className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="">-- Tanpa Armada --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plateNumber || v.plate_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Harga per Pax (Rp)</label>
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
              <UserCheck className="h-5 w-5 text-[#00677d]" />
              <span>Penugasan Driver Rombongan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tugaskan, ubah personil sopir, atau copot driver untuk grup mobil ini.
            </DialogDescription>
          </DialogHeader>

          {driverModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{driverModalError}</span>
            </div>
          )}

          <form onSubmit={handleAssignDriver} className="space-y-4 pt-2">
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

            <div className="space-y-1.5">
              {(() => {
                const tripDate = groupForDriver?.trip?.departureDate;
                const selectedModalDriver = drivers.find((d) => d.id === selectedDriverId);
                const selectedModalDriverAvail = selectedModalDriver
                  ? evaluateDriverAvailability(selectedModalDriver, tripDate)
                  : null;

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Pilih Driver</label>
                      {tripDate && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Evaluasi: {formatDate(tripDate)}
                        </span>
                      )}
                    </div>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                    >
                      <option value="">-- Copot Driver / Tidak Ditugaskan --</option>
                      {drivers.map((d) => {
                        const avail = evaluateDriverAvailability(d, tripDate);
                        const isCurrentDriver = d.id === groupForDriver?.driverId;
                        return (
                          <option
                            key={d.id}
                            value={d.id}
                            disabled={!avail.isAvailable && !isCurrentDriver}
                          >
                            {d.fullName || d.name} {avail.isAvailable ? "✓ [Siap Bertugas]" : `✗ [${avail.statusText}: ${avail.reason}]`} (SIM: {d.licenseNumber}) {d.vehicle?.name ? `[Armada: ${d.vehicle.name}]` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {selectedModalDriverAvail && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2 mt-2 ${
                          selectedModalDriverAvail.isAvailable
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-rose-50 border-rose-200 text-rose-800"
                        }`}
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">{selectedModalDriverAvail.statusText}: </span>
                          <span>{selectedModalDriverAvail.reason}</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
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
      {/* 4. Modal Penugasan / Pemindahan Armada (PATCH /api/admin/groups/:id/vehicle)*/}
      {/* ========================================================================= */}
      <Dialog open={isVehicleModalOpen} onOpenChange={setIsVehicleModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-[#00677d]" />
              <span>Penugasan Master Armada Fisik</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pasangkan unit kendaraan fisik dari master armada ke grup rombongan ini.
            </DialogDescription>
          </DialogHeader>

          {vehicleModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{vehicleModalError}</span>
            </div>
          )}

          <form onSubmit={handleAssignVehicle} className="space-y-4 pt-2">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
              <div className="font-bold text-slate-900">
                {groupForVehicle?.name || `Grup Mobil #${groupForVehicle?.groupNumber}`}
              </div>
              <div className="text-slate-500">
                Destinasi: {getDestinationTitle(groupForVehicle?.trip?.destination)}
              </div>
              <div className="text-slate-500">
                Jadwal: {groupForVehicle?.trip?.departureDate ? formatDate(groupForVehicle.trip.departureDate) : "-"}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Unit Master Armada</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Lepaskan Armada / Tidak Ada Mobil --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — Plat: {v.plateNumber || v.plate_number} ({v.transmission || "Manual"} / {v.capacity || 6} Kursi)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-xs rounded-xl font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingVehicle}
                className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-semibold rounded-xl flex items-center gap-2"
              >
                {isSubmittingVehicle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Konfirmasi Pasang Armada</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. Modal Konfirmasi Hapus Grup (DELETE /api/admin/groups/:id)             */}
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

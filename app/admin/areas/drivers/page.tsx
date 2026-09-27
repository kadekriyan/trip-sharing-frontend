"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Star,
  Phone,
  ShieldCheck,
  UserCheck,
  UserX,
  Car,
  Compass,
  Loader2,
  PackageOpen,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  RotateCcw,
  Calendar,
  Clock,
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
import { formatDate } from "@/src/lib/utils";
import type { Driver, Vehicle, Area } from "@/src/types";

function DriversAdminContent() {
  const searchParams = useSearchParams();
  const initialAreaParam = searchParams.get("areaId") || searchParams.get("area") || "all";

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState(initialAreaParam);
  const [isLoading, setIsLoading] = useState(true);

  // Assign Vehicle Modal State
  const [assignTarget, setAssignTarget] = useState<Driver | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [isAssigningVehicle, setIsAssigningVehicle] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [driversData, vehiclesData, areasData] = await Promise.all([
        adminService.getDrivers(),
        adminService.getVehicles(),
        adminService.getAreas(),
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      setAreas(areasData);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssignModal = (driver: Driver) => {
    setAssignTarget(driver);
    setSelectedVehicleId(driver.vehicleId || driver.vehicle?.id || "");
    setAssignError(null);
  };

  const handleAssignVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    setIsAssigningVehicle(true);
    setAssignError(null);
    try {
      const vehicleIdToSet = selectedVehicleId ? selectedVehicleId : null;
      const res = await adminService.assignVehicleToDriver(assignTarget.id, vehicleIdToSet);
      setActionFeedback({
        type: "success",
        message: res.message || "Penugasan armada ke driver berhasil diperbarui!",
      });
      setAssignTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memasangkan armada ke driver.";
      setAssignError(msg);
    } finally {
      setIsAssigningVehicle(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteDriver(deleteTarget.id);
      setActionFeedback({ type: "success", message: res.message || "Driver berhasil dihapus." });
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus driver.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setAvailabilityFilter("all");
    setVehicleFilter("all");
    setAreaFilter("all");
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(drivers)) return [];
    return drivers.filter((d) => {
      if (!d) return false;
      const name = (d.fullName || d.name || "").toLowerCase();
      const phone = (d.phoneNumber || d.phone || "").toLowerCase();
      const license = (d.licenseNumber || "").toLowerCase();
      const vehicleName = (d.vehicle?.name || d.vehicleModel || d.vehicleType || "").toLowerCase();
      const plate = (d.vehicle?.plateNumber || d.plateNumber || d.vehiclePlat || "").toLowerCase();
      const areaName = (d.area?.name || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchSearch =
        name.includes(query) ||
        phone.includes(query) ||
        license.includes(query) ||
        vehicleName.includes(query) ||
        plate.includes(query) ||
        areaName.includes(query);

      const isAvail =
        d.isAvailable !== undefined
          ? Boolean(d.isAvailable)
          : d.status === "active" || d.status === "available";

      const matchAvail =
        availabilityFilter === "all"
          ? true
          : availabilityFilter === "active" || availabilityFilter === "available"
          ? isAvail
          : availabilityFilter === "on_duty"
          ? d.status === "on_duty"
          : availabilityFilter === "off_duty" || availabilityFilter === "off"
          ? d.status === "off_duty" || !isAvail
          : availabilityFilter === "inactive"
          ? d.status === "inactive"
          : true;

      const hasVehicle = Boolean(d.vehicleId || d.vehicle || d.plateNumber || d.vehicleModel);
      const matchVehicle =
        vehicleFilter === "all"
          ? true
          : vehicleFilter === "assigned"
          ? hasVehicle
          : !hasVehicle;

      const matchArea =
        areaFilter === "all"
          ? true
          : d.areaId === areaFilter ||
            d.area_id === areaFilter ||
            d.area?.id === areaFilter ||
            d.area?.slug === areaFilter;

      return matchSearch && matchAvail && matchVehicle && matchArea;
    });
  }, [drivers, searchQuery, availabilityFilter, vehicleFilter, areaFilter]);

  const totalDriversCount = drivers.length;
  const readyDriversCount = drivers.filter((d) =>
    d.isAvailable !== undefined
      ? Boolean(d.isAvailable)
      : d.status === "active" || d.status === "available"
  ).length;
  const assignedVehicleCount = drivers.filter((d) => d.vehicleId || d.vehicle || d.plateNumber).length;
  const unassignedVehicleCount = totalDriversCount - assignedVehicleCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00677d] uppercase tracking-wider mb-1">
            <UserCheck className="h-4 w-4" />
            <span>Manajemen Personil Pengemudi</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Personil Mitra Driver
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola profil pengemudi, kontak WhatsApp, nomor SIM, rating kepuasan, dan pasangkan dengan master armada.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-md shadow-[#00677d]/20 rounded-xl px-5 py-2.5 font-semibold bg-[#00677d] hover:bg-[#005264] text-white">
          <Link href="/admin/areas/drivers/new">
            <Plus className="h-4 w-4" />
            Daftarkan Driver Baru
          </Link>
        </Button>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border animate-in fade-in slide-in-from-top-2 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold">{actionFeedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Driver</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalDriversCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Mitra terdaftar</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Siap Bertugas</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-2">{readyDriversCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Status available</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Terpasang Armada</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#00677d] mt-2">{assignedVehicleCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Memiliki unit mobil</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tanpa Unit Armada</span>
            <div className={`p-2 rounded-xl ${unassignedVehicleCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-black mt-2 ${unassignedVehicleCount > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {unassignedVehicleCount} Personil
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Driver stand-by</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <UserCheck className="h-4 w-4 text-[#00677d]" />
            <span>Filter & Pencarian Driver</span>
          </div>
          {(searchQuery || availabilityFilter !== "all" || vehicleFilter !== "all" || areaFilter !== "all") && (
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
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              placeholder="Cari driver, no HP, no SIM, atau plat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d] font-medium"
            >
              <option value="all">Semua Wilayah Operasional</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name} ({area.city || "Kota"})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Status Driver</option>
              <option value="active">Siap Bertugas (Active)</option>
              <option value="on_duty">Sedang Bertugas (On Duty)</option>
              <option value="off_duty">Cuti / Libur (Off Duty)</option>
              <option value="inactive">Non-Aktif (Inactive)</option>
            </select>
          </div>

          <div>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Kepemilikan Armada</option>
              <option value="assigned">Sudah Terpasang Unit Mobil</option>
              <option value="unassigned">Belum Terpasang Unit Mobil</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Drivers Grid */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
            <span className="font-semibold text-slate-600">Memuat data personil driver...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-slate-200 space-y-3">
            <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Belum ada personil driver ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || availabilityFilter !== "all" || vehicleFilter !== "all" || areaFilter !== "all"
                ? "Tidak ada data driver yang cocok dengan filter pencarian saat ini."
                : "Daftarkan mitra pengemudi baru untuk mengoperasikan armada perjalanan."}
            </p>
            <Button asChild size="sm" className="bg-[#00677d] text-white rounded-xl">
              <Link href="/admin/areas/drivers/new">Tambah Driver Pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((driver) => {
              const driverName = driver.fullName || driver.name || "Driver Mitra";
              const isAvailable =
                driver.isAvailable !== undefined
                  ? Boolean(driver.isAvailable)
                  : driver.status === "available";

              const assignedVehicle = driver.vehicle;
              const vehicleName =
                assignedVehicle?.name || driver.vehicleModel || driver.vehicleType;
              const vehiclePlate =
                assignedVehicle?.plateNumber ||
                assignedVehicle?.plate_number ||
                driver.plateNumber ||
                driver.vehiclePlat;

              return (
                <Card
                  key={driver.id}
                  className="p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl flex flex-col justify-between space-y-4 bg-white"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#00677d] to-[#004f60] text-white flex flex-col items-center justify-center shrink-0 shadow-sm border border-teal-600/20">
                        <UserCheck className="h-6 w-6 text-teal-200 mb-0.5" />
                        <span className="text-[9px] font-extrabold tracking-wider uppercase opacity-90">Driver</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-heading font-bold text-sm text-[#191c1e] truncate">
                            {driverName}
                          </h3>
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        </div>

                        <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold mt-0.5">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span>{driver.rating || 5.0}</span>
                          <span className="text-slate-400 font-normal">
                            ({driver.totalTrips || 0} Trip Selesai)
                          </span>
                        </div>

                        <a
                          href={`https://wa.me/${driver.phoneNumber?.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#00677d] font-bold hover:underline mt-1"
                        >
                          <Phone className="h-3 w-3" />
                          {driver.phoneNumber || driver.phone || "No HP Kosong"}
                        </a>
                      </div>
                    </div>

                    {/* Area Info Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                      <Compass className="h-3.5 w-3.5 text-[#00677d] shrink-0" />
                      <span className="font-semibold text-slate-700">Area:</span>
                      <span className="truncate">
                        {driver.area?.name || (driver.areaId ? `Area ID: ${driver.areaId.slice(0, 8)}...` : "Semua / Belum Ditugaskan")}
                      </span>
                    </div>

                    {/* Assigned Vehicle Section */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider">Armada Terpasang</span>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignModal(driver)}
                          className="text-[11px] font-bold text-[#00677d] hover:underline flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          {vehicleName ? "Ganti Armada" : "Pasang Armada"}
                        </button>
                      </div>

                      {vehicleName ? (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center justify-between font-medium">
                            <span className="text-slate-600">Model:</span>
                            <span className="font-bold text-slate-900 truncate max-w-[150px]">{vehicleName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">Plat Polisi:</span>
                            <span className="font-mono font-extrabold text-[#00677d] bg-white px-2 py-0.5 rounded border border-slate-200">
                              {vehiclePlate || "NO-PLATE"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 py-1">
                          <Car className="h-4 w-4 text-amber-500 shrink-0" />
                          <span className="italic text-[11px]">Belum dipasangkan ke unit armada</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule / Leave Dynamic Information */}
                    {(driver.inactiveStartDate || driver.inactiveEndDate || driver.activeStartDate || driver.activeEndDate) && (
                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                        {driver.inactiveStartDate && (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                              Cuti: {formatDate(driver.inactiveStartDate)}
                              {driver.inactiveEndDate ? ` s.d. ${formatDate(driver.inactiveEndDate)}` : " ke atas"}
                            </span>
                          </div>
                        )}
                        {driver.activeStartDate && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Kontrak: {formatDate(driver.activeStartDate)}
                              {driver.activeEndDate ? ` s.d. ${formatDate(driver.activeEndDate)}` : " ke atas"}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant={
                            driver.status === "on_duty"
                              ? "azure"
                              : isAvailable || driver.status === "active"
                              ? "default"
                              : driver.status === "off_duty"
                              ? "outline"
                              : "secondary"
                          }
                          className={`capitalize text-[10px] px-2.5 py-0.5 ${
                            driver.status === "on_duty"
                              ? "bg-sky-50 text-sky-800 border-sky-200"
                              : driver.status === "off_duty"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : driver.status === "inactive"
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {driver.status === "on_duty"
                            ? "Sedang Bertugas"
                            : driver.status === "off_duty"
                            ? "Cuti / Off"
                            : driver.status === "inactive"
                            ? "Non-Aktif"
                            : "Siap Bertugas"}
                        </Badge>
                        {driver.statusReason && (
                          <span className="text-[10px] text-amber-600 font-medium italic">
                            {driver.statusReason}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end text-right">
                        <span className="text-[10px] text-slate-700 font-mono font-semibold">
                          SIM: {driver.licenseNumber}
                        </span>
                        {(driver.licenseExpiryDate || driver.license_expiry_date || driver.licenseExpiry) && (
                          <span className="text-[9px] text-slate-400">
                            Exp: {formatDate(driver.licenseExpiryDate || driver.license_expiry_date || driver.licenseExpiry || "")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer: Edit & Delete */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {driver.id.slice(0, 8)}...
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1 rounded-lg">
                        <Link href={`/admin/areas/drivers/${driver.id}/edit`}>
                          <Edit className="h-3.5 w-3.5 text-slate-600" />
                          Edit
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(driver)}
                        className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL PASANGKAN / GANTI ARMADA KE DRIVER                                  */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-[#00677d] mb-1">
              <Car className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Pasangkan Armada ke Driver
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Pilih unit kendaraan fisik dari master armada untuk pengemudi{" "}
              <strong className="text-slate-800">
                &ldquo;{assignTarget?.fullName || assignTarget?.name}&rdquo;
              </strong>.
            </DialogDescription>
          </DialogHeader>

          {assignError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          <form onSubmit={handleAssignVehicleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Pilih Unit Master Armada</label>
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Lepaskan Armada (Tidak Ada Mobil) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plateNumber || v.plate_number}) {v.driverId && v.driverId !== assignTarget?.id ? `[Saat ini dibawa ${v.driver?.fullName || "Driver Lain"}]` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Data penugasan otomatis tersinkronisasi dua arah ke halaman Master Armada dan Grup Rombongan.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAssigningVehicle}
                onClick={() => setAssignTarget(null)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAssigningVehicle}
                className="bg-[#00677d] hover:bg-[#005264] text-white font-bold rounded-xl gap-1.5 shadow-sm"
              >
                {isAssigningVehicle ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
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
      {/* CONFIRMATION MODAL HAPUS DRIVER                                           */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Data Driver?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus driver{" "}
              <strong className="text-slate-800">
                &ldquo;{deleteTarget ? deleteTarget.fullName || deleteTarget.name : ""}&rdquo;
              </strong>. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1 mt-2">
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Ketentuan Penugasan Trip:
            </span>
            <p className="text-amber-700 leading-normal">
              Sistem akan menolak penghapusan jika driver ini sedang ditugaskan pada jadwal trip aktif di sistem.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 mt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl gap-1.5 shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Ya, Hapus Driver
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DriversAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00677d]" />
          <p className="text-xs font-semibold">Memuat halaman driver...</p>
        </div>
      }
    >
      <DriversAdminContent />
    </Suspense>
  );
}


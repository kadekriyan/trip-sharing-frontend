"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  PackageOpen,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Fuel,
  Settings2,
  Users,
  ShieldCheck,
  RotateCcw,
  Sparkles,
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
import type { Vehicle, Driver } from "@/src/types";

export default function VehiclesAdminPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Assignment Modal State
  const [assignTarget, setAssignTarget] = useState<Vehicle | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [vehiclesData, driversData] = await Promise.all([
        adminService.getVehicles(),
        adminService.getDrivers(),
      ]);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAssignModal = (vehicle: Vehicle) => {
    setAssignTarget(vehicle);
    setSelectedDriverId(vehicle.driverId || vehicle.driver?.id || "");
    setAssignError(null);
  };

  const handleAssignDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTarget) return;

    setIsAssigning(true);
    setAssignError(null);
    try {
      const driverIdToSet = selectedDriverId ? selectedDriverId : null;
      const res = await adminService.assignDriverToVehicle(assignTarget.id, driverIdToSet);
      setActionFeedback({
        type: "success",
        message: res.message || "Penugasan driver ke armada berhasil diperbarui!",
      });
      setAssignTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memasangkan driver ke armada.";
      setAssignError(msg);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteVehicle(deleteTarget.id);
      setActionFeedback({ type: "success", message: res.message || "Armada berhasil dihapus." });
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus armada.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDriverFilter("all");
  };

  const filteredVehicles = Array.isArray(vehicles)
    ? vehicles.filter((v) => {
        if (!v) return false;
        const name = (v.name || "").toLowerCase();
        const plate = (v.plateNumber || v.plate_number || "").toLowerCase();
        const type = (v.vehicleType || v.vehicle_type || "").toLowerCase();
        const driverName = (v.driver?.fullName || v.driver?.name || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        const matchSearch =
          name.includes(query) ||
          plate.includes(query) ||
          type.includes(query) ||
          driverName.includes(query);

        const matchStatus =
          statusFilter === "all" ? true : v.status === statusFilter;

        const hasDriver = Boolean(v.driverId || v.driver);
        const matchDriver =
          driverFilter === "all"
            ? true
            : driverFilter === "assigned"
            ? hasDriver
            : driverFilter === "unassigned"
            ? !hasDriver
            : (v.driverId === driverFilter || v.driver?.id === driverFilter);

        return matchSearch && matchStatus && matchDriver;
      })
    : [];

  const totalVehiclesCount = vehicles.length;
  const activeVehiclesCount = vehicles.filter((v) => v.status === "active").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "maintenance").length;
  const assignedDriverCount = vehicles.filter((v) => v.driverId || v.driver).length;
  const unassignedDriverCount = totalVehiclesCount - assignedDriverCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00677d] uppercase tracking-wider mb-1">
            <Car className="h-4 w-4" />
            <span>Master Inventaris Armada Fisik</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Master Armada Kendaraan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola unit kendaraan fisik, spesifikasi teknis, plat nomor, fasilitas, dan pasangkan sopir pengemudi.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-md shadow-[#00677d]/20 rounded-xl px-5 py-2.5 font-semibold bg-[#00677d] hover:bg-[#005264] text-white">
          <Link href="/admin/vehicles/new">
            <Plus className="h-4 w-4" />
            Tambah Armada Baru
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
            <span className="text-xs font-bold text-slate-500 uppercase">Total Unit</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{totalVehiclesCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Unit armada terdaftar</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Armada Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-600 mt-2">{activeVehiclesCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Siap operasional</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Terpasang Driver</span>
            <div className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#00677d] mt-2">{assignedDriverCount}</div>
          <span className="text-[11px] text-slate-500 font-medium">Memiliki sopir tetap</span>
        </Card>

        <Card className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Tanpa Driver / Servis</span>
            <div className={`p-2 rounded-xl ${unassignedDriverCount > 0 || maintenanceCount > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}`}>
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-black mt-2 ${unassignedDriverCount > 0 ? "text-amber-600" : "text-slate-700"}`}>
            {unassignedDriverCount} Unit
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {maintenanceCount > 0 ? `${maintenanceCount} unit masa perawatan` : "Perlu penugasan sopir"}
          </span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Settings2 className="h-4 w-4 text-[#00677d]" />
            <span>Filter & Pencarian Armada</span>
          </div>
          {(searchQuery || statusFilter !== "all" || driverFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
            <Input
              placeholder="Cari armada, tipe, plat nomor, atau nama driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Status Operasional</option>
              <option value="active">Aktif & Siap Jalan</option>
              <option value="maintenance">Dalam Perawatan (Maintenance)</option>
              <option value="inactive">Non-Aktif</option>
            </select>
          </div>

          <div>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
            >
              <option value="all">Semua Status Penugasan Driver</option>
              <option value="assigned">Sudah Terpasang Driver</option>
              <option value="unassigned">Belum Ada Driver</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  Khusus: {d.fullName || d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Vehicles Grid */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl">
        {isLoading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
            <span className="font-semibold text-slate-600">Memuat data master armada...</span>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-slate-200 space-y-3">
            <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Belum ada unit armada ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || statusFilter !== "all" || driverFilter !== "all"
                ? "Tidak ada unit armada yang cocok dengan filter pencarian saat ini."
                : "Daftarkan unit kendaraan Toyota HiAce VIP atau armada lainnya ke dalam sistem."}
            </p>
            <Button asChild size="sm" className="bg-[#00677d] text-white rounded-xl">
              <Link href="/admin/vehicles/new">Tambah Armada Pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const driver = vehicle.driver;
              const hasDriver = Boolean(vehicle.driverId || driver);
              const isAvailable = vehicle.isAvailable !== undefined ? Boolean(vehicle.isAvailable) : vehicle.status === "active";
              const coverImg =
                vehicle.coverImage ||
                vehicle.cover_image ||
                "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800";

              return (
                <Card
                  key={vehicle.id}
                  className="border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden flex flex-col justify-between bg-white"
                >
                  <div>
                    {/* Vehicle Cover Image Banner */}
                    <div className="relative h-44 w-full bg-slate-900">
                      <Image
                        src={coverImg}
                        alt={vehicle.name}
                        fill
                        className="object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <Badge
                          className={`font-mono text-xs font-bold px-2.5 py-1 uppercase shadow-md ${
                            vehicle.status === "active"
                              ? "bg-emerald-600 text-white"
                              : vehicle.status === "maintenance"
                              ? "bg-amber-500 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {vehicle.status === "active"
                            ? "Siap Jalan"
                            : vehicle.status === "maintenance"
                            ? "Perawatan"
                            : "Non-Aktif"}
                        </Badge>

                        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-sm border border-white/50 text-[11px] font-mono font-extrabold text-[#00677d]">
                          {vehicle.plateNumber || vehicle.plate_number || "NO-PLATE"}
                        </div>
                      </div>

                      {/* Bottom Banner Title */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-heading font-extrabold text-base leading-tight truncate">
                          {vehicle.name}
                        </h3>
                        <p className="text-[11px] text-slate-200 flex items-center gap-2 mt-0.5">
                          <span>{vehicle.vehicleType || vehicle.vehicle_type || "Minivan VIP"}</span>
                          <span>•</span>
                          <span>{vehicle.capacity || 6} Kursi Penumpang</span>
                        </p>
                      </div>
                    </div>

                    {/* Specs & Facilities */}
                    <div className="p-4 space-y-3.5">
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Settings2 className="h-3.5 w-3.5 text-[#00677d]" />
                          <span>{vehicle.transmission || "Manual"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Fuel className="h-3.5 w-3.5 text-[#00677d]" />
                          <span>{vehicle.fuelType || vehicle.fuel_type || "Diesel"}</span>
                        </div>
                      </div>

                      {/* Facilities list */}
                      {Array.isArray(vehicle.facility) && vehicle.facility.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {vehicle.facility.slice(0, 4).map((f, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-[#00677d] font-semibold border border-teal-100"
                            >
                              {f}
                            </span>
                          ))}
                          {vehicle.facility.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-bold">
                              +{vehicle.facility.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Assigned Driver Box */}
                      <div className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Driver Ditugaskan</span>
                          <button
                            type="button"
                            onClick={() => handleOpenAssignModal(vehicle)}
                            className="text-[11px] font-bold text-[#00677d] hover:underline flex items-center gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            {hasDriver ? "Ganti Driver" : "Pasang Driver"}
                          </button>
                        </div>

                        {hasDriver ? (
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#00677d] text-white flex items-center justify-center font-bold text-xs">
                                <UserCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-800 block truncate">
                                  {driver?.fullName || driver?.name || "Driver Terpasang"}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {driver?.phoneNumber || driver?.phone || "No HP tidak ada"}
                                </span>
                              </div>
                            </div>
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400 py-0.5">
                            <UserX className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="italic">Belum dipasangkan driver</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {vehicle.id.slice(0, 8)}...
                    </span>

                    <div className="flex items-center gap-1.5 pt-3">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1 rounded-lg">
                        <Link href={`/admin/vehicles/${vehicle.id}/edit`}>
                          <Edit className="h-3.5 w-3.5 text-slate-600" />
                          Edit
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(vehicle)}
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
      {/* MODAL PASANGKAN / GANTI DRIVER KE ARMADA                                  */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(assignTarget)} onOpenChange={(open) => !open && setAssignTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-[#00677d] mb-1">
              <UserCheck className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Pasangkan Driver ke Armada
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Pilih personil pengemudi yang bertanggung jawab membawa armada{" "}
              <strong className="text-slate-800">
                &ldquo;{assignTarget?.name} ({assignTarget?.plateNumber || assignTarget?.plate_number})&rdquo;
              </strong>.
            </DialogDescription>
          </DialogHeader>

          {assignError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{assignError}</span>
            </div>
          )}

          <form onSubmit={handleAssignDriverSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Pilih Personil Driver</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Lepaskan Driver (Kosongkan Penugasan) --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.name} (SIM: {d.licenseNumber}) {d.vehicleId && d.vehicleId !== assignTarget?.id ? `[Saat ini di ${d.vehicle?.name || "Mobil Lain"}]` : ""}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">
                Sistem otomatis memperbarui relasi dua arah antara driver dan armada fisik.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isAssigning}
                onClick={() => setAssignTarget(null)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAssigning}
                className="bg-[#00677d] hover:bg-[#005264] text-white font-bold rounded-xl gap-1.5 shadow-sm"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
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
      {/* MODAL KONFIRMASI HAPUS ARMADA                                             */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
          <DialogHeader className="space-y-2 text-left">
            <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Data Armada Fisik?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Anda akan menghapus armada{" "}
              <strong className="text-slate-800">
                &ldquo;{deleteTarget ? `${deleteTarget.name} (${deleteTarget.plateNumber || deleteTarget.plate_number})` : ""}&rdquo;
              </strong>{" "}
              dari inventaris master. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1 mt-2">
            <span className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              Perlindungan Operasional:
            </span>
            <p className="text-amber-700 leading-normal">
              Penghapusan akan ditolak otomatis oleh server jika unit armada ini sedang terpasang pada grup perjalanan yang aktif.
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
                  Ya, Hapus Armada
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

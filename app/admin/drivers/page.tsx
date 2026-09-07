"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Star,
  Phone,
  ShieldCheck,
  UserCheck,
  User,
  Loader2,
  PackageOpen,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
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
import type { Driver } from "@/src/types";

export default function DriversAdminPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const reloadDrivers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDrivers();
      setDrivers(data);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const data = await adminService.getDrivers();
        if (isMounted) {
          setDrivers(data);
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteDriver(deleteTarget.id);
      setActionFeedback({ type: "success", message: res.message || "Driver berhasil dihapus." });
      setDeleteTarget(null);
      await reloadDrivers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus driver.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = Array.isArray(drivers)
    ? drivers.filter((d) => {
        if (!d) return false;
        const name = (d.fullName || d.name || "").toLowerCase();
        const model = (d.vehicleModel || d.vehicleType || "").toLowerCase();
        const plate = (d.plateNumber || d.vehiclePlat || "").toLowerCase();
        const query = (searchQuery || "").toLowerCase();
        return name.includes(query) || model.includes(query) || plate.includes(query);
      })
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Kelola Driver & Armada Kendaraan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau ketersediaan pengemudi, armada HiAce VIP, lisensi berkendara, dan penugasan trip.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm rounded-xl">
          <Link href="/admin/drivers/new">
            <Plus className="h-4 w-4" />
            Daftarkan Driver Baru
          </Link>
        </Button>
      </div>

      {/* Global Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
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

      {/* Filter and Search */}
      <Card className="p-4 border border-slate-100 shadow-stitch-card bg-white">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <Input
            placeholder="Cari berdasarkan nama driver, jenis armada, atau plat nomor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs bg-slate-50/50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </Card>

      {/* Drivers Grid */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 text-[#00677d] animate-spin" />
            <span>Memuat data driver...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
            <PackageOpen className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Belum ada mitra driver terdaftar.</p>
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/drivers/new">Tambah Driver Pertama</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((driver) => {
              const driverName = driver.fullName || driver.name || "Driver Armada";
              const isAvailable = driver.isAvailable !== undefined ? Boolean(driver.isAvailable) : driver.status === "available";

              return (
                <Card
                  key={driver.id}
                  className="p-5 border border-slate-100 shadow-stitch-card flex flex-col justify-between space-y-4"
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
                          <span className="text-slate-400 font-normal">({driver.totalTrips || 0} Trip)</span>
                        </div>

                        <a
                          href={`https://wa.me/${driver.phoneNumber?.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-[#00677d] font-bold hover:underline mt-1"
                        >
                          <Phone className="h-3 w-3" />
                          {driver.phoneNumber}
                        </a>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Armada Mobil:</span>
                        <span className="font-bold text-slate-800">{driver.vehicleModel || driver.vehicleType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Plat Nomor:</span>
                        <span className="font-mono font-bold text-[#00677d]">{driver.plateNumber || driver.vehiclePlat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Kapasitas:</span>
                        <span className="font-bold text-slate-800">{driver.passengerCapacity || 6} Kursi VIP</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Badge
                        variant={isAvailable ? "default" : "secondary"}
                        className="capitalize text-[10px]"
                      >
                        {isAvailable ? "Siap Bertugas" : "Off / Perawatan"}
                      </Badge>

                      <span className="text-[10px] text-slate-400 font-mono">
                        SIM: {driver.licenseNumber}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer: Edit & Delete */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {driver.id.slice(0, 8)}...
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button asChild size="sm" variant="outline" className="h-8 px-2.5 text-xs gap-1 rounded-lg">
                        <Link href={`/admin/drivers/${driver.id}/edit`}>
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

      {/* CONFIRMATION MODAL HAPUS DRIVER */}
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
              </strong>{" "}
              dan armada terkait. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 space-y-1 mt-2">
            <span className="font-bold block flex items-center gap-1">
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

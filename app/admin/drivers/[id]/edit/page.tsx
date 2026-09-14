"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Car,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import type { Vehicle, Driver } from "@/src/types";

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const driverId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [vehicleId, setVehicleId] = useState<string>("");
  const [status, setStatus] = useState<"active" | "on_duty" | "off_duty" | "inactive">("active");
  const [isAvailable, setIsAvailable] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDriverData() {
      if (!driverId) return;
      setIsLoading(true);
      try {
        const [driver, vehiclesList] = await Promise.all([
          adminService.getDriverById(driverId),
          adminService.getVehicles(),
        ]);

        if (isMounted) {
          setVehicles(vehiclesList);
          if (driver) {
            setFullName(driver.fullName || driver.name || "");
            setPhoneNumber(driver.phoneNumber || driver.phone || "");
            setEmail(driver.email || driver.user?.email || "");
            setLicenseNumber(driver.licenseNumber || "");
            setExperienceYears(driver.experienceYears || 5);
            setVehicleId(driver.vehicleId || driver.vehicle?.id || "");
            let currentStatus: "active" | "on_duty" | "off_duty" | "inactive" = "active";
            if (
              driver.status === "active" ||
              driver.status === "on_duty" ||
              driver.status === "off_duty" ||
              driver.status === "inactive"
            ) {
              currentStatus = driver.status;
            } else if (driver.isAvailable === false) {
              currentStatus = "off_duty";
            } else {
              currentStatus = "active";
            }
            setStatus(currentStatus);
            setIsAvailable(currentStatus === "active");
          }
        }
      } catch {
        if (isMounted) {
          setFeedback({ type: "error", message: "Gagal memuat data driver dari server." });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDriverData();
    return () => {
      isMounted = false;
    };
  }, [driverId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !licenseNumber) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.updateDriver(driverId, {
        fullName,
        phoneNumber,
        email: email ? email.trim() : undefined,
        licenseNumber,
        experienceYears: Number(experienceYears),
        isAvailable: status === "active",
        status: status,
        vehicleId: vehicleId ? vehicleId : null,
      });

      // Synchronize assign vehicle to driver
      await adminService.assignVehicleToDriver(driverId, vehicleId ? vehicleId : null);

      setFeedback({ type: "success", message: "Data personil driver berhasil diperbarui!" });
      setTimeout(() => {
        router.push("/admin/drivers");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui data driver.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <p className="font-semibold text-slate-600">Memuat formulir edit driver...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/admin/drivers">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#191c1e]">
              Edit Personil Driver
            </h1>
            <p className="text-xs text-slate-500">ID: {driverId}</p>
          </div>
        </div>

        <Badge variant="coral" className="text-xs font-bold px-3 py-1">
          Pengemudi Resmi
        </Badge>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#00677d]" />
              Informasi Pengemudi
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Terverifikasi
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Nama Lengkap Pengemudi *
            </label>
            <Input
              required
              placeholder="Contoh: Pak Joko Santoso, S.Pd"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor WhatsApp Driver *
              </label>
              <Input
                required
                placeholder="Contoh: +6281233445577"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Email Driver (Akun Sistem)
              </label>
              <Input
                type="email"
                placeholder="joko@driver.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor Lisensi (SIM A Umum / B1) *
              </label>
              <Input
                required
                placeholder="Contoh: SIM-A-99218201"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pengalaman Mengemudi (Tahun)
              </label>
              <Input
                type="number"
                min={1}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="text-xs"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Penugasan Unit Master Armada */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2 flex items-center gap-2">
            <Car className="h-4 w-4 text-[#00677d]" />
            Penugasan Unit Master Armada Fisik
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pilih Unit Armada Fisik
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Tidak Dipasangkan Armada (Standby / Cadangan) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.plateNumber || v.plate_number}) - {v.transmission || "Manual"}
                  </option>
                ))}
              </select>
            </div>

            {/* Operational Status Select */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Status Operasional Driver *
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as "active" | "on_duty" | "off_duty" | "inactive";
                  setStatus(newStatus);
                  setIsAvailable(newStatus === "active");
                }}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d] font-medium"
              >
                <option value="active">Aktif & Siap Bertugas (Active)</option>
                <option value="on_duty">Sedang Bertugas di Lapangan (On Duty)</option>
                <option value="off_duty">Sedang Cuti / Libur (Off Duty)</option>
                <option value="inactive">Non-Aktif (Inactive)</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Pilih status operasional pengemudi. Driver dengan status &ldquo;Active&rdquo; otomatis terhitung siap ditugaskan pada armada.
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="lg" className="rounded-xl font-semibold">
            <Link href="/admin/drivers">Batal</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="rounded-xl gap-2 font-bold px-8 shadow-md bg-[#00677d] hover:bg-[#005264] text-white"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Car,
  Compass,
  Loader2,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import {
  validateDriverForm,
  extractApiErrorDetails,
  sanitizePhoneNumber,
} from "@/src/lib/utils";
import type { Vehicle, Area } from "@/src/types";

export default function NewDriverPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [activeStartDate, setActiveStartDate] = useState("");
  const [activeEndDate, setActiveEndDate] = useState("");
  const [inactiveStartDate, setInactiveStartDate] = useState("");
  const [inactiveEndDate, setInactiveEndDate] = useState("");
  const [areaId, setAreaId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [status, setStatus] = useState<"active" | "on_duty" | "off_duty" | "inactive">("active");
  const [isAvailable, setIsAvailable] = useState(true);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [vehiclesList, areasList] = await Promise.all([
          adminService.getVehicles(),
          adminService.getAreas(),
        ]);
        setVehicles(vehiclesList);
        setAreas(areasList);
      } catch {
        // Silently
      }
    }
    loadMasterData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Client-side strict validation
    const validation = validateDriverForm({
      fullName,
      phoneNumber,
      email: email ? email.trim() : undefined,
      licenseNumber,
      licenseExpiryDate,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      setFeedback({
        type: "error",
        message: validation.firstErrorMessage || "Harap periksa kolom formulir yang disorot merah.",
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const cleanPhone = sanitizePhoneNumber(phoneNumber);
      const createdDriver = await adminService.addDriver({
        fullName: fullName.trim(),
        phoneNumber: cleanPhone,
        email: email ? email.trim() : undefined,
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate).toISOString() : undefined,
        activeStartDate: activeStartDate ? new Date(activeStartDate).toISOString() : undefined,
        activeEndDate: activeEndDate ? new Date(activeEndDate).toISOString() : undefined,
        inactiveStartDate: inactiveStartDate ? new Date(inactiveStartDate).toISOString() : undefined,
        inactiveEndDate: inactiveEndDate ? new Date(inactiveEndDate).toISOString() : undefined,
        areaId: areaId ? areaId : undefined,
        vehicleId: vehicleId ? vehicleId : undefined,
        status: status,
        isAvailable: status === "active",
        rating: 5.0,
        totalTrips: 0,
      });

      // If vehicle selected, ensure paired
      if (vehicleId && createdDriver?.id) {
        await adminService.assignVehicleToDriver(createdDriver.id, vehicleId);
      }

      setFeedback({ type: "success", message: "Personil driver berhasil didaftarkan!" });
      setTimeout(() => {
        router.push("/admin/areas/drivers");
      }, 1000);
    } catch (err: unknown) {
      const { message, fieldErrors: serverFieldErrors } = extractApiErrorDetails(err);
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      }
      setFeedback({ type: "error", message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/areas/drivers"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Driver
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-[#00677d]" />
            Daftarkan Personil Driver Baru
          </h1>
        </div>
        <Badge variant="azure">Mitra Pengemudi Resmi</Badge>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800 shadow-sm"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-xs font-bold mb-0.5">
              {feedback.type === "success" ? "Berhasil" : "Validasi Formulir Gagal"}
            </p>
            <p className="text-xs text-slate-700 font-medium">{feedback.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-8">
        {/* Section 1: Profil Pribadi Driver */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white rounded-2xl">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Informasi Pribadi & Kontak Pengemudi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama Lengkap Driver *
              </label>
              <Input
                required
                placeholder="Contoh: Pak Joko Santoso, S.Pd"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (fieldErrors.fullName || fieldErrors.name) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.fullName;
                      delete next.name;
                      return next;
                    });
                  }
                }}
                className={`text-xs transition-colors ${
                  fieldErrors.fullName || fieldErrors.name
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    : ""
                }`}
              />
              {(fieldErrors.fullName || fieldErrors.name) && (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.fullName || fieldErrors.name}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor WhatsApp Driver *
              </label>
              <Input
                required
                type="tel"
                placeholder="Contoh: 081233445577 atau +6281233445577"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (fieldErrors.phoneNumber || fieldErrors.phone) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.phoneNumber;
                      delete next.phone;
                      return next;
                    });
                  }
                }}
                className={`text-xs transition-colors ${
                  fieldErrors.phoneNumber || fieldErrors.phone
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    : ""
                }`}
              />
              {(fieldErrors.phoneNumber || fieldErrors.phone) ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.phoneNumber || fieldErrors.phone}</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400 block">
                  Format: 9–15 digit numerik (contoh: 08123456789 atau +628123456789).
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Email Driver (Akun Sistem)
              </label>
              <Input
                type="email"
                placeholder="driver@tripsharing.local (Opsional)"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.email;
                      return next;
                    });
                  }
                }}
                className={`text-xs transition-colors ${
                  fieldErrors.email
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    : ""
                }`}
              />
              {fieldErrors.email ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.email}</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400 block">
                  Jika dikosongkan, sistem membuat email akun otomatis berbasis no WhatsApp.
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor SIM A / B1 *
              </label>
              <Input
                required
                placeholder="SIM-A-99218201..."
                value={licenseNumber}
                onChange={(e) => {
                  setLicenseNumber(e.target.value);
                  if (fieldErrors.licenseNumber) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.licenseNumber;
                      return next;
                    });
                  }
                }}
                className={`text-xs font-mono transition-colors ${
                  fieldErrors.licenseNumber
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    : ""
                }`}
              />
              {fieldErrors.licenseNumber ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.licenseNumber}</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400 block">
                  Nomor SIM minimal 5 karakter alfanumerik.
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tanggal Kadaluwarsa SIM *
              </label>
              <Input
                required
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => {
                  setLicenseExpiryDate(e.target.value);
                  if (fieldErrors.licenseExpiryDate || fieldErrors.license_expiry_date) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.licenseExpiryDate;
                      delete next.license_expiry_date;
                      return next;
                    });
                  }
                }}
                className={`text-xs transition-colors ${
                  fieldErrors.licenseExpiryDate || fieldErrors.license_expiry_date
                    ? "border-rose-500 bg-rose-50/30 text-rose-900 focus-visible:ring-rose-500 focus-visible:border-rose-500"
                    : ""
                }`}
              />
              {(fieldErrors.licenseExpiryDate || fieldErrors.license_expiry_date) ? (
                <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{fieldErrors.licenseExpiryDate || fieldErrors.license_expiry_date}</span>
                </p>
              ) : (
                <span className="text-[10px] text-slate-400 block">
                  Pilih batas masa berlaku lisensi SIM pengemudi.
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: Penugasan Armada Master */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white rounded-2xl">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Penugasan Unit Master Armada
          </h2>

          <div className="space-y-4">
            {/* Operational Area Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-[#00677d]" />
                Wilayah Operasional (Area)
              </label>
              <select
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d] font-medium"
              >
                <option value="">-- Semua Area / Belum Ditugaskan --</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.city || "Kota"} - {a.province || "Provinsi"})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Driver akan dikelompokkan ke dalam wilayah operasional ini untuk mempermudah filter penugasan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pilih Unit Armada Fisik (Opsional)
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Belum Dipasangkan Unit Armada (Standby) --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} — Plat: {v.plateNumber || v.plate_number} ({v.transmission || "Manual"} / {v.capacity || 6} Kursi)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Pilihan diambil langsung dari master inventaris armada fisik. Anda dapat mengubah penugasan ini kapan saja.
              </p>
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

        {/* Section 3: Jadwal & Periode Bertugas / Cuti (Dynamic Date Schedule) */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              Jadwal & Periode Bertugas / Cuti (Otomatisasi Status)
            </h2>
            <Badge variant="azure" className="text-[10px] font-bold">
              Dynamic Date Status
            </Badge>
          </div>

          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-[11px] text-sky-800 flex items-start gap-2">
            <Info className="h-4 w-4 text-[#00677d] shrink-0 mt-0.5" />
            <p>
              Status driver dievaluasi secara dinamis berdasarkan tanggal jadwal trip. Jika tanggal trip jatuh dalam rentang <strong>Cuti / Non-Aktif</strong>, status otomatis berubah menjadi <strong>Off Duty / Cuti</strong> dan tidak dapat ditugaskan pada trip tersebut.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Active Range */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span>Periode Kontrak / Bertugas Aktif (Opsional)</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Kosongkan jika driver aktif tanpa batasan tanggal kontrak tertentu.
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Mulai Aktif Bertugas
                  </label>
                  <Input
                    type="date"
                    value={activeStartDate}
                    onChange={(e) => setActiveStartDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Selesai Aktif Bertugas
                  </label>
                  <Input
                    type="date"
                    value={activeEndDate}
                    onChange={(e) => setActiveEndDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Inactive / Leave Range */}
            <div className="space-y-3 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Periode Cuti / Libur / Non-Aktif (Opsional)</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Isi rentang tanggal saat driver mengajukan cuti atau libur sementara.
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Mulai Cuti / Non-Aktif
                  </label>
                  <Input
                    type="date"
                    value={inactiveStartDate}
                    onChange={(e) => setInactiveStartDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Selesai Cuti / Non-Aktif
                  </label>
                  <Input
                    type="date"
                    value={inactiveEndDate}
                    onChange={(e) => setInactiveEndDate(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/areas/drivers")}
            className="flex-1 justify-center rounded-xl font-semibold"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 justify-center bg-[#00677d] hover:bg-[#005264] text-white rounded-xl font-semibold shadow-md shadow-[#00677d]/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>Mendaftarkan...</span>
              </>
            ) : (
              <span>Daftarkan Personil Driver</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

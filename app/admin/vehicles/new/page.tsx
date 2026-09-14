"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Settings2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import type { Driver } from "@/src/types";

const DEFAULT_FACILITIES = [
  "AC Dingin Double Blower",
  "Reclining Seats VIP",
  "Audio / Bluetooth Player",
  "USB Fast Charging Port",
  "Bagasi Koper Luas",
  "Air Mineral Gratis",
  "Kotak P3K",
  "Payung & Perlengkapan Hujan",
];

export default function NewVehiclePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Toyota HiAce Premio (Minivan VIP)");
  const [capacity, setCapacity] = useState(6);
  const [transmission, setTransmission] = useState("Manual");
  const [fuelType, setFuelType] = useState("Diesel");
  const [coverImage, setCoverImage] = useState("https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800");
  const [facilities, setFacilities] = useState<string[]>([
    "AC Dingin Double Blower",
    "Reclining Seats VIP",
    "Audio / Bluetooth Player",
    "USB Fast Charging Port",
    "Bagasi Koper Luas",
  ]);
  const [status, setStatus] = useState<"active" | "maintenance" | "inactive">("active");
  const [driverId, setDriverId] = useState<string>("");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function loadDrivers() {
      try {
        const list = await adminService.getDrivers();
        setDrivers(list);
      } catch {
        // Silently
      }
    }
    loadDrivers();
  }, []);

  const toggleFacility = (facilityName: string) => {
    setFacilities((prev) =>
      prev.includes(facilityName)
        ? prev.filter((item) => item !== facilityName)
        : [...prev, facilityName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !plateNumber) {
      setFeedback({ type: "error", message: "Harap isi nama armada dan nomor plat polisi (*)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.createVehicle({
        name,
        plateNumber: plateNumber.trim().toUpperCase(),
        vehicleType,
        capacity: Number(capacity) || 6,
        transmission,
        fuelType,
        facility: facilities,
        coverImage: coverImage.trim() || undefined,
        status,
        isAvailable: status === "active",
        driverId: driverId ? driverId : null,
      });

      setFeedback({ type: "success", message: "Unit armada fisik berhasil didaftarkan!" });
      setTimeout(() => {
        router.push("/admin/vehicles");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mendaftarkan armada baru.";
      setFeedback({ type: "error", message: msg });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/vehicles"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Master Armada
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <Car className="h-6 w-6 text-[#00677d]" />
            Tambah Unit Armada Baru
          </h1>
        </div>
        <Badge variant="azure">Kapasitas Standar: 6 Pax VIP</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Data Utama Armada */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white rounded-2xl">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Informasi Pokok Kendaraan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama Model / Seri Armada *
              </label>
              <Input
                required
                placeholder="Contoh: Toyota HiAce Premio Luxury 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor Plat Polisi *
              </label>
              <Input
                required
                placeholder="Contoh: N 7788 VIP"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="text-xs uppercase font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tipe / Kategori Kendaraan
              </label>
              <Input
                placeholder="Contoh: Minivan / HiAce VIP"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Transmisi
              </label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="Tiptronic">Tiptronic</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Jenis Bahan Bakar
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="Diesel">Diesel / Solar</option>
                <option value="Bensin">Bensin / Gasoline</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Electric">Listrik / EV</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                URL Foto Cover Kendaraan
              </label>
              <Input
                type="url"
                placeholder="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="text-xs font-mono text-slate-600"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Fasilitas & Penugasan Driver */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white rounded-2xl">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Fasilitas Armada & Penugasan Driver
          </h2>

          {/* Facilities Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Pilihan Fasilitas Armada
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {DEFAULT_FACILITIES.map((f) => {
                const checked = facilities.includes(f);
                return (
                  <label
                    key={f}
                    onClick={() => toggleFacility(f)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? "bg-teal-50 border-[#00677d] text-[#00677d] font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="h-4 w-4 accent-[#00677d] rounded"
                    />
                    <span>{f}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            {/* Initial Driver Assignment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pasangkan Driver Awal (Opsional)
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Belum Ditugaskan / Kosong --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.name} (SIM: {d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Operasional */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Status Operasional
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "maintenance" | "inactive")}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="active">Aktif & Siap Operasional</option>
                <option value="maintenance">Dalam Perawatan (Maintenance / Servis)</option>
                <option value="inactive">Non-Aktif (Standby)</option>
              </select>
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
            onClick={() => router.push("/admin/vehicles")}
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
              <span>Daftarkan Armada Baru</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

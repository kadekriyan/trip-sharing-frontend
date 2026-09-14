"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  ShieldCheck,
  Fuel,
  Settings2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import type { Driver, Vehicle } from "@/src/types";

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

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("Toyota HiAce Premio (Minivan VIP)");
  const [capacity, setCapacity] = useState(6);
  const [transmission, setTransmission] = useState("Manual");
  const [fuelType, setFuelType] = useState("Diesel");
  const [coverImage, setCoverImage] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "maintenance" | "inactive">("active");
  const [driverId, setDriverId] = useState<string>("");

  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!vehicleId) return;
      setIsLoading(true);
      try {
        const [vehicle, driversList] = await Promise.all([
          adminService.getVehicleById(vehicleId),
          adminService.getDrivers(),
        ]);

        if (isMounted) {
          setDrivers(driversList);
          if (vehicle) {
            setName(vehicle.name || "");
            setPlateNumber(vehicle.plateNumber || vehicle.plate_number || "");
            setVehicleType(vehicle.vehicleType || vehicle.vehicle_type || "Toyota HiAce Premio");
            setCapacity(vehicle.capacity || 6);
            setTransmission(vehicle.transmission || "Manual");
            setFuelType(vehicle.fuelType || vehicle.fuel_type || "Diesel");
            setCoverImage(vehicle.coverImage || vehicle.cover_image || "");
            setFacilities(Array.isArray(vehicle.facility) ? vehicle.facility : []);
            setStatus((vehicle.status as "active" | "maintenance" | "inactive") || "active");
            setDriverId(vehicle.driverId || vehicle.driver?.id || "");
          }
        }
      } catch {
        if (isMounted) {
          setFeedback({ type: "error", message: "Gagal memuat data armada dari server." });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [vehicleId]);

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
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.updateVehicle(vehicleId, {
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

      // Also ensure driver assignment is explicitly updated if changed
      await adminService.assignDriverToVehicle(vehicleId, driverId ? driverId : null);

      setFeedback({ type: "success", message: "Data armada fisik berhasil diperbarui!" });
      setTimeout(() => {
        router.push("/admin/vehicles");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui data armada.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <p className="font-semibold text-slate-600">Memuat formulir edit armada...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/admin/vehicles">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#191c1e]">
              Edit Unit Master Armada
            </h1>
            <p className="text-xs text-slate-500">ID: {vehicleId}</p>
          </div>
        </div>

        <Badge variant="coral" className="text-xs font-bold px-3 py-1">
          Kapasitas: 6 Pax VIP
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
        {/* Section 1: Data Pokok Kendaraan */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h2 className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
              <Car className="h-4 w-4 text-[#00677d]" />
              Informasi Spesifikasi Armada
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Terdaftar
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama Model / Seri Kendaraan *
              </label>
              <Input
                required
                placeholder="Contoh: Toyota HiAce Premio Luxury"
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
                placeholder="Contoh: N 1234 XY"
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
                placeholder="https://images.unsplash.com/..."
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="text-xs font-mono text-slate-600"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Fasilitas & Driver */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white rounded-2xl space-y-4">
          <h2 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2">
            Fasilitas & Penugasan Pengemudi
          </h2>

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
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Driver Ditugaskan
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full text-xs rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="">-- Lepaskan Driver / Tidak Ada --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName || d.name} (SIM: {d.licenseNumber})
                  </option>
                ))}
              </select>
            </div>

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
                <option value="inactive">Non-Aktif</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="lg" className="rounded-xl font-semibold">
            <Link href="/admin/vehicles">Batal</Link>
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

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  UserPlus,
  Search,
  Star,
  Phone,
  CheckCircle2,
  ShieldCheck,
  Navigation,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_DRIVERS } from "@/src/services/mockData";

export default function DriversAdminPage() {
  const [drivers] = useState(MOCK_DRIVERS);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = drivers.filter(
    (d) =>
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Driver & Armada Mobil
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data mitra driver, pantau status operasional kendaraan, dan kapasitas armada 6-pax.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/drivers/new">
            <UserPlus className="h-4 w-4" />
            + Daftarkan Driver Baru
          </Link>
        </Button>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Armada Driver</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {drivers.length} Armada Aktif
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Driver Ready / Siap Jalan</span>
            <span className="font-heading font-extrabold text-xl text-emerald-700 block">
              {drivers.filter((d) => d.status === "available").length} Driver
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Standar Kapasitas</span>
            <span className="font-heading font-extrabold text-xl text-[#00677d] block">
              Maks 6 Kursi / Unit
            </span>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama driver, plat nomor, atau tipe armada..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Total: {filtered.length} Driver
        </span>
      </div>

      {/* Drivers Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((driver) => (
          <Card
            key={driver.id}
            className="p-6 border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-[#00677d]/20 bg-slate-100">
                    <Image
                      src={driver.photoUrl}
                      alt={driver.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-base text-slate-800 block">
                      {driver.fullName}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Star className="h-3.5 w-3.5 fill-[#ff7f50] text-[#ff7f50]" />
                      <span className="font-bold text-slate-800">{driver.rating}</span>
                      <span>({driver.totalTrips} Trip Selesai)</span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant={driver.status === "available" ? "success" : "azure"}
                  className="text-[10px]"
                >
                  {driver.status === "available" ? "Siap Bertugas" : "Sedang di Perjalanan"}
                </Badge>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Kendaraan:</span>
                  <strong className="text-slate-800">{driver.vehicleModel}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Plat Nomor:</span>
                  <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-[#00677d]">
                    {driver.plateNumber}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Kapasitas:</span>
                  <strong className="text-slate-800">{driver.passengerCapacity} Penumpang</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Nomor SIM:</span>
                  <span className="font-mono text-slate-700">{driver.licenseNumber}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Button asChild size="sm" variant="outline" className="flex-1 text-xs gap-1.5">
                <a
                  href={`https://wa.me/${driver.phoneNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  Hubungi WA
                </a>
              </Button>
              <Button size="sm" variant="secondary" className="text-xs px-3 gap-1">
                <Navigation className="h-3.5 w-3.5" />
                Assign
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Car,
  Plus,
  Search,
  Star,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_DRIVERS } from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import type { Driver } from "@/src/types";

export default function DriversAdminPage() {
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await adminService.getDrivers();
        if (isMounted && data.length > 0) {
          setDrivers(data);
        }
      } catch {
        // Fallback
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = drivers.filter(
    (d) =>
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Kelola Driver & Armada
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar mitra pengemudi terverifikasi dan armada kendaraan 6-seater untuk trip sharing.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/drivers/new">
            <Plus className="h-4 w-4" />
            + Daftarkan Driver Baru
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Mitra Driver</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {drivers.length} Orang
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Status Siap Jalan</span>
            <span className="font-heading font-extrabold text-xl text-emerald-700 block">
              {drivers.filter((d) => d.status === "available").length} Armada Siaga
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Rata-rata Rating</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              ⭐ 4.95 / 5.0
            </span>
          </div>
        </Card>
      </div>

      {/* Drivers List Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama driver, tipe mobil, atau plat nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((drv) => (
            <Card
              key={drv.id}
              className="p-6 border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <Image
                    src={drv.photoUrl}
                    alt={drv.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-bold text-sm text-[#191c1e] truncate">
                      {drv.fullName}
                    </h3>
                    <Badge variant="success" className="text-[10px]">
                      {drv.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block">
                    {drv.licenseNumber}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-1">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span>{drv.rating}</span>
                    <span className="text-slate-400 font-normal">({drv.totalTrips} trip sukses)</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Specs Bar */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tipe Kendaraan:</span>
                  <strong className="text-slate-800">{drv.vehicleModel}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Polisi:</span>
                  <span className="font-mono font-bold text-[#00677d]">{drv.plateNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kapasitas Maksimal:</span>
                  <Badge variant="azure" className="text-[10px]">
                    {drv.passengerCapacity} Kursi Traveler
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <a
                  href={`https://wa.me/${drv.phoneNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Hubungi WhatsApp
                </a>
                <span className="text-[10px] text-slate-400">Terverifikasi ✓</span>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

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
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { adminService } from "@/src/services/admin.service";
import type { Driver } from "@/src/types";

export default function DriversAdminPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
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
            Tambah Driver Baru
          </Link>
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama driver, tipe mobil, atau plat nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Total {filtered.length} Driver Terdaftar
          </span>
        </div>

        {/* Drivers List */}
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
            {filtered.map((driver) => (
              <Card
                key={driver.id}
                className="p-5 border border-slate-100 shadow-stitch-card flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    <Image
                      src={driver.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"}
                      alt={driver.fullName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-heading font-bold text-sm text-[#191c1e] truncate">
                        {driver.fullName}
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
                    <span className="font-bold text-slate-800">{driver.vehicleModel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Plat Nomor:</span>
                    <span className="font-mono font-bold text-[#00677d]">{driver.plateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Kapasitas:</span>
                    <span className="font-bold text-slate-800">{driver.passengerCapacity || 6} Kursi VIP</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Badge
                    variant={driver.status === "available" ? "default" : "secondary"}
                    className="capitalize text-[10px]"
                  >
                    {driver.status === "available" ? "Siap Bertugas" : driver.status}
                  </Badge>

                  <span className="text-[10px] text-slate-400 font-mono">
                    SIM: {driver.licenseNumber}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

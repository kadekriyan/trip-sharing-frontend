"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  Calendar,
  Wallet,
  Car,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import { destinationService } from "@/src/services/destination.service";
import {
  formatCurrency,
  calculateOccupancyPercent,
  getPaymentBadge,
} from "@/src/lib/utils";
import type { AdminMetrics, Participant, BookingGroup } from "@/src/types";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    totalRevenue: 0,
    revenueGrowthPercentage: 0,
    activeTripsCount: 0,
    averageOccupancyRate: 0,
    totalParticipants: 0,
    totalBookings: 0,
    availableSeats: 0,
    pendingPaymentsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<Participant[]>([]);
  const [groups, setGroups] = useState<BookingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      setIsLoading(true);
      try {
        const [met, parts, dests] = await Promise.all([
          adminService.getMetrics(),
          adminService.getParticipants({ limit: 5 }),
          destinationService.getAllDestinations(),
        ]);
        if (isMounted) {
          setMetrics(met);
          setRecentBookings(parts.slice(0, 5));
          if (dests.length > 0) {
            const avail = await destinationService.getTripAvailability(dests[0].id);
            if (isMounted) setGroups(avail);
          }
        }
      } catch {
        // Silently handled
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Dashboard Operasional Trip Sharing
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ringkasan okupansi mobil (maks 6 pax), arus kas, dan pendaftaran peserta aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs bg-white">
            <Link href="/admin/participants">
              <Users className="h-3.5 w-3.5 text-[#00677d]" />
              Semua Peserta
            </Link>
          </Button>
          <Button asChild size="sm" className="gap-1.5 text-xs font-bold">
            <Link href="/admin/destinations/new">
              + Buat Trip Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* 1. TOP METRICS CARDS (4 KPI) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Omset */}
          <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Pendapatan</span>
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
                {formatCurrency(metrics.totalRevenue)}
              </span>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+{metrics.revenueGrowthPercentage}% bulan ini</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Total Peserta */}
          <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Traveler</span>
              <div className="h-8 w-8 rounded-lg bg-sky-100 text-[#00677d] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
                {metrics.totalParticipants} Pax
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Dari {metrics.totalBookings} transaksi terdaftar
              </span>
            </div>
          </Card>

          {/* Card 3: Rata-Rata Okupansi Grup 6-Pax */}
          <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Rata-rata Okupansi</span>
              <div className="h-8 w-8 rounded-lg bg-orange-100 text-[#ff7f50] flex items-center justify-center">
                <Car className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
                {metrics.averageOccupancyRate}%
              </span>
              <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full"
                  style={{ width: `${metrics.averageOccupancyRate}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Card 4: Trip Aktif */}
          <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Trip Terjadwal</span>
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="font-heading font-extrabold text-2xl text-[#191c1e] block">
                {metrics.activeTripsCount} Paket
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                {metrics.availableSeats} kursi tersisa di armada
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* 2. FLEET OCCUPANCY LIVE MONITOR (6-SEAT CAPACITY) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <Car className="h-5 w-5 text-[#00677d]" />
              Pantauan Okupansi Armada 6-Seater (Live Group Capacity)
            </h2>
            <p className="text-xs text-slate-500">
              Sistem membatasi maksimal 6 peserta per mobil/grup. Grup baru otomatis dibuat jika kapasitas penuh.
            </p>
          </div>
          <Badge variant="azure" className="text-xs">
            {groups.length} Grup Armada Terbentuk
          </Badge>
        </div>

        {groups.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200">
            <p className="text-xs text-slate-500">Belum ada grup armada yang aktif saat ini.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((group) => {
              const isFull = group.currentParticipants >= group.capacity;
              const remaining = group.capacity - group.currentParticipants;
              const driver = group.driver;

              return (
                <Card
                  key={group.id}
                  className="p-6 border border-slate-100 shadow-stitch-card space-y-4 bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#00677d] uppercase tracking-wider">
                        Grup Mobil #{group.groupNumber}
                      </span>
                      <h3 className="font-heading font-bold text-base text-[#191c1e] mt-0.5">
                        {driver ? `${driver.vehicleModel} (${driver.plateNumber})` : "Armada Standby"}
                      </h3>
                    </div>
                    <Badge variant={isFull ? "destructive" : "azure"} className="font-bold">
                      {isFull ? "Grup Penuh (6/6)" : `${remaining} Kursi Tersedia`}
                    </Badge>
                  </div>

                  {/* Visual 6-Seat Grid */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Visual Kursi (Maks 6 Orang):</span>
                      <span>{group.currentParticipants} / {group.capacity} Terisi</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => {
                        const isOccupied = i < group.currentParticipants;
                        return (
                          <div
                            key={i}
                            className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                              isOccupied
                                ? "bg-[#00677d] text-white border-[#00677d] shadow-sm"
                                : "bg-slate-50 text-slate-400 border-dashed border-slate-300"
                            }`}
                          >
                            <Users className="h-3.5 w-3.5 mb-0.5" />
                            <span>K-{i + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full transition-all"
                      style={{
                        width: `${calculateOccupancyPercent(group.currentParticipants, group.capacity)}%`,
                      }}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. RECENT BOOKINGS TABLE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00677d]" />
            Transaksi Pemesanan Terbaru
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs text-[#00677d] gap-1">
            <Link href="/admin/participants">
              Buka Semua
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden border border-slate-100 shadow-stitch-card bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Memuat transaksi...</div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Belum ada transaksi pemesanan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Kode Booking</th>
                    <th className="px-5 py-3.5">Nama Traveler</th>
                    <th className="px-5 py-3.5">WhatsApp</th>
                    <th className="px-5 py-3.5">Grup</th>
                    <th className="px-5 py-3.5">Tagihan</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map((p) => {
                    const badge = getPaymentBadge(p.paymentStatus);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-[#00677d]">
                          {p.bookingCode}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {p.fullName}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{p.phoneNumber}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                            Grup #{p.group?.groupNumber || 1}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-heading font-extrabold text-[#a43c12]">
                          {formatCurrency(p.totalAmount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-[#00677d]">
                            <Link href="/admin/participants">Kelola</Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

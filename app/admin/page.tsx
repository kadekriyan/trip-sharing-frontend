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
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  MOCK_ADMIN_METRICS,
  MOCK_PARTICIPANTS,
  MOCK_TRIPS,
  MOCK_DRIVERS,
} from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import {
  formatCurrency,
  formatDate,
  calculateOccupancyPercent,
  getPaymentBadge,
} from "@/src/lib/utils";
import type { AdminMetrics, Participant } from "@/src/types";

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics>(MOCK_ADMIN_METRICS);
  const [recentBookings, setRecentBookings] = useState<Participant[]>(MOCK_PARTICIPANTS.slice(0, 5));
  const activeTrip = MOCK_TRIPS[0];

  useEffect(() => {
    let isMounted = true;
    async function loadAdminData() {
      try {
        const [met, parts] = await Promise.all([
          adminService.getMetrics(),
          adminService.getParticipants(),
        ]);
        if (isMounted) {
          setMetrics(met);
          if (parts.length > 0) {
            setRecentBookings(parts.slice(0, 5));
          }
        }
      } catch {
        // Fallback
      }
    }
    loadAdminData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ringkasan metrik operasional, keterisian grup mobil 6-seater, dan transaksi terbaru.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link href="/admin/participants/new">
              <Users className="h-4 w-4" />
              + Tambah Peserta Manual
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Revenue */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pendapatan
            </span>
            <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#ff7f50] flex items-center justify-center">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#191c1e] block">
              {formatCurrency(metrics.totalRevenue)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
              <TrendingUp className="h-3 w-3" />
              <span>+{metrics.revenueGrowthPercentage}% bulan ini</span>
            </div>
          </div>
        </Card>

        {/* Metric 2: Total Participants */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Traveler
            </span>
            <div className="h-9 w-9 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#191c1e] block">
              {metrics.totalParticipants} Orang
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Tergabung dalam grup trip
            </span>
          </div>
        </Card>

        {/* Metric 3: Active Trips & Average Occupancy */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Okupansi
            </span>
            <div className="h-9 w-9 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#00677d] block">
              {metrics.averageOccupancyRate}%
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {metrics.activeTripsCount} Trip Aktif Berjalan
            </span>
          </div>
        </Card>

        {/* Metric 4: Available Seats */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Kursi Tersedia
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#a43c12] block">
              {metrics.availableSeats} Kursi
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Siap di-booking traveler
            </span>
          </div>
        </Card>
      </div>

      {/* Middle Section: 6-Seater Vehicle Capacity Monitor */}
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
            {activeTrip.groups.length} Grup Armada Terbentuk
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeTrip.groups.map((group) => {
            const isFull = group.currentParticipants >= group.capacity;
            const remaining = group.capacity - group.currentParticipants;
            const driver = group.driver || MOCK_DRIVERS[0];

            return (
              <Card
                key={group.id}
                className="p-6 border border-slate-100 shadow-stitch-card space-y-4 bg-white"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#00677d] uppercase tracking-wider">
                      Grup Mobil {group.groupNumber}
                    </span>
                    <h3 className="font-heading font-bold text-base text-[#191c1e] mt-0.5">
                      {driver.vehicleModel} ({driver.plateNumber})
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

                  {/* Occupancy Progress Bar */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mt-3">
                    <div
                      className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full"
                      style={{
                        width: `${calculateOccupancyPercent(group.currentParticipants, group.capacity)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Driver & Action Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Driver: <strong>{driver.fullName}</strong> (SIM: {driver.licenseNumber})
                  </span>
                  <Link
                    href="/admin/participants"
                    className="text-[#00677d] font-bold hover:underline flex items-center gap-1"
                  >
                    Kelola Peserta <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Recent Bookings Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#191c1e]">
              Pemesanan & Peserta Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Roster peserta yang baru mendaftar melalui web atau offline booking.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
            <Link href="/admin/participants">
              Lihat Semua Peserta <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden border border-slate-100 shadow-stitch-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Kode Booking</th>
                  <th className="px-5 py-3.5">Nama Traveler</th>
                  <th className="px-5 py-3.5">No. WhatsApp</th>
                  <th className="px-5 py-3.5">Grup Armada</th>
                  <th className="px-5 py-3.5">Total Bayar</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {recentBookings.map((b) => {
                  const statusBadge = getPaymentBadge(b.paymentStatus);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-[#00677d]">
                        {b.bookingCode}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#191c1e]">
                        {b.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{b.phoneNumber}</td>
                      <td className="px-5 py-3.5">
                        <Badge variant="azure" className="text-[10px]">
                          Grup {b.bookingGroupId === "grp-01" ? "1" : "2"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 font-heading font-bold text-[#191c1e]">
                        {formatCurrency(b.totalAmount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {formatDate(b.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

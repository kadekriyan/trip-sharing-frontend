"use client";

import React from "react";
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
import {
  formatCurrency,
  formatDate,
  calculateOccupancyPercent,
  getPaymentBadge,
} from "@/src/lib/utils";

export default function AdminOverviewPage() {
  const metrics = MOCK_ADMIN_METRICS;
  const recentBookings = MOCK_PARTICIPANTS.slice(0, 5);
  const activeTrip = MOCK_TRIPS[0];

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

        {/* Metric 3: Active Trips */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Trip Aktif
            </span>
            <div className="h-9 w-9 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-[#191c1e] block">
              {metrics.activeTripsCount} Jadwal
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Bromo, Komodo, & Bali
            </span>
          </div>
        </Card>

        {/* Metric 4: Average Occupancy Rate */}
        <Card className="p-5 border border-slate-100 shadow-stitch-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rata-rata Okupansi
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Car className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="font-heading font-extrabold text-xl sm:text-2xl text-emerald-700 block">
              {metrics.averageOccupancyRate}%
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Efisiensi kapasitas 6-pax/mobil
            </span>
          </div>
        </Card>
      </div>

      {/* Group Occupancy Real-Time Visualizer */}
      <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
              <Car className="h-5 w-5 text-[#00677d]" />
              Real-time Group Occupancy Monitor (Kapasitas Maks 6 / Mobil)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau keterisian kursi grup trip yang akan berangkat minggu ini.
            </p>
          </div>
          <Badge variant="azure" className="text-xs font-bold">
            Jadwal: {formatDate(activeTrip.departureDate)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeTrip.groups.map((grp) => {
            const percent = calculateOccupancyPercent(grp.currentParticipants, grp.capacity);
            const remaining = grp.capacity - grp.currentParticipants;
            const driver = grp.driver || MOCK_DRIVERS[0];

            return (
              <div
                key={grp.id}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-slate-800">
                      Grup {grp.groupNumber} - {driver.vehicleModel}
                    </span>
                    <Badge
                      variant={grp.currentParticipants >= 6 ? "warning" : "success"}
                      className="text-[10px]"
                    >
                      {grp.currentParticipants >= 6 ? "Penuh" : "Open Slot"}
                    </Badge>
                  </div>
                  <span className="font-bold text-xs text-[#00677d]">
                    {grp.currentParticipants}/{grp.capacity} Kursi
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Plat: <strong>{driver.plateNumber}</strong> ({driver.fullName})</span>
                  <span>Sisa: <strong>{remaining} Kursi Kosong</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="rounded-2xl bg-white p-6 shadow-stitch-card border border-slate-100 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="font-heading font-bold text-base text-[#191c1e]">
              Daftar Pemesanan Terbaru (Recent Bookings)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Data peserta yang baru mendaftar ke platform.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-1 text-xs">
            <Link href="/admin/participants">
              Kelola Semua Peserta
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Kode Booking</th>
                <th className="px-4 py-3">Nama Traveler</th>
                <th className="px-4 py-3">No. WhatsApp</th>
                <th className="px-4 py-3">Grup Assign</th>
                <th className="px-4 py-3">Total Biaya</th>
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBookings.map((p) => {
                const statusBadge = getPaymentBadge(p.paymentStatus);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-[#00677d]">
                      {p.bookingCode}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {p.fullName}
                      <span className="block text-[11px] font-normal text-slate-400">
                        {p.nationality}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{p.phoneNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700">
                      Grup {p.bookingGroupId === "grp-01" ? "1" : "2"} (Toyota HiAce)
                    </td>
                    <td className="px-4 py-3.5 font-bold text-[#a43c12]">
                      {formatCurrency(p.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-8 text-xs text-[#00677d]">
                        <Link href="/admin/participants">
                          Detail / Pindah
                          <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

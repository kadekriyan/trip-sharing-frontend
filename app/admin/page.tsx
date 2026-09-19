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
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import {
  formatCurrency,
  formatDate,
  getDestinationTitle,
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
        const [met, allParts, allGroups] = await Promise.all([
          adminService.getMetrics(),
          adminService.getParticipants(),
          adminService.getGroups(),
        ]);
        if (isMounted) {
          // Sinkronisasi metrik dari data riil partisipan & grup aktif
          const paidParticipants = allParts.filter((p) => p.paymentStatus === "paid");
          const calculatedRevenue = paidParticipants.reduce(
            (sum, p) => sum + (Number(p.totalAmount) || 0),
            0
          );
          const totalParticipantsCount = allParts.length;
          const pendingCount = allParts.filter(
            (p) => p.paymentStatus === "pending" || !p.paymentStatus
          ).length;

          const totalCapacity = allGroups.reduce(
            (acc, g) => acc + (Number(g.maxParticipants) || 6),
            0
          );
          const totalCurrentOccupancy = allGroups.reduce(
            (acc, g) =>
              acc +
              (Number(g.currentParticipants) ||
                (Array.isArray(g.participants) ? g.participants.length : 0)),
            0
          );
          const calcOccupancyRate =
            totalCapacity > 0
              ? Math.min(100, Math.round((totalCurrentOccupancy / totalCapacity) * 100))
              : met.averageOccupancyRate || 0;

          const totalAvailableSeats = allGroups.reduce((acc, g) => {
            const cap = Number(g.maxParticipants) || 6;
            const cur =
              Number(g.currentParticipants) ||
              (Array.isArray(g.participants) ? g.participants.length : 0);
            return acc + Math.max(0, cap - cur);
          }, 0);

          const activeTrips = new Set(
            allGroups.map((g) => g.tripId || g.trip?.id).filter(Boolean)
          ).size;

          const synchronizedMetrics: AdminMetrics = {
            ...met,
            totalRevenue:
              calculatedRevenue > 0 ? calculatedRevenue : met.totalRevenue || 0,
            totalParticipants:
              totalParticipantsCount > 0
                ? totalParticipantsCount
                : met.totalParticipants || 0,
            totalBookings:
              totalParticipantsCount > 0
                ? totalParticipantsCount
                : met.totalBookings || 0,
            pendingPaymentsCount:
              pendingCount > 0 ? pendingCount : met.pendingPaymentsCount || 0,
            averageOccupancyRate:
              allGroups.length > 0 ? calcOccupancyRate : met.averageOccupancyRate || 0,
            availableSeats:
              allGroups.length > 0 ? totalAvailableSeats : met.availableSeats || 0,
            activeTripsCount:
              activeTrips > 0 ? activeTrips : met.activeTripsCount || 0,
          };

          setMetrics(synchronizedMetrics);
          setRecentBookings(allParts.slice(0, 5));
          setGroups(allGroups);
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

      {/* 2. FLEET OCCUPANCY LIVE MONITOR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <Car className="h-5 w-5 text-[#00677d]" />
              Pantauan Okupansi Armada (Live Group Capacity)
            </h2>
            <p className="text-xs text-slate-500">
              Sistem membatasi kuota peserta per mobil/grup. Grup baru otomatis dibuat jika kapasitas penuh.
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
              const capacity = Number(group.capacity || group.maxParticipants || 6);
              const currentPax = Number(group.currentParticipants || group.participants?.length || 0);
              const isFull = currentPax >= capacity;
              const remaining = Math.max(0, capacity - currentPax);
              const groupNum = group.groupNumber || 1;
              const departureDate = group.trip?.departureDate || group.trip?.departure_date;
              const destTitle = group.trip?.destination ? getDestinationTitle(group.trip.destination) : null;

              // Normalisasi entitas armada & driver
              const vehicle = group.vehicle || group.driver?.vehicle;
              const driver = group.driver;
              const driverName = driver?.fullName || driver?.name || driver?.user?.name;
              const vehicleName = vehicle?.name || driver?.vehicleModel;
              const plateNumber = vehicle?.plateNumber || vehicle?.plate_number || driver?.plateNumber;

              let fleetTitle = "Armada Belum Dipasangkan";
              if (vehicleName && plateNumber) {
                fleetTitle = `${vehicleName} (${plateNumber})`;
              } else if (vehicleName) {
                fleetTitle = vehicleName;
              } else if (plateNumber) {
                fleetTitle = `Armada (${plateNumber})`;
              }

              return (
                <Card
                  key={group.id}
                  className="p-6 border border-slate-100 shadow-stitch-card space-y-4 bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#00677d] uppercase tracking-wider">
                          Grup Mobil #{groupNum}
                        </span>
                        {departureDate ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Calendar className="h-3 w-3 text-[#00677d]" />
                            {formatDate(departureDate)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md italic">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            Jadwal Belum Ditentukan
                          </span>
                        )}
                      </div>

                      {/* Fleet / Vehicle Info */}
                      <h3 className="font-heading font-bold text-base text-[#191c1e] mt-1">
                        {fleetTitle}
                      </h3>

                      {/* Driver Info */}
                      <div className="flex items-center gap-2 text-xs">
                        {driverName ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-[#00677d]">
                            <UserCheck className="h-3.5 w-3.5 text-[#00677d]" />
                            Driver: <span className="font-semibold text-slate-800">{driverName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium text-[11px]">
                            <UserX className="h-3.5 w-3.5 text-amber-600" />
                            Driver: Belum Ditugaskan
                          </span>
                        )}
                      </div>

                      {/* Destination Info */}
                      {destTitle && destTitle !== "Paket Wisata" && (
                        <p className="text-xs text-slate-500 font-medium pt-0.5">
                          Tujuan: <span className="text-slate-700 font-semibold">{destTitle}</span>
                        </p>
                      )}
                    </div>
                    <Badge variant={isFull ? "destructive" : "azure"} className="font-bold shrink-0">
                      {isFull ? `Grup Penuh (${capacity}/${capacity})` : `${remaining} Kursi Tersedia`}
                    </Badge>
                  </div>

                  {/* Visual Seat Grid */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-500 font-semibold">
                      <span>Visual Kursi (Maks {capacity} Orang):</span>
                      <span>{currentPax} / {capacity} Terisi</span>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: capacity }).map((_, i) => {
                        const isOccupied = i < currentPax;
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
                        width: `${calculateOccupancyPercent(currentPax, capacity)}%`,
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

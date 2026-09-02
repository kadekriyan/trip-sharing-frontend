"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Users,
  MapPin,
  Car,
  Sparkles,
  Phone,
  Ticket,
  Search,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
} from "@/src/components/ui/dialog";
import { MOCK_PARTICIPANTS, MOCK_DESTINATIONS, MOCK_DRIVERS } from "@/src/services/mockData";
import { bookingService } from "@/src/services/booking.service";
import { formatCurrency, formatDate, getPaymentBadge } from "@/src/lib/utils";
import type { Participant } from "@/src/types";

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "pending">("all");
  const [bookings, setBookings] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Participant | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadBookings() {
      setIsLoading(true);
      try {
        const data = await bookingService.getMyBookings();
        if (isMounted && data.length > 0) {
          setBookings(data);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadBookings();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await bookingService.getMyBookings({
        bookingCode: searchQuery.includes("TRV") ? searchQuery : undefined,
        email: searchQuery.includes("@") ? searchQuery : undefined,
      });
      setBookings(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter((item) => {
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "paid" && item.paymentStatus === "paid") ||
      (activeTab === "pending" && item.paymentStatus === "pending");

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      item.bookingCode.toLowerCase().includes(q) ||
      item.fullName.toLowerCase().includes(q) ||
      item.email.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Badge variant="azure" className="mb-1.5 font-bold">
              Traveler Dashboard
            </Badge>
            <h1 className="font-heading text-3xl font-extrabold text-[#191c1e]">
              Riwayat Booking Saya
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Kelola perjalanan aktif, status grup armada, dan e-voucher wisata Anda.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/destinations">
              <Sparkles className="h-4 w-4" />
              Pesan Trip Baru
            </Link>
          </Button>
        </div>

        {/* Guest / Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari email / kode booking (misal TRV-8921)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: BOOKINGS LIST */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua Booking ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab("paid")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "paid"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Trip Lunas ({bookings.filter((p) => p.paymentStatus === "paid").length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "pending"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Menunggu Pembayaran ({bookings.filter((p) => p.paymentStatus === "pending").length})
              </button>
            </div>

            {/* Loading & Empty State */}
            {isLoading && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Memuat riwayat pemesanan...
              </div>
            )}

            {!isLoading && filteredBookings.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8">
                <Ticket className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-heading font-bold text-base text-slate-700">Belum Ada Riwayat Pemesanan</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Belum ada tiket yang cocok dengan filter atau pencarian Anda.
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link href="/destinations">Jelajahi Destinasi</Link>
                </Button>
              </div>
            )}

            {/* Bookings Card List */}
            <div className="space-y-6">
              {filteredBookings.map((booking) => {
                const dest = MOCK_DESTINATIONS[0];
                const driver = MOCK_DRIVERS[0];
                const statusBadge = getPaymentBadge(booking.paymentStatus);

                return (
                  <Card
                    key={booking.id}
                    className="overflow-hidden border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12">
                      {/* Image Preview */}
                      <div className="relative md:col-span-4 h-48 md:h-auto min-h-[180px]">
                        <Image
                          src={dest.coverImage}
                          alt={dest.title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-sm ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                      </div>

                      {/* Details Content */}
                      <div className="md:col-span-8 p-6 flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[11px] font-mono font-bold text-slate-400 block">
                                Kode: {booking.bookingCode}
                              </span>
                              <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                                {dest.title}
                              </h3>
                            </div>
                            <span className="font-heading font-extrabold text-[#a43c12] text-base">
                              {formatCurrency(booking.totalAmount)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#00677d]" />
                              <span>{formatDate(booking.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-[#00677d]" />
                              <span>Grup 1 (5/6 Terisi)</span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                              <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                              <span className="truncate">{dest.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Driver & Armada Info Bar */}
                        <div className="rounded-xl bg-slate-50 p-3 flex flex-wrap items-center justify-between gap-3 text-xs border border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <Car className="h-4 w-4 text-[#00677d]" />
                            <div>
                              <span className="font-bold text-slate-700 block">
                                {driver.vehicleModel} ({driver.plateNumber})
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Driver: {driver.fullName}
                              </span>
                            </div>
                          </div>
                          <a
                            href={`https://wa.me/${driver.phoneNumber.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Phone className="h-3 w-3" />
                            WhatsApp Driver
                          </a>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                          <div className="text-xs text-slate-500">
                            <span>Traveler: <strong>{booking.fullName}</strong></span>
                            {booking.hasInsurance && (
                              <span className="text-emerald-600 font-semibold ml-2">
                                • Termasuk Asuransi
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {booking.paymentStatus === "pending" ? (
                              <Button asChild size="sm" className="bg-[#ff7f50] text-white">
                                <Link href={`/destinations/${dest.slug}`}>
                                  Bayar Sekarang ({formatCurrency(booking.totalAmount)})
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedVoucher(booking)}
                                className="gap-1.5"
                              >
                                <Ticket className="h-3.5 w-3.5 text-[#00677d]" />
                                Lihat E-Voucher
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* RIGHT: TRAVELER PROFILE & STATS SIDEBAR */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 border border-slate-100 shadow-stitch-card text-center space-y-4">
              <div className="relative h-20 w-20 mx-auto rounded-full overflow-hidden border-4 border-[#00677d]/20 shadow-md">
                <Image
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80"
                  alt="User Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                  Siti Rahmawati
                </h3>
                <p className="text-xs text-slate-500">siti.rahma@example.com</p>
                <Badge variant="azure" className="mt-2 text-[10px]">
                  Verified Solo Traveler
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#00677d] block">
                    {bookings.filter((b) => b.paymentStatus === "paid").length}
                  </span>
                  <span className="text-[10px] text-slate-500">Trip Selesai</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#ff7f50] block">
                    ⭐ 5.0
                  </span>
                  <span className="text-[10px] text-slate-500">Traveler Rating</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* DIGITAL E-VOUCHER DIALOG */}
      <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          {selectedVoucher && (
            <div>
              <div className="bg-[#00677d] p-6 text-white text-center space-y-1">
                <Badge variant="secondary" className="text-[10px] font-bold uppercase mb-2">
                  Official E-Voucher
                </Badge>
                <h3 className="font-heading font-extrabold text-xl">
                  Trip Sharing Platform
                </h3>
                <p className="text-xs text-slate-100">
                  Tunjukkan kode QR ini kepada Driver saat penjemputan.
                </p>
              </div>

              <div className="p-6 space-y-6 text-center">
                {/* QR Code */}
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block">
                  <div className="relative h-40 w-40 mx-auto bg-white p-2 rounded-xl shadow-sm">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedVoucher.bookingCode}`}
                      alt="Booking QR Code"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="font-mono font-bold text-sm text-[#00677d] mt-2 block tracking-widest">
                    {selectedVoucher.bookingCode}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-left bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Traveler:</span>
                    <strong className="text-slate-800">{selectedVoucher.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <strong className="text-emerald-700 font-bold">Lunas (Paid)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferensi Kamar:</span>
                    <span className="text-slate-800 capitalize">{selectedVoucher.roomPreference}</span>
                  </div>
                </div>

                <Button onClick={() => setSelectedVoucher(null)} className="w-full">
                  Tutup E-Voucher
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

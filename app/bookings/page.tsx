"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Users,
  MapPin,
  Car,
  CheckCircle2,
  Sparkles,
  Phone,
  Ticket,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { MOCK_PARTICIPANTS, MOCK_DESTINATIONS, MOCK_DRIVERS } from "@/src/services/mockData";
import { formatCurrency, formatDate, getPaymentBadge } from "@/src/lib/utils";

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "pending">("all");
  const [selectedVoucher, setSelectedVoucher] = useState<(typeof MOCK_PARTICIPANTS)[0] | null>(null);

  const filteredBookings = MOCK_PARTICIPANTS.filter((item) => {
    if (activeTab === "paid") return item.paymentStatus === "paid";
    if (activeTab === "pending") return item.paymentStatus === "pending";
    return true;
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
                Semua Booking ({MOCK_PARTICIPANTS.length})
              </button>
              <button
                onClick={() => setActiveTab("paid")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "paid"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Trip Lunas ({MOCK_PARTICIPANTS.filter((p) => p.paymentStatus === "paid").length})
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === "pending"
                    ? "bg-[#00677d] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Menunggu Pembayaran ({MOCK_PARTICIPANTS.filter((p) => p.paymentStatus === "pending").length})
              </button>
            </div>

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
                              <span>Grup 1 (4/6 Terisi)</span>
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
                  Rizky Ramadhan
                </h3>
                <p className="text-xs text-slate-500">rizky.ramadhan@example.com</p>
                <Badge variant="azure" className="mt-2 text-[10px]">
                  Verified Solo Traveler
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#00677d] block">
                    4
                  </span>
                  <span className="text-[11px] text-slate-500">Trip Diikuti</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="font-heading font-extrabold text-lg text-[#ff7f50] block">
                    Rp 3.8M
                  </span>
                  <span className="text-[11px] text-slate-500">Biaya Dihemat</span>
                </div>
              </div>
            </Card>

            {/* Safety & Cost Sharing Guarantee */}
            <Card className="p-6 bg-gradient-to-br from-[#00677d]/10 to-[#00a3c4]/10 border border-[#00677d]/20 space-y-3">
              <h4 className="font-heading font-bold text-sm text-[#00677d] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Jaminan Berbagi Biaya Adil
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap pemesanan kursi dijamin transparan tanpa mark-up sewa kendaraan. Driver profesional dan armada ber-AC selalu siap mengantar petualangan Anda.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* E-VOUCHER MODAL */}
      {selectedVoucher && (
        <Dialog open={!!selectedVoucher} onOpenChange={() => setSelectedVoucher(null)}>
          <DialogContent className="max-w-md p-6 bg-white space-y-4">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00677d] uppercase">
                  Official E-Voucher
                </span>
                <Badge variant="success">LUNAS / CONFIRMED</Badge>
              </div>
              <DialogTitle className="text-lg font-bold text-[#191c1e] mt-1">
                E-Voucher Keberangkatan
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Tunjukkan voucher ini kepada driver saat penjemputan di meeting point.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Booking:</span>
                  <span className="font-mono font-bold text-[#00677d]">
                    {selectedVoucher.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Traveler:</span>
                  <span className="font-bold text-slate-800">{selectedVoucher.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grup Mobil:</span>
                  <span className="font-bold text-slate-800">Toyota HiAce - Grup 1 (Maks 6 Pax)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Pembayaran:</span>
                  <span className="font-bold text-[#a43c12]">
                    {formatCurrency(selectedVoucher.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl text-[11px] text-[#00677d] space-y-1">
                <span className="font-bold block">Meeting Point & Jam:</span>
                <span>Stasiun Malang Kota Baru / Bandara Juanda Surabaya (Pukul 23:00 WIB)</span>
              </div>
            </div>

            <Button
              onClick={() => setSelectedVoucher(null)}
              className="w-full justify-center text-xs"
            >
              Tutup E-Voucher
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

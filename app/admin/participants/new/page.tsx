"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { CountryCombobox } from "@/src/components/ui/country-combobox";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, getDestinationTitle, getDestinationPrice, sanitizePhoneNumber } from "@/src/lib/utils";
import type { Destination, BookingGroup, Trip } from "@/src/types";

export default function AddParticipantPage() {
  const router = useRouter();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [availableGroups, setAvailableGroups] = useState<BookingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string>("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [healthNotes, setHealthNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Load initial destinations and trips from server
  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [dests, trips] = await Promise.all([
          adminService.getDestinations(),
          adminService.getTrips(),
        ]);
        if (isMounted) {
          setDestinations(dests);
          setAllTrips(trips);
          if (dests.length > 0) {
            setSelectedDestination(dests[0].id);
          }
        }
      } catch {
        // Handled
      }
    }

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch real groups whenever destination changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedDestination) return;

    const dest = destinations.find((d) => d.id === selectedDestination);
    const rawDest = dest as unknown as Record<string, unknown> | undefined;
    const destTrips = (rawDest?.trips || rawDest?.activeTrips) as Array<Record<string, unknown>> | undefined;

    const matchingTrip = allTrips.find((t) => t.destinationId === selectedDestination);
    const resolvedTripId =
      matchingTrip?.id ||
      (destTrips?.[0]?.id as string) ||
      (rawDest?.tripId as string) ||
      selectedDestination;

    async function fetchRealGroups() {
      setIsLoadingGroups(true);
      setActiveTripId(resolvedTripId);
      try {
        // 1. Try to get availability by tripId
        let groups = await adminService.getTripAvailability(resolvedTripId);

        // 2. If empty and matchingTrip has groups, use those
        if (groups.length === 0 && matchingTrip && Array.isArray(matchingTrip.groups) && matchingTrip.groups.length > 0) {
          groups = matchingTrip.groups;
        }

        // 3. If still empty, check destTrips for groups
        if (groups.length === 0 && destTrips?.[0]?.groups && Array.isArray(destTrips[0].groups)) {
          groups = destTrips[0].groups as unknown as BookingGroup[];
        }

        if (isMounted) {
          setAvailableGroups(groups);
          if (groups.length > 0) {
            setSelectedGroup(groups[0].id);
          } else {
            setSelectedGroup("");
          }
        }
      } catch {
        if (isMounted) {
          setAvailableGroups([]);
          setSelectedGroup("");
        }
      } finally {
        if (isMounted) setIsLoadingGroups(false);
      }
    }

    fetchRealGroups();
    return () => {
      isMounted = false;
    };
  }, [selectedDestination, destinations, allTrips]);

  const destination = destinations.find((d) => d.id === selectedDestination) || destinations[0];
  const price = destination ? getDestinationPrice(destination) : 850000;
  const totalAmount = price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phoneNumber) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    if (!selectedGroup) {
      setFeedback({
        type: "error",
        message: "Destinasi ini belum memiliki armada/grup mobil yang aktif di database. Harap buat jadwal trip terlebih dahulu di backend atau menu Jadwal Trip.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await adminService.addParticipantManual({
        fullName,
        email,
        phoneNumber: sanitizePhoneNumber(phoneNumber),
        nationality,
        gender,
        tripId: activeTripId || selectedDestination,
        destinationId: selectedDestination,
        bookingGroupId: selectedGroup,
        groupId: selectedGroup,
        amountPaid: totalAmount,
        totalAmount,
        paymentStatus,
        paymentMethod: paymentStatus === "paid" ? "cash_onsite" : "manual_transfer",
        notes: healthNotes || undefined,
      });

      setFeedback({
        type: "success",
        message: res.message || `Peserta ${fullName} berhasil didaftarkan secara manual ke armada!`,
      });

      setTimeout(() => {
        router.push("/admin/participants");
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan peserta manual.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/participants"
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Peserta
        </Link>
      </div>

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
          Pendaftaran Peserta Manual (Offline / Walk-In)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Formulir ini digunakan admin untuk memasukkan peserta secara langsung ke armada trip sharing yang terdaftar.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Data Diri */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <h2 className="font-heading font-bold text-base text-[#191c1e] border-b border-slate-100 pb-3">
            1. Informasi Identitas Traveler
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama Lengkap (Sesuai KTP/Paspor) *
              </label>
              <Input
                required
                placeholder="Contoh: Rian Pratama"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Alamat Email *
              </label>
              <Input
                required
                type="email"
                placeholder="rian@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor WhatsApp *
              </label>
              <Input
                required
                placeholder="+62 812-3456-7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Kewarganegaraan *
              </label>
              <CountryCombobox
                value={nationality}
                onChange={setNationality}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Jenis Kelamin *
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "male" | "female")}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="male">Laki-laki (Male)</option>
                <option value="female">Perempuan (Female)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 2: Penempatan Trip & Armada */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <h2 className="font-heading font-bold text-base text-[#191c1e] border-b border-slate-100 pb-3">
            2. Penempatan Destinasi & Grup Mobil (Maks 6 Pax)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pilih Destinasi Wisata *
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {getDestinationTitle(d)} — {formatCurrency(getDestinationPrice(d))} / pax
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pilih Armada / Grup Mobil Aktif di Database *
              </label>
              {isLoadingGroups ? (
                <div className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-xs text-slate-400 gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00677d]" />
                  <span>Memeriksa ketersediaan armada di database backend...</span>
                </div>
              ) : availableGroups.length > 0 ? (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="h-10 w-full rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 text-xs font-bold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  {availableGroups.map((g, idx) => (
                    <option key={g.id} value={g.id}>
                      🚗 Grup Mobil #{g.groupNumber || idx + 1} — Terisi ({g.currentParticipants || 0}/{g.capacity || 6} Kursi) [ID: {g.id.slice(0, 8)}...]
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Tidak Ditemukan Grup Aktif untuk Destinasi Ini</span>
                    <span className="text-[11px] text-amber-700 leading-normal block mt-0.5">
                      Destinasi ini belum memiliki jadwal trip operasional di database backend. Pastikan data jadwal trip dan grup mobil sudah dibuat atau di-seed di backend.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Status Pembayaran Awal
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending")}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="paid">Lunas (Paid / Cash)</option>
                <option value="pending">Menunggu Pembayaran (Pending)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Catatan Khusus / Kesehatan (Opsional)
            </label>
            <Input
              placeholder="Contoh: Alergi makanan laut, butuh kursi depan karena mabuk darat"
              value={healthNotes}
              onChange={(e) => setHealthNotes(e.target.value)}
              className="text-xs"
            />
          </div>
        </Card>

        {/* Section 3: Ringkasan Biaya */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-slate-50 space-y-3">
          <h2 className="font-heading font-bold text-sm text-[#191c1e]">
            Ringkasan Biaya Pendaftaran Manual
          </h2>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Paket Trip:</span>
              <span className="font-semibold">{formatCurrency(price)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#191c1e] pt-2 border-t border-slate-200">
              <span>Total Tagihan:</span>
              <span className="text-[#a43c12]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/admin/participants">Batal</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || availableGroups.length === 0}
            className="rounded-xl gap-2 font-bold px-8 shadow-md"
          >
            <UserPlus className="h-4 w-4" />
            {isSubmitting ? "Mendaftarkan..." : "Daftarkan Peserta"}
          </Button>
        </div>
      </form>
    </div>
  );
}

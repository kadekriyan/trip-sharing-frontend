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
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import { destinationService } from "@/src/services/destination.service";
import { formatCurrency, getDestinationTitle, getDestinationPrice } from "@/src/lib/utils";
import type { Destination, BookingGroup } from "@/src/types";

export default function AddParticipantPage() {
  const router = useRouter();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [availableGroups, setAvailableGroups] = useState<BookingGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [roomPref, setRoomPref] = useState<"shared" | "single" | "none">("shared");
  const [hasInsurance, setHasInsurance] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [healthNotes, setHealthNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadInitialDestinations() {
      try {
        const dests = await adminService.getDestinations();
        if (isMounted) {
          setDestinations(dests);
          if (dests.length > 0) {
            setSelectedDestination(dests[0].id);
          }
        }
      } catch {
        // Silently handled
      }
    }

    loadInitialDestinations();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch groups when selectedDestination changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedDestination) return;

    const dest = destinations.find((d) => d.id === selectedDestination);
    const rawDest = dest as unknown as Record<string, unknown> | undefined;
    const trips = (rawDest?.trips || rawDest?.activeTrips) as Array<Record<string, unknown>> | undefined;
    const tripId = (trips?.[0]?.id as string) || selectedDestination;

    async function fetchGroups() {
      setIsLoadingGroups(true);
      try {
        const groups = await destinationService.getTripAvailability(tripId);
        if (isMounted) {
          setAvailableGroups(groups);
          if (groups.length > 0) {
            setSelectedGroup(groups[0].id);
          } else {
            setSelectedGroup((trips?.[0]?.bookingGroupId as string) || "f128c9a0-4412-4eb2-a102-bcde91230001");
          }
        }
      } catch {
        if (isMounted) {
          setAvailableGroups([]);
          setSelectedGroup("f128c9a0-4412-4eb2-a102-bcde91230001");
        }
      } finally {
        if (isMounted) setIsLoadingGroups(false);
      }
    }

    fetchGroups();
    return () => {
      isMounted = false;
    };
  }, [selectedDestination, destinations]);

  const destination = destinations.find((d) => d.id === selectedDestination) || destinations[0];
  const price = destination ? getDestinationPrice(destination) : 850000;
  const insuranceFee = hasInsurance ? 50000 : 0;
  const privateRoomFee = roomPref === "single" ? 350000 : 0;
  const totalAmount = price + insuranceFee + privateRoomFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phoneNumber || !identityNumber) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    const rawDest = destination as unknown as Record<string, unknown> | undefined;
    const trips = (rawDest?.trips || rawDest?.activeTrips) as Array<Record<string, unknown>> | undefined;
    const tripId = (trips?.[0]?.id as string) || selectedDestination;
    const targetGroupId = selectedGroup || "f128c9a0-4412-4eb2-a102-bcde91230001";

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await adminService.addParticipantManual({
        fullName,
        email,
        phoneNumber,
        identityNumber,
        nationality,
        gender,
        tripId,
        destinationId: selectedDestination,
        bookingGroupId: targetGroupId,
        groupId: targetGroupId,
        roomPreference: roomPref,
        hasInsurance,
        insuranceFee,
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
          Formulir ini digunakan admin untuk memasukkan peserta secara langsung tanpa melewati payment gateway online.
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
                Nomor KTP / Paspor *
              </label>
              <Input
                required
                placeholder="3507xxxxxxxxxxxx"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Kewarganegaraan *
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="Other">Lainnya</option>
              </select>
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tempatkan ke Grup Mobil *
              </label>
              {isLoadingGroups ? (
                <div className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 flex items-center text-xs text-slate-400 gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Memuat grup armada...</span>
                </div>
              ) : (
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  {availableGroups.length > 0 ? (
                    availableGroups.map((g, idx) => (
                      <option key={g.id} value={g.id}>
                        Grup Mobil #{g.groupNumber || idx + 1} ({g.currentParticipants || 0}/{g.capacity || 6} Kursi)
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="f128c9a0-4412-4eb2-a102-bcde91230001">Grup Mobil #1 (Standar)</option>
                      <option value="f128c9a0-4412-4eb2-a102-bcde91230002">Grup Mobil #2</option>
                      <option value="f128c9a0-4412-4eb2-a102-bcde91230003">Grup Mobil #3 (Baru)</option>
                    </>
                  )}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Preferensi Kamar
              </label>
              <select
                value={roomPref}
                onChange={(e) => setRoomPref(e.target.value as "shared" | "single" | "none")}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="shared">Sharing Room (Standar)</option>
                <option value="single">Private Room (+350rb)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="insurance"
                checked={hasInsurance}
                onChange={(e) => setHasInsurance(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#00677d] focus:ring-[#00677d]"
              />
              <label htmlFor="insurance" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Termasuk Asuransi Perjalanan (+Rp 50.000)
              </label>
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
            {hasInsurance && (
              <div className="flex justify-between text-slate-600">
                <span>Asuransi:</span>
                <span className="font-semibold">{formatCurrency(insuranceFee)}</span>
              </div>
            )}
            {roomPref === "single" && (
              <div className="flex justify-between text-slate-600">
                <span>Upgrade Private Room:</span>
                <span className="font-semibold">{formatCurrency(privateRoomFee)}</span>
              </div>
            )}
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
            disabled={isSubmitting}
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

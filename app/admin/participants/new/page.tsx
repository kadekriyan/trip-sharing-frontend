"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function AddParticipantPage() {
  const router = useRouter();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("grp-01");
  const [roomPref, setRoomPref] = useState<"shared" | "single" | "none">("shared");
  const [hasInsurance, setHasInsurance] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [healthNotes, setHealthNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    adminService.getDestinations().then((dests) => {
      if (isMounted) {
        setDestinations(dests);
        if (dests.length > 0) setSelectedDestination(dests[0].id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const destination = destinations.find((d) => d.id === selectedDestination) || destinations[0];
  const price = destination ? destination.pricePerPax : 850000;
  const insuranceFee = hasInsurance ? 50000 : 0;
  const privateRoomFee = roomPref === "single" ? 350000 : 0;
  const totalAmount = price + insuranceFee + privateRoomFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phoneNumber || !identityNumber) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.addParticipantManual({
        fullName,
        email,
        phoneNumber,
        identityNumber,
        nationality,
        tripId: selectedDestination || "trip-01",
        destinationId: selectedDestination || "dest-01",
        groupId: selectedGroup,
        roomPreference: roomPref,
        amountPaid: totalAmount,
        paymentMethod: paymentStatus === "paid" ? "cash_onsite" : "manual_transfer",
        notes: healthNotes || undefined,
      });

      setFeedback({
        type: "success",
        message: `Peserta ${fullName} berhasil didaftarkan secara manual ke Grup #${selectedGroup}!`,
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
                className="text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Email Aktif *
              </label>
              <Input
                required
                type="email"
                placeholder="rian@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                No. WhatsApp *
              </label>
              <Input
                required
                placeholder="081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor Identitas (NIK / Paspor) *
              </label>
              <Input
                required
                placeholder="3509123456780001"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                className="text-xs bg-slate-50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Kewarganegaraan
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
                    {d.title} — {formatCurrency(d.pricePerPax)} / pax
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tempatkan ke Grup Mobil *
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="grp-01">Grup Mobil #1</option>
                <option value="grp-02">Grup Mobil #2</option>
                <option value="grp-03">Grup Mobil #3 (Baru)</option>
              </select>
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

            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={hasInsurance}
                  onChange={(e) => setHasInsurance(e.target.checked)}
                  className="accent-[#00677d] h-4 w-4 rounded"
                />
                <span>Sertakan Asuransi Perjalanan (+Rp 50.000)</span>
              </label>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Catatan Khusus / Kesehatan (Opsional)
              </label>
              <Input
                placeholder="Misal: Alergi makanan laut, riwayat asma..."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                className="text-xs bg-slate-50"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Ringkasan Total & Submit */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <div className="flex items-center justify-between text-sm font-bold text-slate-700">
            <span>Total Tagihan Peserta:</span>
            <span className="font-heading font-extrabold text-xl text-[#a43c12]">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full justify-center font-bold text-sm shadow-md"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Menyimpan Data..." : "Daftarkan Peserta ke Roster"}
          </Button>
        </Card>
      </form>
    </div>
  );
}

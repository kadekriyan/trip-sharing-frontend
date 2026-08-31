"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { MOCK_DESTINATIONS } from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency } from "@/src/lib/utils";

export default function AddParticipantPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [selectedDestination, setSelectedDestination] = useState(MOCK_DESTINATIONS[0].id);
  const [selectedGroup, setSelectedGroup] = useState("grp-01");
  const [roomPref, setRoomPref] = useState<"shared" | "private">("shared");
  const [hasInsurance, setHasInsurance] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [healthNotes, setHealthNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const destination = MOCK_DESTINATIONS.find((d) => d.id === selectedDestination) || MOCK_DESTINATIONS[0];
  const insuranceFee = hasInsurance ? 50000 : 0;
  const privateRoomFee = roomPref === "private" ? 350000 : 0;
  const totalAmount = destination.pricePerPax + insuranceFee + privateRoomFee;

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
        gender,
        tripId: "trip-01",
        bookingGroupId: selectedGroup,
        roomPreference: roomPref,
        hasInsurance,
        insuranceFee,
        totalAmount,
        paymentStatus,
        healthNotes,
      });

      setFeedback({ type: "success", message: "Peserta manual berhasil ditambahkan ke grup!" });
      setTimeout(() => {
        router.push("/admin/participants");
      }, 1000);
    } catch {
      setIsSubmitting(false);
      setFeedback({ type: "error", message: "Gagal menambahkan peserta." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/participants"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Peserta
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-[#00677d]" />
            Tambah Peserta Manual (Offline Booking)
          </h1>
        </div>
        <Badge variant="azure">Kapasitas Maksimal: 6 Pax / Mobil</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Data Diri Traveler */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Informasi Pribadi Traveler
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama Lengkap (Sesuai KTP / Paspor) *
              </label>
              <Input
                required
                placeholder="Contoh: Rian Pratama"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nomor WhatsApp *
              </label>
              <Input
                required
                type="tel"
                placeholder="+62 812-3456-7890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                No. KTP / Paspor *
              </label>
              <Input
                required
                placeholder="32710..."
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Kewarganegaraan
              </label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="Indonesia">Indonesia</option>
                <option value="Malaysia">Malaysia</option>
                <option value="Singapore">Singapore</option>
                <option value="Australia">Australia</option>
                <option value="Other">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Jenis Kelamin
              </label>
              <div className="flex gap-4">
                {[
                  { id: "male", label: "Laki-laki" },
                  { id: "female", label: "Perempuan" },
                ].map((g) => (
                  <label key={g.id} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === g.id}
                      onChange={() => setGender(g.id as "male" | "female")}
                      className="accent-[#00677d]"
                    />
                    <span>{g.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Assignment Destinasi & Grup Mobil */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Penetapan Trip & Grup Armada (Maks 6 Orang)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Pilih Paket Destinasi *
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                {MOCK_DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({formatCurrency(d.pricePerPax)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Assign Grup Mobil *
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="grp-01">Grup 1 - Toyota HiAce (4/6 Terisi - Sisa 2 Kursi)</option>
                <option value="grp-02">Grup 2 - Toyota HiAce (2/6 Terisi - Sisa 4 Kursi)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Section 3: Preferensi & Status Pembayaran */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            Preferensi & Status Pembayaran
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Preferensi Kamar
                </label>
                <select
                  value={roomPref}
                  onChange={(e) => setRoomPref(e.target.value as "shared" | "private")}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="shared">Twin Sharing (Standard)</option>
                  <option value="private">Private Deluxe (+ Rp 350.000)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Status Pembayaran *
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending")}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="paid">Lunas (Paid via Cash/Transfer Bank)</option>
                  <option value="pending">Menunggu Pembayaran (Pending)</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={hasInsurance}
                  onChange={(e) => setHasInsurance(e.target.checked)}
                  className="rounded accent-[#ff7f50]"
                />
                <span>Sertakan Asuransi Perjalanan (+ Rp 50.000)</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Catatan Medis / Khusus (Opsional)
              </label>
              <Input
                placeholder="Alergi makanan, pantangan, atau catatan jemput khusus..."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Total Calculation */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600">Total Tagihan Peserta:</span>
            <span className="font-heading font-extrabold text-base text-[#a43c12]">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </Card>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/participants")}
            className="flex-1 justify-center"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 justify-center bg-[#00677d] text-white"
          >
            {isSubmitting ? "Menyimpan Data..." : "Simpan Peserta Manual"}
          </Button>
        </div>
      </form>
    </div>
  );
}

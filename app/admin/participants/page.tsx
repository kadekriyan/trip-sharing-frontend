"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  UserPlus,
  ArrowRightLeft,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { MOCK_PARTICIPANTS, MOCK_TRIPS } from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, getPaymentBadge } from "@/src/lib/utils";
import type { Participant } from "@/src/types";

export default function ParticipantsManagementPage() {
  const [participants, setParticipants] = useState<Participant[]>(MOCK_PARTICIPANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Move Participant Modal State
  const [movingParticipant, setMovingParticipant] = useState<Participant | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>("grp-02");
  const [moveReason, setMoveReason] = useState("");
  const [moveMessage, setMoveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filteredParticipants = participants.filter((p) => {
    if (statusFilter !== "all" && p.paymentStatus !== statusFilter) return false;
    if (
      searchQuery &&
      !p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.bookingCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleExecuteMove = async () => {
    if (!movingParticipant) return;

    // Check capacity of target group
    const targetGroup = MOCK_TRIPS[0].groups.find((g) => g.id === targetGroupId);
    if (targetGroup && targetGroup.currentParticipants >= targetGroup.capacity) {
      setMoveMessage({
        type: "error",
        text: "Grup tujuan sudah penuh (Kapasitas Maksimal 6 Orang). Silakan pilih grup lain.",
      });
      return;
    }

    const res = await adminService.moveParticipant({
      participantId: movingParticipant.id,
      currentGroupId: movingParticipant.bookingGroupId,
      targetGroupId,
      reason: moveReason,
    });

    if (res.success) {
      setParticipants([...MOCK_PARTICIPANTS]);
      setMoveMessage({ type: "success", text: res.message });
      setTimeout(() => {
        setMovingParticipant(null);
        setMoveMessage(null);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Manajemen Peserta & Grup
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola data peserta wisata, pantau kuota armada mobil 6-pax, dan pindahkan peserta antar grup.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/participants/new">
            <UserPlus className="h-4 w-4" />
            + Tambah Peserta Manual
          </Link>
        </Button>
      </div>

      {/* Mini Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Peserta Terdaftar</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {participants.length} Orang
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Pembayaran Lunas</span>
            <span className="font-heading font-extrabold text-xl text-emerald-700 block">
              {participants.filter((p) => p.paymentStatus === "paid").length} Orang
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Kapasitas Maksimal</span>
            <span className="font-heading font-extrabold text-xl text-[#00677d] block">
              6 Pax / Mobil
            </span>
          </div>
        </Card>
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, email, atau kode booking..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#00677d] focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="pending">Menunggu Pembayaran</option>
          </select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="rounded-2xl bg-white shadow-stitch-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Peserta</th>
                <th className="px-5 py-3.5">Kontak & Identitas</th>
                <th className="px-5 py-3.5">Grup Armada</th>
                <th className="px-5 py-3.5">Preferensi</th>
                <th className="px-5 py-3.5">Total Bayar</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParticipants.map((p) => {
                const statusBadge = getPaymentBadge(p.paymentStatus);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#00677d]/10 text-[#00677d] font-bold flex items-center justify-center text-xs">
                          {p.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-sm block">
                            {p.fullName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {p.bookingCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Mail className="h-3 w-3 text-slate-400" />
                        <span>{p.email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{p.phoneNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">KTP: {p.identityNumber}</span>
                    </td>

                    <td className="px-5 py-4">
                      <Badge variant="azure" className="text-[10px] font-bold">
                        {p.bookingGroupId === "grp-01" ? "Grup 1 (HiAce)" : "Grup 2 (HiAce)"}
                      </Badge>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Maks 6 Kursi
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 space-y-0.5">
                      <span>Kamar: <strong>{p.roomPreference === "private" ? "Private" : "Twin"}</strong></span>
                      {p.hasInsurance && (
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          ✓ Asuransi Aktif
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 font-bold text-[#a43c12]">
                      {formatCurrency(p.totalAmount)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMovingParticipant(p);
                          setTargetGroupId(p.bookingGroupId === "grp-01" ? "grp-02" : "grp-01");
                          setMoveMessage(null);
                        }}
                        className="h-8 gap-1.5 text-xs text-[#00677d]"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Pindah Grup
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOVE PARTICIPANT MODAL */}
      {movingParticipant && (
        <Dialog open={!!movingParticipant} onOpenChange={() => setMovingParticipant(null)}>
          <DialogContent className="max-w-md p-6 bg-white space-y-4">
            <DialogHeader className="border-b border-slate-100 pb-3">
              <DialogTitle className="text-lg font-bold text-[#191c1e] flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#00677d]" />
                Pindah Grup Peserta
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Pindahkan traveler ke grup mobil/armada lain jika ada perubahan jadwal atau penyeimbangan kuota.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Peserta:</span>
                <span className="font-bold text-sm text-slate-800 block">
                  {movingParticipant.fullName} ({movingParticipant.bookingCode})
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Grup Saat Ini: <strong>{movingParticipant.bookingGroupId === "grp-01" ? "Grup 1" : "Grup 2"}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Pilih Grup Tujuan (Maks 6 Orang) *
                </label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="grp-01">Grup 1 - Toyota HiAce (4/6 Terisi)</option>
                  <option value="grp-02">Grup 2 - Toyota HiAce (2/6 Terisi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Alasan Pemindahan (Opsional)
                </label>
                <Input
                  placeholder="Contoh: Permintaan traveler / penyesuaian kuota"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                />
              </div>

              {moveMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    moveMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{moveMessage.text}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setMovingParticipant(null)}
                className="flex-1 justify-center text-xs"
              >
                Batal
              </Button>
              <Button
                onClick={handleExecuteMove}
                className="flex-1 justify-center text-xs bg-[#00677d]"
              >
                Simpan & Pindahkan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

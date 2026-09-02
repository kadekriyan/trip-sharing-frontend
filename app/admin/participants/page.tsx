"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
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
import { getPaymentBadge } from "@/src/lib/utils";
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

  const fetchParticipants = useCallback(async () => {
    try {
      const data = await adminService.getParticipants({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      if (data.length > 0) {
        setParticipants(data);
      }
    } catch {
      // Fallback
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    adminService
      .getParticipants({
        status: statusFilter === "all" ? undefined : statusFilter,
      })
      .then((data) => {
        if (isMounted && data.length > 0) {
          setParticipants(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

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

    try {
      const res = await adminService.moveParticipant({
        participantId: movingParticipant.id,
        currentGroupId: movingParticipant.bookingGroupId,
        targetGroupId,
        reason: moveReason || "Pemindahan grup atas persetujuan admin",
      });

      if (res.success) {
        setMoveMessage({ type: "success", text: res.message || "Peserta berhasil dipindahkan ke grup tujuan." });
        await fetchParticipants();
        setTimeout(() => {
          setMovingParticipant(null);
          setMoveMessage(null);
        }, 1000);
      } else {
        setMoveMessage({ type: "error", text: res.message || "Gagal memindahkan peserta." });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memindahkan peserta.";
      setMoveMessage({ type: "error", text: msg });
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
            Tambah Peserta Manual (Offline)
          </Link>
        </Button>
      </div>

      {/* Roster & Filters Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, email, atau kode booking (TRV)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 focus:border-[#00677d] focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="pending">Menunggu (Pending)</option>
            </select>
          </div>
        </div>

        {/* Participants Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Kode</th>
                <th className="px-5 py-3.5">Nama & Kontak</th>
                <th className="px-5 py-3.5">Identitas</th>
                <th className="px-5 py-3.5">Grup Armada</th>
                <th className="px-5 py-3.5">Preferensi</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredParticipants.map((p) => {
                const statusBadge = getPaymentBadge(p.paymentStatus);
                const isGroup1 = p.bookingGroupId === "grp-01" || p.bookingGroupId?.endsWith("01");

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#00677d]">
                      {p.bookingCode}
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <span className="font-bold text-[#191c1e] block text-sm">
                        {p.fullName}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {p.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {p.phoneNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-700 block font-mono text-[11px]">
                        {p.identityNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {p.nationality} • {p.gender}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="azure" className="text-[10px]">
                        {isGroup1 ? "Grup Mobil 1" : "Grup Mobil 2"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 space-y-0.5">
                      <span className="text-slate-700 block capitalize text-[11px]">
                        {p.roomPreference === "single" ? "Private Room" : "Twin Sharing"}
                      </span>
                      {p.hasInsurance ? (
                        <span className="text-emerald-600 text-[10px] font-semibold flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Asuransi Aktif
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tanpa Asuransi</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMovingParticipant(p);
                          setTargetGroupId(isGroup1 ? "grp-02" : "grp-01");
                          setMoveReason("");
                          setMoveMessage(null);
                        }}
                        className="gap-1 text-xs"
                      >
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#00677d]" />
                        Pindah Grup
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MOVE PARTICIPANT MODAL DIALOG */}
      <Dialog open={!!movingParticipant} onOpenChange={() => setMovingParticipant(null)}>
        <DialogContent className="max-w-md p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#00677d]" />
              Pindahkan Peserta ke Grup Lain
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pindahkan traveler antar armada mobil 6-seater jika ada grup yang kelebihan atau permintaan keluarga.
            </DialogDescription>
          </DialogHeader>

          {movingParticipant && (
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Peserta:</span>
                  <strong className="text-slate-800">{movingParticipant.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Booking:</span>
                  <span className="font-mono font-bold text-[#00677d]">{movingParticipant.bookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grup Saat Ini:</span>
                  <Badge variant="azure" className="text-[10px]">
                    {movingParticipant.bookingGroupId === "grp-01" ? "Grup Mobil 1 (4/6)" : "Grup Mobil 2 (2/6)"}
                  </Badge>
                </div>
              </div>

              {/* Target Group Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Pilih Grup Armada Tujuan *
                </label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="grp-01">Grup Mobil 1 (Toyota HiAce Premio - 4/6 Terisi)</option>
                  <option value="grp-02">Grup Mobil 2 (Toyota HiAce VIP - 2/6 Terisi)</option>
                  <option value="grp-03" disabled>Grup Mobil 3 (PENUH - 6/6 Terisi)</option>
                </select>
                <span className="text-[10px] text-slate-400 block">
                  ⚠️ Kapasitas armada dibatasi ketat maksimal 6 orang per kendaraan.
                </span>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Alasan Pemindahan *
                </label>
                <Input
                  placeholder="Contoh: Permintaan traveler agar se-mobil dengan keluarga"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                />
              </div>

              {/* Feedback Alert */}
              {moveMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    moveMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {moveMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{moveMessage.text}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMovingParticipant(null)}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteMove}
                  className="bg-[#00677d] text-white"
                >
                  Konfirmasi Pindah
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

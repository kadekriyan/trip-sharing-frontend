"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  UserPlus,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { adminService } from "@/src/services/admin.service";
import { getPaymentBadge, formatCurrency } from "@/src/lib/utils";
import type { Participant } from "@/src/types";

export default function ParticipantsManagementPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Move Participant Modal State
  const [movingParticipant, setMovingParticipant] = useState<Participant | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string>("grp-02");
  const [moveReason, setMoveReason] = useState("");
  const [moveMessage, setMoveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const reloadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getParticipants({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });
      setParticipants(data);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    adminService
      .getParticipants({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      })
      .then((data) => {
        if (isMounted) {
          setParticipants(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [statusFilter, searchQuery]);

  const filteredParticipants = Array.isArray(participants)
    ? participants.filter((p) => {
        if (!p) return false;
        if (statusFilter !== "all" && p.paymentStatus !== statusFilter) return false;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const name = (p.fullName || "").toLowerCase();
          const email = (p.email || "").toLowerCase();
          const code = (p.bookingCode || "").toLowerCase();
          if (!name.includes(query) && !email.includes(query) && !code.includes(query)) {
            return false;
          }
        }
        return true;
      })
    : [];

  const handleExecuteMove = async () => {
    if (!movingParticipant) return;

    try {
      const res = await adminService.moveParticipant({
        participantId: movingParticipant.id,
        currentGroupId: movingParticipant.bookingGroupId,
        targetGroupId,
        reason: moveReason || "Pemindahan grup atas persetujuan admin",
      });

      if (res.success) {
        setMoveMessage({ type: "success", text: res.message || "Peserta berhasil dipindahkan ke grup tujuan." });
        await reloadData();
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
              placeholder="Cari nama traveler, email, atau kode tiket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {["all", "paid", "pending", "failed"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-[#00677d] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st === "all" ? "Semua Status" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Participants Table */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-6 w-6 text-[#00677d] animate-spin" />
            <span>Memuat data peserta...</span>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-xl border border-slate-200 space-y-2">
            <PackageOpen className="h-8 w-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-600">Tidak ada data peserta yang sesuai.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Kode Booking</th>
                  <th className="px-5 py-3.5">Nama Traveler</th>
                  <th className="px-5 py-3.5">Kontak</th>
                  <th className="px-5 py-3.5">Grup Mobil</th>
                  <th className="px-5 py-3.5">Pembayaran</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParticipants.map((p) => {
                  const badge = getPaymentBadge(p.paymentStatus);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-[#00677d]">
                        {p.bookingCode}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800">{p.fullName}</div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          NIK: {p.identityNumber}
                        </span>
                      </td>
                      <td className="px-5 py-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{p.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{p.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-[#00677d] font-bold text-xs">
                          Grup #{p.group?.groupNumber || 1}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-bold mt-1">
                          {formatCurrency(p.totalAmount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setMovingParticipant(p);
                            setMoveMessage(null);
                          }}
                          className="h-8 gap-1.5 text-xs text-[#00677d] hover:bg-[#00677d]/5"
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
        )}
      </Card>

      {/* MOVE PARTICIPANT DIALOG */}
      <Dialog open={!!movingParticipant} onOpenChange={() => setMovingParticipant(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#00677d]" />
              Pindah Grup Mobil Peserta
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pindahkan peserta ke grup mobil lain jika ada rombongan teman atau reorganisasi kapasitas (maks 6 pax).
            </DialogDescription>
          </DialogHeader>

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

          {movingParticipant && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Peserta:</span>
                  <span className="font-bold text-slate-800">{movingParticipant.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Grup Saat Ini:</span>
                  <span className="font-bold text-[#00677d]">
                    Grup #{movingParticipant.group?.groupNumber || 1}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Pilih Grup Tujuan *
                </label>
                <select
                  value={targetGroupId}
                  onChange={(e) => setTargetGroupId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="grp-01">Grup Mobil #1</option>
                  <option value="grp-02">Grup Mobil #2</option>
                  <option value="grp-03">Grup Mobil #3 (Baru)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Alasan Pemindahan (Catatan Audit)
                </label>
                <Input
                  placeholder="Contoh: Permintaan gabung rombongan keluarga"
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMovingParticipant(null)}
                  className="flex-1 text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteMove}
                  className="flex-1 text-xs font-bold"
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

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
  CreditCard,
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
import { getPaymentBadge, formatCurrency, formatDate, getDestinationTitle } from "@/src/lib/utils";
import type { Participant, Trip } from "@/src/types";

export default function ParticipantsManagementPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Move Participant Modal State
  const [movingParticipant, setMovingParticipant] = useState<Participant | null>(null);
  const [targetTripId, setTargetTripId] = useState<string>("");
  const [targetGroupId, setTargetGroupId] = useState<string>("");
  const [moveReason, setMoveReason] = useState("");
  const [moveMessage, setMoveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Update Payment Status Modal State
  const [editingPaymentParticipant, setEditingPaymentParticipant] = useState<Participant | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<"paid" | "pending" | "failed" | "refunded">("paid");
  const [paymentUpdateMessage, setPaymentUpdateMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const reloadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [partsData, tripsData] = await Promise.all([
        adminService.getParticipants({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchQuery || undefined,
        }),
        adminService.getTrips(),
      ]);
      setParticipants(partsData);
      setTrips(tripsData);
    } catch {
      // Silently handled
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      adminService.getParticipants({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: searchQuery || undefined,
      }),
      adminService.getTrips(),
    ])
      .then(([partsData, tripsData]) => {
        if (isMounted) {
          setParticipants(partsData);
          setTrips(tripsData);
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

  const handleOpenMoveModal = (p: Participant) => {
    setMovingParticipant(p);
    const pTripId = p.tripId || p.trip?.id || (trips[0]?.id ?? "");
    setTargetTripId(pTripId);
    const currTrip = trips.find((t) => t.id === pTripId) || trips[0];
    const initialGrp =
      currTrip?.groups?.find((g) => g.id !== p.bookingGroupId)?.id ||
      currTrip?.groups?.[0]?.id ||
      "new-group";
    setTargetGroupId(initialGrp);
    setMoveReason("");
    setMoveMessage(null);
  };

  const handleTargetTripChange = (newTripId: string) => {
    setTargetTripId(newTripId);
    const selTrip = trips.find((t) => t.id === newTripId);
    if (selTrip && Array.isArray(selTrip.groups) && selTrip.groups.length > 0) {
      const defaultG =
        selTrip.groups.find((g) => g.id !== movingParticipant?.bookingGroupId)?.id ||
        selTrip.groups[0].id;
      setTargetGroupId(defaultG);
    } else {
      setTargetGroupId("new-group");
    }
  };

  const handleExecuteMove = async () => {
    if (!movingParticipant) return;

    try {
      const res = await adminService.moveParticipant({
        participantId: movingParticipant.id,
        currentGroupId: movingParticipant.bookingGroupId,
        currentTripId: movingParticipant.tripId,
        targetGroupId,
        targetTripId,
        reason: moveReason || "Pemindahan grup atas persetujuan admin",
      });

      if (res.success) {
        setMoveMessage({
          type: "success",
          text: res.message || "Peserta berhasil dipindahkan ke grup tujuan.",
        });
        await reloadData();
        setTimeout(() => {
          setMovingParticipant(null);
          setMoveMessage(null);
        }, 1000);
      } else {
        setMoveMessage({
          type: "error",
          text: res.message || "Gagal memindahkan peserta.",
        });
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Terjadi kesalahan saat memindahkan peserta.";
      setMoveMessage({ type: "error", text: msg });
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!editingPaymentParticipant) return;
    setIsUpdatingPayment(true);
    try {
      const res = await adminService.updateParticipantPaymentStatus(
        editingPaymentParticipant.id,
        newPaymentStatus
      );
      if (res.success) {
        setPaymentUpdateMessage({
          type: "success",
          text: res.message || "Status pembayaran berhasil diperbarui.",
        });
        await reloadData();
        setTimeout(() => {
          setEditingPaymentParticipant(null);
          setPaymentUpdateMessage(null);
        }, 1000);
      } else {
        setPaymentUpdateMessage({
          type: "error",
          text: res.message || "Gagal memperbarui status pembayaran.",
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui status.";
      setPaymentUpdateMessage({ type: "error", text: msg });
    } finally {
      setIsUpdatingPayment(false);
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
              placeholder="Cari nama peserta, email, atau kode booking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status Pembayaran:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas (Paid)</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="failed">Gagal (Failed)</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00677d] mx-auto" />
            <p className="text-xs text-slate-500">Memuat daftar peserta...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <PackageOpen className="h-12 w-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Tidak ada peserta ditemukan</p>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Kode Booking</th>
                  <th className="px-5 py-3.5">Nama Peserta</th>
                  <th className="px-5 py-3.5">Kontak</th>
                  <th className="px-5 py-3.5">Armada Mobil</th>
                  <th className="px-5 py-3.5">Status Pembayaran</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
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
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingPaymentParticipant(p);
                              setNewPaymentStatus(
                                (p.paymentStatus as "paid" | "pending" | "failed" | "refunded") || "paid"
                              );
                              setPaymentUpdateMessage(null);
                            }}
                            className="h-8 gap-1.5 text-xs text-amber-800 hover:bg-amber-50 border-amber-200"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-amber-600" />
                            Ubah Status
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenMoveModal(p)}
                            className="h-8 gap-1.5 text-xs text-[#00677d] hover:bg-[#00677d]/5"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5" />
                            Pindah Trip / Grup
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* UPDATE PAYMENT STATUS DIALOG */}
      <Dialog
        open={!!editingPaymentParticipant}
        onOpenChange={() => setEditingPaymentParticipant(null)}
      >
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-600" />
              Ubah Status Pembayaran Manual
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Perbarui status pembayaran tiket peserta (misal: verifikasi pembayaran offline atau mutasi bank).
            </DialogDescription>
          </DialogHeader>

          {paymentUpdateMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                paymentUpdateMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 border border-rose-200"
              }`}
            >
              {paymentUpdateMessage.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{paymentUpdateMessage.text}</span>
            </div>
          )}

          {editingPaymentParticipant && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Peserta:</span>
                  <span className="font-bold text-slate-800">{editingPaymentParticipant.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kode Booking:</span>
                  <span className="font-mono font-bold text-[#00677d]">
                    {editingPaymentParticipant.bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Biaya:</span>
                  <span className="font-bold text-[#a43c12]">
                    {formatCurrency(editingPaymentParticipant.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Pilih Status Pembayaran Baru *
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) =>
                    setNewPaymentStatus(e.target.value as "paid" | "pending" | "failed" | "refunded")
                  }
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="paid">✅ Lunas (Paid / Settlement)</option>
                  <option value="pending">⏳ Menunggu Pembayaran (Pending)</option>
                  <option value="failed">❌ Gagal / Dibatalkan (Failed / Expired)</option>
                  <option value="refunded">🔄 Dikembalikan (Refunded)</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPaymentParticipant(null)}
                  className="flex-1 text-xs"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  disabled={isUpdatingPayment}
                  onClick={handleUpdatePaymentStatus}
                  className="flex-1 text-xs font-bold bg-[#00677d] hover:bg-[#005264]"
                >
                  {isUpdatingPayment ? "Menyimpan..." : "Simpan Status Bayar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MOVE PARTICIPANT DIALOG */}
      <Dialog open={!!movingParticipant} onOpenChange={() => setMovingParticipant(null)}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-lg text-[#191c1e] flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-[#00677d]" />
              Pindah Jadwal Trip & Grup Armada
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pindahkan peserta ke jadwal trip atau grup mobil lain jika ada rombongan teman atau reorganisasi kapasitas (maks 6 pax).
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

          {movingParticipant && (() => {
            const activeTrip = trips.find((t) => t.id === targetTripId) || trips[0];
            const activeGroups = activeTrip?.groups || [];

            return (
              <div className="space-y-4 pt-2">
                {/* Current Participant Info */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Peserta:</span>
                    <span className="font-bold text-slate-800">{movingParticipant.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kode Booking:</span>
                    <span className="font-mono font-bold text-[#00677d]">
                      {movingParticipant.bookingCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jadwal & Grup Asal:</span>
                    <span className="font-semibold text-slate-700">
                      Grup #{movingParticipant.group?.groupNumber || 1} (Trip #{movingParticipant.tripId})
                    </span>
                  </div>
                </div>

                {/* Target Trip Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Pilih Jadwal Trip Tujuan *
                  </label>
                  <select
                    value={targetTripId}
                    onChange={(e) => handleTargetTripChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                  >
                    {trips.map((t) => {
                      const destTitle = getDestinationTitle(t.destination);
                      const dDate = t.departureDate ? formatDate(t.departureDate) : "Jadwal Terbuka";
                      return (
                        <option key={t.id} value={t.id}>
                          Trip #{t.id} — {destTitle} ({dDate})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Target Group Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Pilih Grup Mobil Tujuan *
                  </label>
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
                  >
                    {activeGroups.map((g) => {
                      const isFull = g.currentParticipants >= (g.capacity || 6);
                      return (
                        <option key={g.id} value={g.id} disabled={isFull}>
                          {g.name || `Grup Mobil #${g.groupNumber}`} ({g.currentParticipants}/{g.capacity || 6} Pax){isFull ? " [PENUH]" : ""}
                        </option>
                      );
                    })}
                    <option value="new-group">
                      + Buka Grup Mobil Baru #{activeGroups.length + 1} (Unit Mobil Baru)
                    </option>
                  </select>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Alasan Pemindahan (Catatan Audit)
                  </label>
                  <Input
                    placeholder="Contoh: Permintaan gabung rombongan keluarga atau penyesuaian armada"
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
                    className="flex-1 text-xs font-bold bg-[#00677d] hover:bg-[#005264]"
                  >
                    Konfirmasi Pindah
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

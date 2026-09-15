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
  MapPin,
  ExternalLink,
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
import {
  getPaymentBadge,
  formatCurrency,
  formatDate,
  getDestinationTitle,
  parsePickupLocation,
} from "@/src/lib/utils";
import { findConflictingCountriesInGroup } from "@/src/lib/country-conflict";
import type { Participant, Trip, BookingGroup } from "@/src/types";

export default function ParticipantsManagementPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [allGroups, setAllGroups] = useState<BookingGroup[]>([]);
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
      const [partsData, tripsData, groupsData] = await Promise.all([
        adminService.getParticipants({
          status: statusFilter === "all" ? undefined : statusFilter,
          search: searchQuery || undefined,
        }),
        adminService.getTrips(),
        adminService.getGroups(),
      ]);

      const groupsByTrip = new Map<string, BookingGroup[]>();
      const groupById = new Map<string, BookingGroup>();
      const groupByParticipant = new Map<string, BookingGroup>();

      for (const g of groupsData) {
        groupById.set(g.id, g);
        const tId = g.tripId || g.trip?.id;
        if (tId) {
          if (!groupsByTrip.has(tId)) groupsByTrip.set(tId, []);
          groupsByTrip.get(tId)!.push(g);
        }
        if (Array.isArray(g.participants)) {
          for (const part of g.participants) {
            if (part.id) groupByParticipant.set(part.id, g);
            if (part.bookingCode) groupByParticipant.set(part.bookingCode, g);
          }
        }
      }

      const enrichedParticipants = partsData.map((p) => {
        const rawP = p as unknown as Record<string, unknown>;
        const gId =
          p.bookingGroupId ||
          rawP.groupId ||
          rawP.booking_group_id ||
          rawP.group_id;
        const matchedGroup =
          (typeof gId === "string" ? groupById.get(gId) : undefined) ||
          (p.id ? groupByParticipant.get(p.id) : undefined) ||
          (p.bookingCode ? groupByParticipant.get(p.bookingCode) : undefined);

        return {
          ...p,
          bookingGroupId: p.bookingGroupId || matchedGroup?.id || "",
          group: p.group || p.bookingGroup || matchedGroup,
          bookingGroup: p.bookingGroup || p.group || matchedGroup,
          tripId: p.tripId || matchedGroup?.tripId || p.trip?.id || "",
          trip: p.trip || matchedGroup?.trip,
        };
      });

      const enrichedTrips = tripsData.map((t) => ({
        ...t,
        groups: t.groups && t.groups.length > 0 ? t.groups : groupsByTrip.get(t.id) || [],
      }));

      setParticipants(enrichedParticipants);
      setTrips(enrichedTrips);
      setAllGroups(groupsData);
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
      adminService.getGroups(),
    ])
      .then(([partsData, tripsData, groupsData]) => {
        if (isMounted) {
          const groupsByTrip = new Map<string, BookingGroup[]>();
          const groupById = new Map<string, BookingGroup>();
          const groupByParticipant = new Map<string, BookingGroup>();

          for (const g of groupsData) {
            groupById.set(g.id, g);
            const tId = g.tripId || g.trip?.id;
            if (tId) {
              if (!groupsByTrip.has(tId)) groupsByTrip.set(tId, []);
              groupsByTrip.get(tId)!.push(g);
            }
            if (Array.isArray(g.participants)) {
              for (const part of g.participants) {
                if (part.id) groupByParticipant.set(part.id, g);
                if (part.bookingCode) groupByParticipant.set(part.bookingCode, g);
              }
            }
          }

          const enrichedParticipants = partsData.map((p) => {
            const rawP = p as unknown as Record<string, unknown>;
            const gId =
              p.bookingGroupId ||
              rawP.groupId ||
              rawP.booking_group_id ||
              rawP.group_id;
            const matchedGroup =
              (typeof gId === "string" ? groupById.get(gId) : undefined) ||
              (p.id ? groupByParticipant.get(p.id) : undefined) ||
              (p.bookingCode ? groupByParticipant.get(p.bookingCode) : undefined);

            return {
              ...p,
              bookingGroupId: p.bookingGroupId || matchedGroup?.id || "",
              group: p.group || p.bookingGroup || matchedGroup,
              bookingGroup: p.bookingGroup || p.group || matchedGroup,
              tripId: p.tripId || matchedGroup?.tripId || p.trip?.id || "",
              trip: p.trip || matchedGroup?.trip,
            };
          });

          const enrichedTrips = tripsData.map((t) => ({
            ...t,
            groups: t.groups && t.groups.length > 0 ? t.groups : groupsByTrip.get(t.id) || [],
          }));

          setParticipants(enrichedParticipants);
          setTrips(enrichedTrips);
          setAllGroups(groupsData);
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

  const getParticipantGroupNumber = (p: Participant): number => {
    if (p.group?.groupNumber) return p.group.groupNumber;
    if (p.bookingGroup?.groupNumber) return p.bookingGroup.groupNumber;

    const rawP = p as unknown as Record<string, unknown>;
    const rawNum = rawP.groupNumber || rawP.group_number;
    if (typeof rawNum === "number" && rawNum > 0) return rawNum;

    const gId =
      p.bookingGroupId ||
      rawP.groupId ||
      rawP.booking_group_id ||
      rawP.group_id;

    if (typeof gId === "string") {
      const matched = allGroups.find((g) => g.id === gId);
      if (matched?.groupNumber) return matched.groupNumber;
    }

    const matchedByPart = allGroups.find((g) =>
      g.participants?.some(
        (part) =>
          part.id === p.id ||
          (Boolean(p.bookingCode) && part.bookingCode === p.bookingCode)
      )
    );
    if (matchedByPart?.groupNumber) return matchedByPart.groupNumber;

    return 1;
  };

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
    const pTripId =
      p.tripId ||
      p.trip?.id ||
      p.bookingGroup?.tripId ||
      p.group?.tripId ||
      (trips[0]?.id ?? "");
    setTargetTripId(pTripId);

    const currTrip = trips.find((t) => t.id === pTripId);
    const availableGroups =
      (currTrip?.groups && currTrip.groups.length > 0)
        ? currTrip.groups
        : allGroups.filter((g) => (g.tripId || g.trip?.id) === pTripId);

    const pGroupId = p.bookingGroupId || p.group?.id || p.bookingGroup?.id;
    const initialGrp =
      availableGroups.find((g) => g.id !== pGroupId)?.id ||
      availableGroups[0]?.id ||
      "new-group";
    setTargetGroupId(initialGrp);
    setMoveReason("");
    setMoveMessage(null);
  };

  const handleTargetTripChange = (newTripId: string) => {
    setTargetTripId(newTripId);
    const selTrip = trips.find((t) => t.id === newTripId);
    const availableGroups =
      (selTrip?.groups && selTrip.groups.length > 0)
        ? selTrip.groups
        : allGroups.filter((g) => (g.tripId || g.trip?.id) === newTripId);

    const currentGroupId =
      movingParticipant?.bookingGroupId ||
      movingParticipant?.group?.id ||
      movingParticipant?.bookingGroup?.id;

    if (availableGroups.length > 0) {
      const defaultG =
        availableGroups.find((g) => g.id !== currentGroupId)?.id ||
        availableGroups[0].id;
      setTargetGroupId(defaultG);
    } else {
      setTargetGroupId("new-group");
    }
  };

  const handleExecuteMove = async () => {
    if (!movingParticipant) return;

    try {
      const currentGroupId =
        movingParticipant.bookingGroupId ||
        movingParticipant.group?.id ||
        movingParticipant.bookingGroup?.id ||
        "";
      const currentTripId =
        movingParticipant.tripId ||
        movingParticipant.trip?.id ||
        movingParticipant.bookingGroup?.tripId ||
        movingParticipant.group?.tripId ||
        "";

      const res = await adminService.moveParticipant({
        participantId: movingParticipant.id,
        currentGroupId,
        currentTripId,
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
                  <th className="px-5 py-3.5">Lokasi Penjemputan</th>
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
                        <span className="text-[11px] text-slate-400">
                          {p.nationality || "Indonesia"}
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
                      <td className="px-5 py-4 max-w-[240px]">
                        {p.pickupLocation ? (() => {
                          const parsed = parsePickupLocation(p.pickupLocation);
                          const hasCoords = typeof p.pickupLatitude === "number" && typeof p.pickupLongitude === "number";
                          const mapsUrl = hasCoords
                            ? `https://maps.google.com/?q=${p.pickupLatitude},${p.pickupLongitude}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.pickupLocation)}`;

                          return (
                            <div className="space-y-1">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-[#00677d] shrink-0 mt-0.5" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-800 text-xs truncate" title={parsed.placeName}>
                                    {parsed.placeName}
                                  </div>
                                  {parsed.address && (
                                    <div className="text-[11px] text-slate-500 line-clamp-2 leading-tight mt-0.5" title={parsed.address}>
                                      {parsed.address}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {p.pickupNotes && (
                                <div className="text-[10px] text-amber-800 bg-amber-50/80 border border-amber-200/60 rounded px-1.5 py-0.5 mt-0.5 inline-block" title={p.pickupNotes}>
                                  <span className="font-semibold">Catatan:</span> {p.pickupNotes}
                                </div>
                              )}

                              <div className="pt-0.5">
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#00677d] hover:text-[#005264] hover:underline"
                                >
                                  <span>{hasCoords ? `Buka GPS (${p.pickupLatitude?.toFixed(3)}, ${p.pickupLongitude?.toFixed(3)})` : "Buka Google Maps"}</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-[11px] text-slate-400 italic">Meeting Point Standar</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 text-[#00677d] font-bold text-xs">
                          Grup #{getParticipantGroupNumber(p)}
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
            const activeGroups =
              activeTrip?.groups && activeTrip.groups.length > 0
                ? activeTrip.groups
                : allGroups.filter((g) => (g.tripId || g.trip?.id) === targetTripId);

            const currentGroupId =
              movingParticipant.bookingGroupId ||
              movingParticipant.group?.id ||
              movingParticipant.bookingGroup?.id;
            const currentTripId = String(
              movingParticipant.tripId ||
              movingParticipant.trip?.id ||
              movingParticipant.bookingGroup?.tripId ||
              movingParticipant.group?.tripId ||
              "-"
            );
            const currentGroupNum = Number(
              movingParticipant.group?.groupNumber ??
              movingParticipant.bookingGroup?.groupNumber ??
              (movingParticipant as unknown as Record<string, unknown>).groupNumber ??
              1
            );

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
                      Grup #{currentGroupNum} (Trip #{currentTripId})
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
                      const capacity = g.maxParticipants || g.capacity || 6;
                      const currentPax = g.currentParticipants ?? g.participants?.length ?? 0;
                      const isFull = currentPax >= capacity;
                      const isCurrentGroup = g.id === currentGroupId && targetTripId === currentTripId;
                      const driverName = g.driver?.fullName || g.driver?.name;
                      const driverInfo = driverName ? ` [Driver: ${driverName}]` : " [Driver belum ada]";
                      return (
                        <option key={g.id} value={g.id} disabled={isFull || isCurrentGroup}>
                          {g.name || `Grup Mobil #${g.groupNumber}`} ({currentPax}/{capacity} Pax)
                          {driverInfo}
                          {isCurrentGroup ? " [Grup Asal Saat Ini]" : isFull ? " [PENUH]" : ""}
                        </option>
                      );
                    })}
                    <option value="new-group">
                      + Buka Grup Mobil Baru #{activeGroups.length + 1} (Unit Mobil Baru)
                    </option>
                  </select>
                </div>

                {/* Nationality Conflict Warning for Admin */}
                {(() => {
                  const targetGroup = activeGroups.find((g) => g.id === targetGroupId);
                  const targetGroupParts = targetGroup?.participants || [];
                  const conflictingCountries = findConflictingCountriesInGroup(
                    movingParticipant.nationality || "Indonesia",
                    targetGroupParts
                  );

                  if (conflictingCountries.length === 0) return null;

                  return (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2 shadow-xs">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Perhatian Geopolitik / Kewarganegaraan:</span> Grup mobil tujuan ini saat ini memiliki penumpang dari{" "}
                        <span className="font-semibold underline">
                          {conflictingCountries.join(", ")}
                        </span>
                        . Sebagai Administrator, Anda tetap memiliki wewenang penuh untuk memindahkan peserta ini jika diperlukan.
                      </div>
                    </div>
                  );
                })()}

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

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Eye,
  Check,
  Edit2,
  Ticket,
  Car,
  MapPin,
  Wallet,
  Search,
  Filter,
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
import { financeService } from "@/src/services/finance.service";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import { PrintSlipModal } from "@/src/components/admin/finance/print-slip-modal";
import type { VendorSettlementSlip } from "@/src/types";

export default function VendorSettlementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [vendorSlips, setVendorSlips] = useState<VendorSettlementSlip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [isVendorSlipModalOpen, setIsVendorSlipModalOpen] = useState(false);
  const [editingSlip, setEditingSlip] = useState<VendorSettlementSlip | null>(null);
  const [viewSlipModal, setViewSlipModal] = useState<{ type: "driver" | "vendor" | "deposit"; data: any } | null>(null);

  // Form States - Vendor Settlement Slip
  const [vendorName, setVendorName] = useState("");
  const [vendorCategory, setVendorCategory] = useState<"TICKET" | "RENTAL_JEEP" | "PARKING_VIP" | "OTHER">("TICKET");
  const [vendorPeriodStart, setVendorPeriodStart] = useState("");
  const [vendorPeriodEnd, setVendorPeriodEnd] = useState("");
  const [vendorTotalItems, setVendorTotalItems] = useState<number>(1);
  const [vendorTotalAmount, setVendorTotalAmount] = useState<number>(0);
  const [vendorNotes, setVendorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initDates = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 14);

    setVendorPeriodStart(start.toISOString().split("T")[0]);
    setVendorPeriodEnd(end.toISOString().split("T")[0]);
  }, []);

  const openCreateModal = () => {
    setEditingSlip(null);
    initDates();
    setVendorName("");
    setVendorCategory("TICKET");
    setVendorTotalItems(1);
    setVendorTotalAmount(0);
    setVendorNotes("");
    setIsVendorSlipModalOpen(true);
  };

  const openEditModal = (slip: VendorSettlementSlip) => {
    setEditingSlip(slip);
    setVendorName(slip.vendorName || "");
    setVendorCategory((slip.category as any) || "TICKET");
    setVendorPeriodStart(
      slip.periodStart ? new Date(slip.periodStart).toISOString().split("T")[0] : ""
    );
    setVendorPeriodEnd(
      slip.periodEnd ? new Date(slip.periodEnd).toISOString().split("T")[0] : ""
    );
    setVendorTotalItems(Number(slip.totalItems) || 1);
    setVendorTotalAmount(Number(slip.totalAmount) || 0);
    setVendorNotes(slip.notes || "");
    setIsVendorSlipModalOpen(true);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const slipsData = await financeService.getVendorSlips();
      setVendorSlips(Array.isArray(slipsData) ? slipsData : []);
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memuat daftar settlement vendor.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initDates();
    loadData();
  }, [initDates, loadData]);

  // Handle Create or Update Vendor Slip
  const handleSubmitVendorSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      alert("Nama vendor wajib diisi");
      return;
    }
    if (vendorTotalAmount <= 0) {
      alert("Total tagihan vendor harus lebih dari Rp 0");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSlip) {
        const updated = await financeService.updateVendorSlip(editingSlip.id, {
          vendorName: vendorName.trim(),
          category: vendorCategory,
          periodStart: vendorPeriodStart,
          periodEnd: vendorPeriodEnd,
          totalItems: Number(vendorTotalItems) || 1,
          totalAmount: Number(vendorTotalAmount) || 0,
          notes: vendorNotes.trim() || undefined,
        });

        setIsVendorSlipModalOpen(false);
        setEditingSlip(null);
        setActionFeedback({
          type: "success",
          message: `Slip settlement vendor ${updated.slipNumber || ""} berhasil diperbarui.`,
        });
      } else {
        const newSlip = await financeService.createVendorSlip({
          vendorName: vendorName.trim(),
          category: vendorCategory,
          periodStart: vendorPeriodStart,
          periodEnd: vendorPeriodEnd,
          totalItems: Number(vendorTotalItems) || 1,
          totalAmount: Number(vendorTotalAmount) || 0,
          notes: vendorNotes.trim() || undefined,
        });

        setIsVendorSlipModalOpen(false);
        setVendorName("");
        setVendorTotalAmount(0);
        setVendorNotes("");
        setActionFeedback({
          type: "success",
          message: `Slip settlement vendor ${newSlip.slipNumber || ""} berhasil dibuat dalam status DRAFT.`,
        });
      }
      await loadData();
    } catch (err: any) {
      alert(err?.message || (editingSlip ? "Gagal memperbarui slip settlement vendor" : "Gagal membuat slip settlement vendor"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Transitions
  const handleUpdateStatus = async (
    slipId: string,
    newStatus: "VENDOR_CONFIRMED" | "PAID" | "CANCELLED"
  ) => {
    const confirmPrompt =
      newStatus === "VENDOR_CONFIRMED"
        ? "Konfirmasi bahwa vendor telah menyetujui rincian tagihan?"
        : newStatus === "PAID"
        ? "Pastikan dana tagihan vendor sudah ditransfer/dicairkan. Lanjutkan status LUNAS?"
        : "Batalkan slip settlement ini?";

    if (!window.confirm(confirmPrompt)) return;

    try {
      await financeService.updateVendorSlipStatus(slipId, {
        status: newStatus,
      });
      setActionFeedback({
        type: "success",
        message: `Status slip vendor berhasil diperbarui menjadi ${newStatus}.`,
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Gagal memperbarui status slip vendor");
    }
  };

  // Filtered vendor slips
  const filteredSlips = vendorSlips.filter((slip) => {
    if (categoryFilter && slip.category !== categoryFilter) return false;
    if (statusFilter && slip.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = slip.vendorName.toLowerCase().includes(q);
      const matchSlip = slip.slipNumber.toLowerCase().includes(q);
      if (!matchName && !matchSlip) return false;
    }
    return true;
  });

  // Calculate quick KPIs
  const totalSlipsCount = vendorSlips.length;
  const draftCount = vendorSlips.filter((s) => s.status === "DRAFT").length;
  const confirmedCount = vendorSlips.filter((s) => s.status === "VENDOR_CONFIRMED").length;
  const paidCount = vendorSlips.filter((s) => s.status === "PAID").length;
  const totalVendorAmount = vendorSlips
    .filter((s) => s.status !== "CANCELLED")
    .reduce((acc, curr) => acc + (Number(curr.totalAmount) || 0), 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "TICKET":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Ticket className="w-3 h-3" /> Tiket Wisata
          </span>
        );
      case "RENTAL_JEEP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Car className="w-3 h-3" /> Sewa Jeep/Transport
          </span>
        );
      case "PARKING_VIP":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <MapPin className="w-3 h-3" /> Parkir VIP / Rest Area
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Building2 className="w-3 h-3" /> Rekanan Lainnya
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <Clock className="w-3 h-3 mr-1" /> DRAFT SLIP
          </Badge>
        );
      case "VENDOR_CONFIRMED":
        return (
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> VENDOR SETUJU
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
            <Check className="w-3 h-3 mr-1" /> LUNAS / DICAIRKAN
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> DIBATALKAN
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-[#00677d]" />
            Settlement Vendor Rekanan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekapan tagihan 2-mingguan untuk vendor tiket wisata, sewa jeep merapi/bromo, parkir VIP, dan rekanan resmi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-[#00677d] hover:bg-[#005264] text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Buat Slip Vendor
          </Button>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs font-semibold underline hover:opacity-75"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Quick KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Tagihan Aktif
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-[#00677d]">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalVendorAmount)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dari total {totalSlipsCount} slip settlement dibuat
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Draft / Rekapan Baru
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{draftCount} Slip</p>
          <p className="text-xs text-amber-600 mt-1">Menunggu pengiriman ke vendor</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Vendor Confirmed
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{confirmedCount} Slip</p>
          <p className="text-xs text-indigo-600 mt-1">Siap diproses transfer/cair</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Sudah Lunas / Cair
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{paidCount} Slip</p>
          <p className="text-xs text-emerald-600 mt-1">Bukti transfer terbit</p>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama vendor atau no. slip..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00677d]"
            >
              <option value="">Semua Kategori</option>
              <option value="TICKET">Tiket Wisata</option>
              <option value="RENTAL_JEEP">Sewa Jeep</option>
              <option value="PARKING_VIP">Parkir VIP</option>
              <option value="OTHER">Lainnya</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00677d]"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="VENDOR_CONFIRMED">VENDOR_CONFIRMED</option>
              <option value="PAID">PAID (Lunas)</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00677d] mb-2" />
            <p className="text-sm">Memuat daftar slip settlement vendor...</p>
          </div>
        ) : filteredSlips.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Belum ada slip settlement vendor</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter || statusFilter
                ? "Tidak ada data yang cocok dengan kriteria filter saat ini."
                : "Klik tombol '+ Buat Slip Vendor' untuk membuat rekapan settlement 2-mingguan."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No. Slip & Vendor</th>
                  <th className="py-3.5 px-4">Kategori Rekanan</th>
                  <th className="py-3.5 px-4">Periode Layanan</th>
                  <th className="py-3.5 px-4 text-center">Jml Item</th>
                  <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi & Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlips.map((slip) => (
                  <tr key={slip.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{slip.vendorName}</div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        {slip.slipNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getCategoryBadge(slip.category)}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <div>{formatDate(slip.periodStart)}</div>
                      <div className="text-slate-400">s/d {formatDate(slip.periodEnd)}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {slip.totalItems}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(slip.totalAmount)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(slip.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewSlipModal({ type: "vendor", data: slip })}
                          className="h-8 px-2.5 text-xs text-[#00677d] border-[#00677d]/30 hover:bg-[#00677d]/5"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Slip
                        </Button>

                        {(slip.status === "DRAFT" || slip.status === "VENDOR_CONFIRMED") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(slip)}
                            className="h-8 px-2.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                            title="Ubah rincian slip pra-persetujuan"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        )}

                        {slip.status === "DRAFT" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(slip.id, "VENDOR_CONFIRMED")}
                            className="h-8 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Konfirmasi
                          </Button>
                        )}

                        {slip.status === "VENDOR_CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(slip.id, "PAID")}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Wallet className="w-3.5 h-3.5 mr-1" />
                            Cairkan
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Buat / Edit Slip Settlement Vendor */}
      <Dialog open={isVendorSlipModalOpen} onOpenChange={setIsVendorSlipModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00677d]" />
              {editingSlip
                ? `Edit Slip Settlement Vendor (${editingSlip.slipNumber})`
                : "Buat Slip Settlement Vendor 2-Mingguan"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingSlip
                ? "Ubah data rincian pra-slip sebelum status disetujui / dicairkan."
                : "Buat rincian tagihan rekanan tiket wisata, sewa armada/jeep, atau fasilitas parkir."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitVendorSlip} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Vendor / Rekanan *
              </label>
              <Input
                type="text"
                placeholder="cth: Pengelola Jeep Merapi Lavatour / Kraton Jogja"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Vendor Rekanan *
              </label>
              <select
                value={vendorCategory}
                onChange={(e: any) => setVendorCategory(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="TICKET">Tiket Masuk Wisata (Borobudur, Prambanan, Kraton, dll)</option>
                <option value="RENTAL_JEEP">Sewa Jeep Merapi / Bromo / Offroad</option>
                <option value="PARKING_VIP">Parkir VIP / Rest Area / Drop-off Point</option>
                <option value="OTHER">Rekanan Kuliner / Oleh-oleh / Lainnya</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Awal *
                </label>
                <Input
                  type="date"
                  value={vendorPeriodStart}
                  onChange={(e) => setVendorPeriodStart(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode Akhir *
                </label>
                <Input
                  type="date"
                  value={vendorPeriodEnd}
                  onChange={(e) => setVendorPeriodEnd(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Layanan / Tiket
                </label>
                <Input
                  type="number"
                  min="1"
                  value={vendorTotalItems}
                  onChange={(e) => setVendorTotalItems(Math.max(1, Number(e.target.value)))}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Tagihan (Rp) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  value={vendorTotalAmount || ""}
                  onChange={(e) => setVendorTotalAmount(Number(e.target.value))}
                  placeholder="0"
                  required
                  className="text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Rincian Tambahan
              </label>
              <textarea
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="cth: 12 Paket Jeep Short Trip Merapi trip 1 s/d 14 Okt"
                rows={2}
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsVendorSlipModalOpen(false);
                  setEditingSlip(null);
                }}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#00677d] hover:bg-[#005264] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : editingSlip ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Slip Vendor"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slip Preview & Print Modal */}
      <PrintSlipModal
        viewSlipModal={viewSlipModal}
        onClose={() => setViewSlipModal(null)}
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Receipt,
  Users,
  Car,
  Calendar,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Check,
  Building2,
  Ticket,
  Wrench,
  Fuel,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Eye,
  Trash2,
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
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, formatDate } from "@/src/lib/utils";
import { ImageUploader } from "@/src/components/ui/image-uploader";
import { PrintSlipModal } from "@/src/components/admin/finance/print-slip-modal";
import type {
  FinanceTransaction,
  CashflowSummary,
  DriverManifestSummaryItem,
  Driver,
  Vehicle,
} from "@/src/types";

export default function FinanceOverviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [cashflow, setCashflow] = useState<CashflowSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [driverManifests, setDriverManifests] = useState<DriverManifestSummaryItem[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Filter States
  const [dateFilter, setDateFilter] = useState<"all" | "this_month" | "last_14_days" | "custom">("this_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [viewSlipModal, setViewSlipModal] = useState<{ type: "driver" | "vendor" | "deposit"; data: any } | null>(null);

  // Form States - New Transaction
  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txCategory, setTxCategory] = useState<string>("GUEST_COLLECT");
  const [txAmount, setTxAmount] = useState<number | string>("");
  const [txPaymentMethod, setTxPaymentMethod] = useState<string>("CASH");
  const [txDriverId, setTxDriverId] = useState<string>("");
  const [txVehicleId, setTxVehicleId] = useState<string>("");
  const [txVendorName, setTxVendorName] = useState<string>("");
  const [txReceiptProofUrl, setTxReceiptProofUrl] = useState<string>("");
  const [txDescription, setTxDescription] = useState<string>("");
  const [txNotes, setTxNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initDateFilters = useCallback(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cashflowData, txData, manifestsData, drvList, vhcList] = await Promise.all([
        financeService.getCashflowSummary(startDate, endDate),
        financeService.getTransactions({ startDate, endDate, limit: 100 }),
        financeService.getDriverManifests(undefined, startDate, endDate),
        adminService.getDrivers(),
        adminService.getVehicles(),
      ]);

      setCashflow(cashflowData);
      setTransactions(txData.data || []);
      setDriverManifests(manifestsData || []);
      setDrivers(drvList || []);
      setVehicles(vhcList || []);
    } catch (err: any) {
      console.error("Failed loading finance overview data", err);
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memuat data finance.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    initDateFilters();
  }, [initDateFilters]);

  useEffect(() => {
    if (startDate && endDate) {
      loadData();
    }
  }, [startDate, endDate, loadData]);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0) {
      setActionFeedback({ type: "error", message: "Nominal transaksi harus lebih dari 0." });
      return;
    }

    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        type: txType,
        category: txCategory,
        amount: Number(txAmount),
        paymentMethod: txPaymentMethod,
        driverId: txDriverId || undefined,
        vehicleId: txVehicleId || undefined,
        vendorName: txVendorName || undefined,
        receiptProofUrl: txReceiptProofUrl || undefined,
        description: txDescription || undefined,
        notes: txNotes || undefined,
      });

      setActionFeedback({
        type: "success",
        message: "Transaksi keuangan berhasil dicatat ke buku besar.",
      });
      setIsTxModalOpen(false);
      setTxAmount("");
      setTxDescription("");
      setTxNotes("");
      setTxReceiptProofUrl("");
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal mencatat transaksi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      await financeService.deleteTransaction(id);
      setActionFeedback({ type: "success", message: "Transaksi berhasil dihapus." });
      await loadData();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err?.message || "Gagal menghapus transaksi." });
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.transactionNumber.toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q) ||
      tx.vendorName?.toLowerCase().includes(q) ||
      tx.description?.toLowerCase().includes(q) ||
      tx.driverName?.toLowerCase().includes(q)
    );
  });

  const unsettledCount = driverManifests.filter((m) => !m.isSettled).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-[#00677d] tracking-tight">
              Finance &amp; Penagihan Operasional
            </h1>
            <Badge variant="azure" className="font-mono text-xs">
              PPh Final 1.5% Otomatis
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Buku besar arus kas, rekonsiliasi setoran driver, payroll 2-mingguan, dan settlement vendor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsTxModalOpen(true)}
            className="bg-[#00677d] text-white hover:bg-[#005264] rounded-xl font-bold gap-2 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Catat Transaksi Manual
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#00677d]" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* DATE RANGE FILTER */}
      <Card className="p-4 border border-slate-100 shadow-stitch-card bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 mr-2 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#00677d]" />
              Filter Periode Buku Besar:
            </span>
            <button
              type="button"
              onClick={() => {
                setDateFilter("this_month");
                const now = new Date();
                setStartDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
                setEndDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === "this_month"
                  ? "bg-[#00677d] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setDateFilter("last_14_days");
                const now = new Date();
                const past = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                setStartDate(past.toISOString().split("T")[0]);
                setEndDate(now.toISOString().split("T")[0]);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === "last_14_days"
                  ? "bg-[#00677d] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              14 Hari Terakhir (Siklus Payroll)
            </button>
            <button
              type="button"
              onClick={() => setDateFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === "all"
                  ? "bg-[#00677d] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDateFilter("custom");
                setStartDate(e.target.value);
              }}
              className="w-36 text-xs h-9"
            />
            <span className="text-xs text-slate-400">s/d</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDateFilter("custom");
                setEndDate(e.target.value);
              }}
              className="w-36 text-xs h-9"
            />
          </div>
        </div>
      </Card>

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pemasukan (Inflow)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(cashflow?.totalIncome || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Guest collect, komisi belanja &amp; refund modal
            </p>
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Pengeluaran (Outflow)
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {formatCurrency(cashflow?.totalExpense || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Gaji, transport, vendor, operasional &amp; logistik
            </p>
          </div>
        </Card>

        <Card className="p-5 border border-slate-100 shadow-stitch-card bg-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Laba Bersih Operasional
            </span>
            <div
              className={`p-2 rounded-xl ${
                (cashflow?.netProfit || 0) >= 0 ? "bg-[#00677d]/10 text-[#00677d]" : "bg-rose-50 text-rose-600"
              }`}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl font-extrabold tracking-tight ${
                (cashflow?.netProfit || 0) >= 0 ? "text-[#00677d]" : "text-rose-600"
              }`}
            >
              {formatCurrency(cashflow?.netProfit || 0)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Pemasukan dikurangi seluruh beban pengeluaran
            </p>
          </div>
        </Card>

        <Card className="p-5 border border-amber-200 shadow-stitch-card bg-gradient-to-br from-amber-50/50 to-white relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-700" />
              Estimasi PPh UMKM (1.5%)
            </span>
            <Badge variant="warning" className="text-[10px] font-mono">
              Pajak Final
            </Badge>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-extrabold text-amber-900 tracking-tight">
              {formatCurrency(cashflow?.estimatedTax || 0)}
            </h3>
            <p className="text-[11px] text-amber-800/80 mt-1">
              {(cashflow?.netProfit || 0) > 0
                ? "Dihitung 1.5% dari laba bersih periode ini"
                : "Rp 0 (Periode tidak mengalami profit)"}
            </p>
          </div>
        </Card>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <Card className="border border-slate-100 shadow-stitch-card bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Buku Besar &amp; Mutasi Kas Terakhir
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar seluruh transaksi pemasukan dan pengeluaran kas operasional.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <Input
              type="text"
              placeholder="Cari transaksi / vendor / driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe &amp; Kategori</th>
                <th className="py-3 px-4">Entitas Terkait</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#00677d] mb-2" />
                    Memuat transaksi buku besar...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada riwayat transaksi pada periode filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isIncome = tx.type === "INCOME";
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#00677d]">
                        {tx.transactionNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(tx.transactionDate || tx.createdAt)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              isIncome ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isIncome ? "INFLOW" : "OUTFLOW"}
                          </span>
                          <span className="font-semibold text-slate-900">{tx.category}</span>
                        </div>
                        {tx.description && (
                          <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-xs">
                            {tx.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {tx.driverName && (
                          <span className="block font-medium">
                            Driver: {tx.driverName}
                          </span>
                        )}
                        {tx.vendorName && (
                          <span className="block font-medium">Vendor: {tx.vendorName}</span>
                        )}
                        {tx.vehiclePlate && (
                          <span className="block font-mono text-[11px] text-slate-500">
                            Armada: {tx.vehiclePlate}
                          </span>
                        )}
                        {!tx.driverName && !tx.vendorName && !tx.vehiclePlate && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                          {tx.paymentMethod}
                        </Badge>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold text-sm ${
                          isIncome ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: NEW TRANSACTION */}
      <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#00677d]">
              Catat Transaksi Kas Masuk / Keluar
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Input pencatatan keuangan manual ke dalam buku besar arus kas operasional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTransaction} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Arus Kas *</label>
                <select
                  value={txType}
                  onChange={(e) => {
                    const nextType = e.target.value as "INCOME" | "EXPENSE";
                    setTxType(nextType);
                    setTxCategory(nextType === "INCOME" ? "GUEST_COLLECT" : "OP_ADMIN_SALARY");
                  }}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="INCOME">Pemasukan (Inflow)</option>
                  <option value="EXPENSE">Pengeluaran (Outflow)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Transaksi *</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  {txType === "INCOME" ? (
                    <>
                      <option value="GUEST_COLLECT">Uang Pembayaran Tamu (Guest Collect)</option>
                      <option value="SHOPPING_COMMISSION">Fee / Komisi Belanja Toko</option>
                      <option value="PACKAGE_REFUND">Sisa Belanja Tiket / Paket (Refund)</option>
                      <option value="OTHER_INCOME">Pemasukan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="DRIVER_CAPITAL_EXPENSE">Modal - Belanja Driver</option>
                      <option value="DRIVER_SALARY">Gaji Driver (Jasa Supir)</option>
                      <option value="DRIVER_TRANSPORT_PKG">Gaji Transport Package (BBM, Mobil, Air)</option>
                      <option value="VENDOR_TICKET">Pengeluaran Vendor Tiket</option>
                      <option value="VENDOR_RENT">Pengeluaran Vendor Sewa (Jeep / Armada Luar)</option>
                      <option value="VENDOR_VIP_PARKING">Pengeluaran Vendor Parkir VIP</option>
                      <option value="OP_ADMIN_SALARY">Gaji Admin (Bulanan)</option>
                      <option value="OP_CAR_WASH">Biaya Cuci Mobil Armada</option>
                      <option value="OP_RENT">Sewa Tempat / Kantor</option>
                      <option value="OP_UTILITIES">Listrik, Air &amp; Wifi Kantor</option>
                      <option value="OP_MAINTENANCE">Servis &amp; Ganti Oli Armada</option>
                      <option value="OTHER_EXPENSE">Pengeluaran Lainnya</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nominal (Rp) *</label>
                <Input
                  type="number"
                  placeholder="Contoh: 150000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Metode Pembayaran *</label>
                <select
                  value={txPaymentMethod}
                  onChange={(e) => setTxPaymentMethod(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="CASH">Tunai (Cash Fisik)</option>
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="MIDTRANS">Payment Gateway (Midtrans)</option>
                </select>
              </div>
            </div>

            {/* ENTITY LINKAGE */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Terkait Driver (Opsional)</label>
                <select
                  value={txDriverId}
                  onChange={(e) => setTxDriverId(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="">-- Pilih Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.fullName || "Driver"} ({d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Terkait Armada (Opsional)</label>
                <select
                  value={txVehicleId}
                  onChange={(e) => setTxVehicleId(e.target.value)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="">-- Pilih Kendaraan --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.name || v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {txType === "EXPENSE" && txCategory.startsWith("VENDOR_") && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Vendor *</label>
                <Input
                  type="text"
                  placeholder="Contoh: Tiket Candi Prambanan / Jeep Merapi"
                  value={txVendorName}
                  onChange={(e) => setTxVendorName(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
              <Input
                type="text"
                placeholder="Contoh: Pembayaran kasbon driver / cuci mobil unit AB 1234 CD"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Upload Bukti Nota / Resi</label>
              <ImageUploader
                value={txReceiptProofUrl}
                onChange={(url) => setTxReceiptProofUrl(url as string)}
                folder="finance"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsTxModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#00677d] text-white hover:bg-[#005264] font-bold rounded-xl"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* PRINT SLIP MODAL */}
      <PrintSlipModal viewSlipModal={viewSlipModal} onClose={() => setViewSlipModal(null)} />
    </div>
  );
}

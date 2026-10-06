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
  Printer,
  ChevronRight,
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
import type {
  FinanceTransaction,
  CashflowSummary,
  DriverManifestSummaryItem,
  DriverSettlementSlip,
  VendorSettlementSlip,
  Driver,
  Vehicle,
} from "@/src/types";

export default function AdminFinancePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "driver_collect" | "driver_payroll" | "vendor_settlement" | "operational">("overview");

  // Global & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [cashflow, setCashflow] = useState<CashflowSummary | null>(null);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [driverManifests, setDriverManifests] = useState<DriverManifestSummaryItem[]>([]);
  const [driverSlips, setDriverSlips] = useState<DriverSettlementSlip[]>([]);
  const [vendorSlips, setVendorSlips] = useState<VendorSettlementSlip[]>([]);
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
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedManifestForDeposit, setSelectedManifestForDeposit] = useState<DriverManifestSummaryItem | null>(null);
  const [isDriverSlipModalOpen, setIsDriverSlipModalOpen] = useState(false);
  const [isVendorSlipModalOpen, setIsVendorSlipModalOpen] = useState(false);
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

  // Form States - Driver Deposit / Auto-Nett
  const [depGuestCollectAmount, setDepGuestCollectAmount] = useState<number>(0);
  const [depModalRefundAmount, setDepModalRefundAmount] = useState<number>(0);
  const [depFuelExpenseDeduction, setDepFuelExpenseDeduction] = useState<number>(0);
  const [depNotes, setDepNotes] = useState<string>("");

  // Form States - Driver Payroll Slip
  const [slipDriverId, setSlipDriverId] = useState<string>("");
  const [slipPeriodStart, setSlipPeriodStart] = useState<string>("");
  const [slipPeriodEnd, setSlipPeriodEnd] = useState<string>("");
  const [slipPackageType, setSlipPackageType] = useState<"TRANSPORT_ONLY" | "ALL_IN" | "MIXED">("TRANSPORT_ONLY");
  const [slipTotalTrips, setSlipTotalTrips] = useState<number>(1);
  const [slipDriverFee, setSlipDriverFee] = useState<number>(350000);
  const [slipTransportAllowance, setSlipTransportAllowance] = useState<number>(200000);
  const [slipBonus, setSlipBonus] = useState<number>(0);
  const [slipDeductions, setSlipDeductions] = useState<number>(0);
  const [slipNotes, setSlipNotes] = useState<string>("");

  // Form States - Vendor Settlement Slip
  const [vndName, setVndName] = useState<string>("");
  const [vndCategory, setVndCategory] = useState<"TICKET" | "RENTAL_JEEP" | "PARKING_VIP" | "OTHER">("TICKET");
  const [vndPeriodStart, setVndPeriodStart] = useState<string>("");
  const [vndPeriodEnd, setVndPeriodEnd] = useState<string>("");
  const [vndTotalItems, setVndTotalItems] = useState<number>(10);
  const [vndTotalAmount, setVndTotalAmount] = useState<number>(500000);
  const [vndNotes, setVndNotes] = useState<string>("");

  // Helper date calculators
  const initDateFilters = useCallback(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
    setSlipPeriodStart(firstDay);
    setSlipPeriodEnd(lastDay);
    setVndPeriodStart(firstDay);
    setVndPeriodEnd(lastDay);
  }, []);

  const loadAllFinanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cashflowData, txData, manifestsData, dSlipsData, vSlipsData, drvList, vhcList] =
        await Promise.all([
          financeService.getCashflowSummary(startDate, endDate),
          financeService.getTransactions({ startDate, endDate, limit: 50 }),
          financeService.getDriverManifests(undefined, startDate, endDate),
          financeService.getDriverSlips(),
          financeService.getVendorSlips(),
          adminService.getDrivers(),
          adminService.getVehicles(),
        ]);

      setCashflow(cashflowData);
      setTransactions(txData.data);
      setDriverManifests(manifestsData);
      setDriverSlips(dSlipsData);
      setVendorSlips(vSlipsData);
      setDrivers(drvList);
      setVehicles(vhcList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memuat data finance.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    initDateFilters();
  }, [initDateFilters]);

  useEffect(() => {
    if (startDate && endDate) {
      loadAllFinanceData();
    }
  }, [startDate, endDate, loadAllFinanceData]);

  // Handle Create Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        type: txType,
        category: txCategory,
        amount: Number(txAmount),
        payment_method: txPaymentMethod,
        driver_id: txDriverId || undefined,
        vehicle_id: txVehicleId || undefined,
        vendor_name: txVendorName || undefined,
        receipt_proof_url: txReceiptProofUrl || undefined,
        description: txDescription || undefined,
        notes: txNotes || undefined,
      });

      setActionFeedback({ type: "success", message: "Transaksi kas berhasil dicatat ke buku besar." });
      setIsTxModalOpen(false);
      resetTxForm();
      await loadAllFinanceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan transaksi.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetTxForm = () => {
    setTxAmount("");
    setTxDescription("");
    setTxNotes("");
    setTxReceiptProofUrl("");
    setTxVendorName("");
    setTxDriverId("");
    setTxVehicleId("");
  };

  // Handle Driver Deposit / Auto-Nett Save
  const handleSaveDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManifestForDeposit) return;
    setIsSubmitting(true);
    try {
      // 1. Catat Guest Collect Inflow (jika ada)
      if (depGuestCollectAmount > 0) {
        await financeService.createTransaction({
          type: "INCOME",
          category: "GUEST_COLLECT",
          amount: depGuestCollectAmount,
          payment_method: "CASH",
          driver_id: selectedManifestForDeposit.driverId || undefined,
          trip_id: selectedManifestForDeposit.tripId,
          booking_group_id: selectedManifestForDeposit.bookingGroupId,
          description: `Setoran Pelunasan Tamu Manifest (${selectedManifestForDeposit.destinationName})`,
          notes: depNotes,
        });
      }

      // 2. Catat Sisa Modal Refund (jika ada)
      if (depModalRefundAmount > 0) {
        await financeService.createTransaction({
          type: "INCOME",
          category: "MODAL_REFUND",
          amount: depModalRefundAmount,
          payment_method: "CASH",
          driver_id: selectedManifestForDeposit.driverId || undefined,
          trip_id: selectedManifestForDeposit.tripId,
          booking_group_id: selectedManifestForDeposit.bookingGroupId,
          description: `Kembalian Sisa Modal Tiket/Belanja (${selectedManifestForDeposit.destinationName})`,
          notes: depNotes,
        });
      }

      // 3. Catat Pengeluaran Talangan Driver (jika ada deduction)
      if (depFuelExpenseDeduction > 0) {
        await financeService.createTransaction({
          type: "EXPENSE",
          category: "DRIVER_TRANSPORT",
          amount: depFuelExpenseDeduction,
          payment_method: "CASH",
          driver_id: selectedManifestForDeposit.driverId || undefined,
          trip_id: selectedManifestForDeposit.tripId,
          booking_group_id: selectedManifestForDeposit.bookingGroupId,
          description: `Talangan BBM/Parkir oleh Driver (${selectedManifestForDeposit.destinationName})`,
          notes: depNotes,
        });
      }

      setActionFeedback({ type: "success", message: `Nota Setoran Driver untuk grup trip berhasil diterbitkan.` });
      setIsDepositModalOpen(false);
      setSelectedManifestForDeposit(null);
      await loadAllFinanceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses setoran driver.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Driver Payroll Slip
  const handleSaveDriverSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipDriverId) return;
    setIsSubmitting(true);
    try {
      await financeService.createDriverSlip({
        driver_id: slipDriverId,
        period_start: slipPeriodStart,
        period_end: slipPeriodEnd,
        package_type: slipPackageType,
        total_trips: slipTotalTrips,
        total_driver_fee: slipDriverFee,
        total_transport_allowance: slipTransportAllowance,
        total_bonus_or_commission: slipBonus,
        total_deductions: slipDeductions,
        notes: slipNotes,
      });

      setActionFeedback({ type: "success", message: "Slip Gaji 2-Mingguan Driver berhasil dibuat (Status: DRAFT)." });
      setIsDriverSlipModalOpen(false);
      await loadAllFinanceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat slip driver.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Vendor Slip
  const handleSaveVendorSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vndName) return;
    setIsSubmitting(true);
    try {
      await financeService.createVendorSlip({
        vendor_name: vndName,
        category: vndCategory,
        period_start: vndPeriodStart,
        period_end: vndPeriodEnd,
        total_items: vndTotalItems,
        total_amount: vndTotalAmount,
        notes: vndNotes,
      });

      setActionFeedback({ type: "success", message: "Slip Rekap Tagihan Vendor 2-Mingguan berhasil dibuat (Status: DRAFT)." });
      setIsVendorSlipModalOpen(false);
      await loadAllFinanceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat slip vendor.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Status Update (Cairkan / Konfirmasi Slip)
  const handleUpdateSlipStatus = async (type: "driver" | "vendor", id: string, newStatus: string) => {
    try {
      if (type === "driver") {
        await financeService.updateDriverSlipStatus(id, { status: newStatus });
        setActionFeedback({ type: "success", message: `Status Slip Gaji Driver berhasil diperbarui menjadi ${newStatus}.` });
      } else {
        await financeService.updateVendorSlipStatus(id, { status: newStatus });
        setActionFeedback({ type: "success", message: `Status Rekap Tagihan Vendor berhasil diperbarui menjadi ${newStatus}.` });
      }
      await loadAllFinanceData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui status slip.";
      setActionFeedback({ type: "error", message: msg });
    }
  };

  // Print Slip Generator (Thermal / A4 View)
  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
              Finance, Penagihan &amp; Settlement
            </h1>
            <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-200 text-[11px] font-bold">
              Pajak Otomatis 1.5% PPh Final
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pusat pembukuan kas masuk/keluar, rekonsiliasi setoran driver, payroll 2-mingguan, dan settlement vendor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              setTxType("INCOME");
              setTxCategory("GUEST_COLLECT");
              setIsTxModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Catat Pemasukan
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setTxType("EXPENSE");
              setTxCategory("DRIVER_TRANSPORT");
              setIsTxModalOpen(true);
            }}
            className="gap-1.5 text-xs bg-[#a43c12] hover:bg-[#8e330d] text-white rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Catat Pengeluaran
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={loadAllFinanceData}
            className="gap-1.5 text-xs rounded-xl text-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border print:hidden ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 text-xs font-semibold">{actionFeedback.message}</div>
          <button type="button" onClick={() => setActionFeedback(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <Card className="p-2 border border-slate-100 shadow-stitch-card bg-white print:hidden">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "overview"
                ? "bg-[#00677d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            <span>Overview &amp; Laba Rugi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("driver_collect")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "driver_collect"
                ? "bg-[#00677d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Tagihan &amp; Setoran Driver ({driverManifests.filter((m) => !m.isSettled).length} Belum Setor)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("driver_payroll")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "driver_payroll"
                ? "bg-[#00677d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Payroll Driver (2-Mingguan)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vendor_settlement")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "vendor_settlement"
                ? "bg-[#00677d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Ticket className="h-4 w-4" />
            <span>Settlement Vendor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("operational")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === "operational"
                ? "bg-[#00677d] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            <Wrench className="h-4 w-4" />
            <span>Operasional &amp; Log Armada</span>
          </button>
        </div>
      </Card>

      {/* DATE RANGE FILTER */}
      <Card className="p-4 border border-slate-100 shadow-stitch-card bg-white print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00677d]" />
            <span className="text-xs font-bold text-slate-800">Filter Periode Pembukuan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-semibold">Dari:</span>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs w-36 bg-slate-50"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-semibold">Sampai:</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs w-36 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & LABA RUGI & PAJAK 1.5% */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Inflow */}
            <Card className="p-5 border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40 shadow-stitch-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Pemasukan (Inflow)</span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ArrowDownLeft className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading font-black text-2xl text-emerald-900">
                  {formatCurrency(cashflow?.totalIncome || 0)}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  Termasuk pembayaran tamu &amp; komisi
                </span>
              </div>
            </Card>

            {/* Total Outflow */}
            <Card className="p-5 border border-rose-100 bg-gradient-to-br from-white to-rose-50/40 shadow-stitch-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Pengeluaran (Outflow)</span>
                <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading font-black text-2xl text-rose-900">
                  {formatCurrency(cashflow?.totalExpense || 0)}
                </span>
                <span className="text-[11px] text-rose-700 block mt-0.5">
                  Driver, vendor &amp; biaya operasional
                </span>
              </div>
            </Card>

            {/* Net Profit */}
            <Card className="p-5 border border-slate-100 bg-gradient-to-br from-white to-blue-50/40 shadow-stitch-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#00677d]">Laba Bersih Operasional</span>
                <div className="h-8 w-8 rounded-lg bg-[#00677d]/10 flex items-center justify-center text-[#00677d]">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className={`font-heading font-black text-2xl ${(cashflow?.netProfit || 0) >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                  {formatCurrency(cashflow?.netProfit || 0)}
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Pemasukan dikurangi pengeluaran
                </span>
              </div>
            </Card>

            {/* Tax 1.5% */}
            <Card className="p-5 border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40 shadow-stitch-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Estimasi Pajak PPh Final</span>
                <div className="h-8 w-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-900">
                  <Percent className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="font-heading font-black text-2xl text-amber-950">
                  {formatCurrency(cashflow?.estimatedTax || 0)}
                </span>
                <span className="text-[11px] text-amber-800 font-semibold block mt-0.5">
                  Rumus: Laba Bersih × 1.5% UMKM
                </span>
              </div>
            </Card>
          </div>

          {/* TRANSACTIONS LEDGER TABLE */}
          <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">Buku Besar Transaksi Kas (Ledger)</h3>
                <p className="text-xs text-slate-500">Daftar transaksi arus kas masuk dan keluar yang tercatat secara real-time.</p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="Cari transaksi / no. TRX..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs bg-slate-50/60 border-slate-200 h-8"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-6 w-6 text-[#00677d] animate-spin" />
                <span>Memuat buku besar kas...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Belum ada transaksi kas pada rentang tanggal ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3">No. Transaksi</th>
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Tipe &amp; Kategori</th>
                      <th className="py-3 px-3">Deskripsi / Pihak Terkait</th>
                      <th className="py-3 px-3">Metode</th>
                      <th className="py-3 px-3 text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions
                      .filter((tx) => {
                        if (!searchQuery) return true;
                        const q = searchQuery.toLowerCase();
                        return (
                          tx.transactionNumber.toLowerCase().includes(q) ||
                          (tx.description || "").toLowerCase().includes(q) ||
                          (tx.vendorName || "").toLowerCase().includes(q) ||
                          (tx.driverName || "").toLowerCase().includes(q)
                        );
                      })
                      .map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{tx.transactionNumber}</td>
                          <td className="py-3 px-3 text-slate-500">{formatDate(tx.transactionDate)}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={tx.type === "INCOME" ? "success" : "destructive"}
                                className="text-[10px] font-bold uppercase py-0.5"
                              >
                                {tx.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                              </Badge>
                              <span className="text-[11px] font-semibold text-slate-600">{tx.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800 block">{tx.description || "-"}</span>
                            {tx.driverName && (
                              <span className="text-[11px] text-slate-400 block">Driver: {tx.driverName}</span>
                            )}
                            {tx.vendorName && (
                              <span className="text-[11px] text-slate-400 block">Vendor: {tx.vendorName}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-heading font-bold text-sm">
                            <span className={tx.type === "INCOME" ? "text-emerald-700" : "text-rose-700"}>
                              {tx.type === "INCOME" ? "+" : "-"} {formatCurrency(tx.amount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TAGIHAN & SETORAN DRIVER */}
      {/* ========================================================================= */}
      {activeTab === "driver_collect" && (
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Rekonsiliasi Manifest &amp; Setoran Driver di Lapangan
              </h3>
              <p className="text-xs text-slate-500">
                Pantau uang pelunasan tamu di tempat (*guest collect*) dan sisa belanja tiket/paket dari supir.
              </p>
            </div>

            {driverManifests.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Tidak ada grup trip pada rentang tanggal ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {driverManifests.map((m) => (
                  <Card
                    key={m.bookingGroupId}
                    className={`p-5 border transition-all ${
                      m.isSettled ? "border-emerald-200 bg-emerald-50/20" : "border-amber-200 bg-amber-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{m.destinationName}</span>
                          <Badge variant="azure" className="text-[10px] font-bold">
                            Grup #{m.groupNumber}
                          </Badge>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Tgl Trip: {formatDate(m.departureDate)} · Armada: {m.vehiclePlate || "-"}
                        </span>
                      </div>

                      <Badge variant={m.isSettled ? "success" : "coral"} className="text-[10px] font-bold">
                        {m.isSettled ? "Sudah Lunas Setor" : "Belum Lunas Setor"}
                      </Badge>
                    </div>

                    <div className="mt-3 p-3 rounded-xl bg-white border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Driver Bertugas:</span>
                        <span className="font-bold text-slate-800">{m.driverName}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total Peserta:</span>
                        <span>{m.totalParticipants} Pax ({m.paidCount} Lunas Transfer, {m.pendingCount} Tagih di Tempat)</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-semibold border-t border-slate-100 pt-1.5">
                        <span>Sisa Tagihan Tamu (Guest Collect):</span>
                        <span className="text-rose-700 font-bold">{formatCurrency(m.uncollectedGuestAmount)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Setoran Driver Tercatat:</span>
                        <span className="text-emerald-700 font-bold">{formatCurrency(m.recordedSetoran)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedManifestForDeposit(m);
                          setDepGuestCollectAmount(m.uncollectedGuestAmount);
                          setDepModalRefundAmount(0);
                          setDepFuelExpenseDeduction(0);
                          setIsDepositModalOpen(true);
                        }}
                        className="gap-1.5 text-xs bg-white text-[#00677d] border-[#00677d] rounded-xl hover:bg-[#00677d]/5"
                      >
                        <Receipt className="h-3.5 w-3.5" />
                        Terima Setoran Driver
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PAYROLL DRIVER 2-MINGGUAN */}
      {/* ========================================================================= */}
      {activeTab === "driver_payroll" && (
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Penggajian &amp; Settlement Driver 2-Mingguan
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola rekap gaji jasa supir &amp; transport allowance (Jasa Transport Saja vs Paket All-In).
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsDriverSlipModalOpen(true)}
                className="gap-1.5 text-xs bg-[#00677d] text-white rounded-xl shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Buat Slip Gaji Driver Baru
              </Button>
            </div>

            {driverSlips.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Belum ada slip gaji 2-mingguan driver yang diterbitkan.
              </div>
            ) : (
              <div className="space-y-3">
                {driverSlips.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#00677d] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#00677d]">{s.slipNumber}</span>
                        <Badge
                          variant={
                            s.status === "PAID"
                              ? "success"
                              : s.status === "DRIVER_CONFIRMED"
                              ? "azure"
                              : "secondary"
                          }
                          className="text-[10px] font-bold"
                        >
                          {s.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {s.packageType === "TRANSPORT_ONLY" ? "Jasa Transport Saja" : "Paket All-In"}
                        </Badge>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900">
                        {s.driverName || "Driver"} · {s.totalTrips} Trip Selesai
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        Periode: {formatDate(s.periodStart)} s/d {formatDate(s.periodEnd)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Total Diterima Driver:</span>
                        <span className="font-heading font-black text-lg text-emerald-800">
                          {formatCurrency(s.netAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {s.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateSlipStatus("driver", s.id, "DRIVER_CONFIRMED")}
                            className="text-xs text-blue-700 rounded-lg h-8"
                          >
                            Konfirmasi Driver
                          </Button>
                        )}
                        {s.status === "DRIVER_CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSlipStatus("driver", s.id, "PAID")}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-8"
                          >
                            Cairkan Dana
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewSlipModal({ type: "driver", data: s })}
                          className="text-xs text-[#00677d] rounded-lg h-8 gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat / Cetak
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SETTLEMENT VENDOR 2-MINGGUAN */}
      {/* ========================================================================= */}
      {activeTab === "vendor_settlement" && (
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Settlement &amp; Tagihan Vendor Rekanan (2-Mingguan)
                </h3>
                <p className="text-xs text-slate-500">
                  Rekapitulasi tagihan tiket masuk wisata, sewa jeep/armada luar, dan parkir VIP rekanan.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsVendorSlipModalOpen(true)}
                className="gap-1.5 text-xs bg-[#00677d] text-white rounded-xl shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Buat Rekap Vendor Baru
              </Button>
            </div>

            {vendorSlips.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                Belum ada rekap tagihan vendor rekanan yang diterbitkan.
              </div>
            ) : (
              <div className="space-y-3">
                {vendorSlips.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#00677d] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#00677d]">{v.slipNumber}</span>
                        <Badge
                          variant={v.status === "PAID" ? "success" : "secondary"}
                          className="text-[10px] font-bold"
                        >
                          {v.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {v.category}
                        </Badge>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-slate-900">
                        {v.vendorName} · {v.totalItems} Tiket / Item
                      </h4>
                      <span className="text-[11px] text-slate-500 block">
                        Periode: {formatDate(v.periodStart)} s/d {formatDate(v.periodEnd)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Total Tagihan:</span>
                        <span className="font-heading font-black text-lg text-rose-800">
                          {formatCurrency(v.totalAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {v.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateSlipStatus("vendor", v.id, "VENDOR_CONFIRMED")}
                            className="text-xs text-blue-700 rounded-lg h-8"
                          >
                            Konfirmasi Vendor
                          </Button>
                        )}
                        {v.status === "VENDOR_CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateSlipStatus("vendor", v.id, "PAID")}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg h-8"
                          >
                            Pelunasan Tagihan
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewSlipModal({ type: "vendor", data: v })}
                          className="text-xs text-[#00677d] rounded-lg h-8 gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat / Cetak
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OPERASIONAL & LOG ARMADA */}
      {/* ========================================================================= */}
      {activeTab === "operational" && (
        <div className="space-y-6">
          <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Pencatatan Biaya Operasional &amp; Pemeliharaan Armada
              </h3>
              <p className="text-xs text-slate-500">
                Input pengeluaran rutin kantor (gaji admin, sewa, listrik) dan log pemeliharaan mobil (servis, ganti oli, cuci).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quick Card 1: Gaji Admin */}
              <Card className="p-4 border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Building2 className="h-4 w-4 text-[#00677d]" />
                  <span>Gaji Admin &amp; Staff (Bulanan)</span>
                </div>
                <p className="text-[11px] text-slate-500">Pencatatan gaji karyawan admin kantor bulanan.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTxType("EXPENSE");
                    setTxCategory("OP_ADMIN_SALARY");
                    setTxDescription("Gaji Admin Kantor Bulan Ini");
                    setIsTxModalOpen(true);
                  }}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  + Catat Gaji Admin
                </Button>
              </Card>

              {/* Quick Card 2: Servis & Ganti Oli */}
              <Card className="p-4 border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Wrench className="h-4 w-4 text-[#00677d]" />
                  <span>Servis &amp; Ganti Oli Armada</span>
                </div>
                <p className="text-[11px] text-slate-500">Catat biaya bengkel dan ganti oli per plat mobil.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTxType("EXPENSE");
                    setTxCategory("OP_MAINTENANCE");
                    setTxDescription("Servis Rutin & Ganti Oli");
                    setIsTxModalOpen(true);
                  }}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  + Catat Servis Mobil
                </Button>
              </Card>

              {/* Quick Card 3: Cuci Mobil */}
              <Card className="p-4 border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Car className="h-4 w-4 text-[#00677d]" />
                  <span>Biaya Cuci Mobil (Car Wash)</span>
                </div>
                <p className="text-[11px] text-slate-500">Pembersihan armada sebelum &amp; setelah trip sharing.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTxType("EXPENSE");
                    setTxCategory("OP_CAR_WASH");
                    setTxDescription("Cuci Mobil Armada");
                    setIsTxModalOpen(true);
                  }}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  + Catat Cuci Mobil
                </Button>
              </Card>

              {/* Quick Card 4: Sewa Tempat */}
              <Card className="p-4 border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Building2 className="h-4 w-4 text-[#00677d]" />
                  <span>Sewa Tempat / Kantor</span>
                </div>
                <p className="text-[11px] text-slate-500">Sewa ruko, garasi armada, atau kantor operasional.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTxType("EXPENSE");
                    setTxCategory("OP_RENT");
                    setTxDescription("Sewa Tempat Operasional");
                    setIsTxModalOpen(true);
                  }}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  + Catat Sewa Tempat
                </Button>
              </Card>

              {/* Quick Card 5: Listrik, Air & Wifi */}
              <Card className="p-4 border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Fuel className="h-4 w-4 text-[#00677d]" />
                  <span>Listrik, Air &amp; Wifi Kantor</span>
                </div>
                <p className="text-[11px] text-slate-500">Tagihan utilitas operasional kantor bulanan.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTxType("EXPENSE");
                    setTxCategory("OP_UTILITIES");
                    setTxDescription("Tagihan Listrik & Internet Kantor");
                    setIsTxModalOpen(true);
                  }}
                  className="w-full text-xs h-8 rounded-lg"
                >
                  + Catat Utilitas Kantor
                </Button>
              </Card>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CATAT TRANSAKSI KAS BARU */}
      {/* ========================================================================= */}
      <Dialog open={isTxModalOpen} onOpenChange={setIsTxModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              {txType === "INCOME" ? "Catat Pemasukan Kas Baru" : "Catat Pengeluaran Kas Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Transaksi ini akan langsung dicatat ke buku besar keuangan Share Trip Jogja.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransaction} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Tipe Arus Kas *</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-[#00677d]"
                >
                  <option value="INCOME">Pemasukan (Inflow)</option>
                  <option value="EXPENSE">Pengeluaran (Outflow)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Kategori Transaksi *</label>
                <select
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:border-[#00677d]"
                >
                  {txType === "INCOME" ? (
                    <>
                      <option value="GUEST_COLLECT">Pelunasan Tamu (Guest Collect)</option>
                      <option value="MERCHANT_COMMISSION">Komisi Belanja / Toko Oleh-oleh</option>
                      <option value="MODAL_REFUND">Kembalian Sisa Modal Tiket</option>
                      <option value="OTHER_INCOME">Pemasukan Lainnya</option>
                    </>
                  ) : (
                    <>
                      <option value="DRIVER_TRANSPORT">BBM &amp; Transport Package</option>
                      <option value="DRIVER_MODAL">Modal Jalan / Belanja Tiket</option>
                      <option value="DRIVER_FEE">Gaji / Jasa Supir</option>
                      <option value="VENDOR_TICKET">Tiket Masuk Wisata Vendor</option>
                      <option value="VENDOR_RENTAL">Sewa Jeep / Alat Eksternal</option>
                      <option value="VENDOR_PARKING">Parkir VIP &amp; Retribusi</option>
                      <option value="OP_ADMIN_SALARY">Gaji Admin (Bulanan)</option>
                      <option value="OP_CAR_WASH">Cuci Mobil Armada</option>
                      <option value="OP_MAINTENANCE">Servis &amp; Ganti Oli Mobil</option>
                      <option value="OP_RENT">Sewa Kantor / Tempat</option>
                      <option value="OP_UTILITIES">Listrik &amp; Wifi Kantor</option>
                      <option value="OTHER_EXPENSE">Pengeluaran Lainnya</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Nominal (Rp) *</label>
                <Input
                  required
                  type="number"
                  placeholder="Contoh: 350000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Metode Pembayaran</label>
                <select
                  value={txPaymentMethod}
                  onChange={(e) => setTxPaymentMethod(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="CASH">Tunai (Cash)</option>
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="MIDTRANS">Midtrans Gateway</option>
                </select>
              </div>
            </div>

            {/* Optional Driver & Vehicle Links */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Driver Terkait (Opsional)</label>
                <select
                  value={txDriverId}
                  onChange={(e) => setTxDriverId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="">-- Tanpa Driver --</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.user?.name || d.licenseNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Armada Terkait (Opsional)</label>
                <select
                  value={txVehicleId}
                  onChange={(e) => setTxVehicleId(e.target.value)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="">-- Tanpa Armada --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plateNumber || v.plate_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Deskripsi Transaksi *</label>
              <Input
                required
                placeholder="Contoh: Pelunasan 2 pax tamu trip Bromo oleh driver Budi"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <ImageUploader
                mode="single"
                folder="finance-receipts"
                label="Foto Struk / Bukti Nota Fisik (Opsional)"
                value={txReceiptProofUrl}
                onChange={setTxReceiptProofUrl}
                helperText="Unggah foto kuitansi, nota bensin, struk tiket, atau bukti transfer."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsTxModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#00677d] text-white font-bold rounded-xl gap-1.5"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Simpan Transaksi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: TERIMA SETORAN DRIVER (AUTO-NETT CALCULATION) */}
      {/* ========================================================================= */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Terima Setoran Driver &amp; Terbitkan Nota Setor
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Rekonsiliasi otomatis tagihan tamu di tempat, sisa modal belanja tiket, dan talangan BBM driver.
            </DialogDescription>
          </DialogHeader>

          {selectedManifestForDeposit && (
            <form onSubmit={handleSaveDeposit} className="space-y-4 mt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{selectedManifestForDeposit.destinationName} (Grup #{selectedManifestForDeposit.groupNumber})</span>
                  <span>{formatDate(selectedManifestForDeposit.departureDate)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Driver Bertugas:</span>
                  <span className="font-semibold text-slate-800">{selectedManifestForDeposit.driverName}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    1. Uang Pembayaran Tamu Diterima Driver (Guest Collect)
                  </label>
                  <Input
                    type="number"
                    value={depGuestCollectAmount}
                    onChange={(e) => setDepGuestCollectAmount(Number(e.target.value))}
                    className="text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    2. Sisa Uang Modal Belanja / Tiket yang Dikembalikan Driver
                  </label>
                  <Input
                    type="number"
                    value={depModalRefundAmount}
                    onChange={(e) => setDepModalRefundAmount(Number(e.target.value))}
                    className="text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    3. Pengeluaran Talangan BBM / Parkir Driver (Dipotong dari Setoran)
                  </label>
                  <Input
                    type="number"
                    value={depFuelExpenseDeduction}
                    onChange={(e) => setDepFuelExpenseDeduction(Number(e.target.value))}
                    className="text-xs font-semibold text-rose-600"
                  />
                </div>

                {/* Auto Nett Summary Box */}
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold block">Uang Fisik Diterima Kasir (Nett):</span>
                    <span className="text-[11px] text-emerald-800">
                      Guest Collect + Sisa Modal − Talangan BBM
                    </span>
                  </div>
                  <span className="font-heading font-black text-xl text-emerald-900">
                    {formatCurrency(depGuestCollectAmount + depModalRefundAmount - depFuelExpenseDeduction)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Catatan Setoran</label>
                <Input
                  placeholder="Contoh: Uang tunai diserahkan lengkap di kantor kasir"
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDepositModalOpen(false)}>
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                  Simpan &amp; Terbitkan Nota Setor
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 3: BUAT SLIP GAJI DRIVER 2-MINGGUAN */}
      {/* ========================================================================= */}
      <Dialog open={isDriverSlipModalOpen} onOpenChange={setIsDriverSlipModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Buat Slip Gaji Driver 2-Mingguan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Hitung fee supir, transport allowance (Jasa Transport Saja vs Paket All-In), komisi, dan potongan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDriverSlip} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Pilih Driver *</label>
              <select
                required
                value={slipDriverId}
                onChange={(e) => setSlipDriverId(e.target.value)}
                className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
              >
                <option value="">-- Pilih Driver Penerima --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.user?.name || d.licenseNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Periode Mulai *</label>
                <Input
                  type="date"
                  required
                  value={slipPeriodStart}
                  onChange={(e) => setSlipPeriodStart(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Periode Akhir *</label>
                <Input
                  type="date"
                  required
                  value={slipPeriodEnd}
                  onChange={(e) => setSlipPeriodEnd(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Kategori Layanan *</label>
                <select
                  value={slipPackageType}
                  onChange={(e) => setSlipPackageType(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="TRANSPORT_ONLY">Jasa Transport Saja (Transport Only)</option>
                  <option value="ALL_IN">Paket Lengkap (All-In)</option>
                  <option value="MIXED">Campuran (Mixed Trips)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Jumlah Trip Selesai *</label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={slipTotalTrips}
                  onChange={(e) => setSlipTotalTrips(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Total Gaji / Jasa Supir (Rp) *</label>
                <Input
                  type="number"
                  required
                  value={slipDriverFee}
                  onChange={(e) => setSlipDriverFee(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Kompensasi BBM &amp; Transport (Rp)</label>
                <Input
                  type="number"
                  value={slipTransportAllowance}
                  onChange={(e) => setSlipTransportAllowance(Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Bonus / Komisi Toko (Rp)</label>
                <Input
                  type="number"
                  value={slipBonus}
                  onChange={(e) => setSlipBonus(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Potongan / Pinjaman (Rp)</label>
                <Input
                  type="number"
                  value={slipDeductions}
                  onChange={(e) => setSlipDeductions(Number(e.target.value))}
                  className="text-xs text-rose-600"
                />
              </div>
            </div>

            {/* Total Net calculation */}
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block">Gaji Bersih Driver (Net Pay):</span>
                <span className="text-[10px] text-slate-400">Jasa + Transport + Bonus − Potongan</span>
              </div>
              <span className="font-heading font-black text-lg text-emerald-400">
                {formatCurrency(slipDriverFee + slipTransportAllowance + slipBonus - slipDeductions)}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsDriverSlipModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#00677d] text-white font-bold rounded-xl gap-1.5"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Terbitkan Slip Gaji (Draft)
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: BUAT SLIP VENDOR 2-MINGGUAN */}
      {/* ========================================================================= */}
      <Dialog open={isVendorSlipModalOpen} onOpenChange={setIsVendorSlipModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Buat Rekap Tagihan Vendor 2-Mingguan
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pencatatan tagihan tiket atraksi, sewa armada luar/jeep, atau retribusi parkir VIP.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveVendorSlip} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Nama Vendor Rekanan *</label>
                <Input
                  required
                  placeholder="Contoh: Pengelola Goa Pindul"
                  value={vndName}
                  onChange={(e) => setVndName(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Kategori Layanan *</label>
                <select
                  value={vndCategory}
                  onChange={(e) => setVndCategory(e.target.value as any)}
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800"
                >
                  <option value="TICKET">Tiket Masuk Wisata</option>
                  <option value="RENTAL_JEEP">Sewa Jeep / Armada Luar</option>
                  <option value="PARKING_VIP">Parkir VIP &amp; Retribusi</option>
                  <option value="OTHER">Lainnya</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Periode Mulai *</label>
                <Input
                  type="date"
                  required
                  value={vndPeriodStart}
                  onChange={(e) => setVndPeriodStart(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Periode Akhir *</label>
                <Input
                  type="date"
                  required
                  value={vndPeriodEnd}
                  onChange={(e) => setVndPeriodEnd(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Jumlah Tiket / Item</label>
                <Input
                  type="number"
                  value={vndTotalItems}
                  onChange={(e) => setVndTotalItems(Number(e.target.value))}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">Total Tagihan (Rp) *</label>
                <Input
                  type="number"
                  required
                  value={vndTotalAmount}
                  onChange={(e) => setVndTotalAmount(Number(e.target.value))}
                  className="text-xs font-bold text-rose-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 block">Catatan Tambahan</label>
              <Input
                placeholder="Contoh: Pembayaran transfer BCA tagihan periode 1"
                value={vndNotes}
                onChange={(e) => setVndNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsVendorSlipModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-[#00677d] text-white font-bold rounded-xl gap-1.5"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Terbitkan Rekap Vendor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: CETAK / PREVIEW SLIP GAJI & NOTA RESMI */}
      {/* ========================================================================= */}
      {viewSlipModal && (
        <Dialog open={Boolean(viewSlipModal)} onOpenChange={(open) => !open && setViewSlipModal(null)}>
          <DialogContent className="max-w-md bg-white p-6 rounded-3xl">
            <div className="space-y-4 text-slate-900 font-sans">
              {/* SLIP HEADER */}
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                <h3 className="font-heading font-black text-base text-[#00677d]">SHARE TRIP JOGJA</h3>
                <p className="text-[11px] text-slate-500">PT. Wisata Kolaborasi Indonesia</p>
                <Badge variant="outline" className="text-[10px] font-mono font-bold">
                  {viewSlipModal.data.slipNumber}
                </Badge>
              </div>

              {/* SLIP DETAILS */}
              <div className="space-y-2 text-xs">
                {viewSlipModal.type === "driver" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Driver:</span>
                      <span className="font-bold">{viewSlipModal.data.driverName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Periode:</span>
                      <span>{formatDate(viewSlipModal.data.periodStart)} - {formatDate(viewSlipModal.data.periodEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jenis Layanan:</span>
                      <span className="font-semibold">{viewSlipModal.data.packageType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Trip:</span>
                      <span>{viewSlipModal.data.totalTrips} Trip</span>
                    </div>

                    <div className="border-t border-dashed border-slate-200 pt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gaji Jasa Supir:</span>
                        <span>{formatCurrency(viewSlipModal.data.totalDriverFee)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kompensasi BBM/Transport:</span>
                        <span>{formatCurrency(viewSlipModal.data.totalTransportAllowance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bonus / Komisi Toko:</span>
                        <span>+{formatCurrency(viewSlipModal.data.totalBonusOrCommission)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600">
                        <span>Potongan:</span>
                        <span>-{formatCurrency(viewSlipModal.data.totalDeductions)}</span>
                      </div>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm">
                      <span>TOTAL DITERIMA:</span>
                      <span className="text-emerald-700">{formatCurrency(viewSlipModal.data.netAmount)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Vendor:</span>
                      <span className="font-bold">{viewSlipModal.data.vendorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kategori:</span>
                      <span>{viewSlipModal.data.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Periode:</span>
                      <span>{formatDate(viewSlipModal.data.periodStart)} - {formatDate(viewSlipModal.data.periodEnd)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Tiket / Item:</span>
                      <span>{viewSlipModal.data.totalItems} Unit</span>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm">
                      <span>TOTAL TAGIHAN:</span>
                      <span className="text-rose-700">{formatCurrency(viewSlipModal.data.totalAmount)}</span>
                    </div>
                  </>
                )}

                <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
                  Status Dokumen: <strong>{viewSlipModal.data.status}</strong> · Dicetak pada {new Date().toLocaleString("id-ID")}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
                <Button type="button" variant="outline" size="sm" onClick={() => setViewSlipModal(null)}>
                  Tutup
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePrintSlip}
                  className="bg-[#00677d] text-white font-bold rounded-xl gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  Cetak Dokumen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

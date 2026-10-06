"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Sparkles,
  Building,
  Zap,
  Users,
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Car,
  Receipt,
  DollarSign,
  TrendingDown,
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
import { FinanceNavTabs } from "@/src/components/admin/finance/finance-nav-tabs";
import type { FinanceTransaction, Vehicle } from "@/src/types";

export default function OperationalFinancePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formCategory, setFormCategory] = useState<string>("OP_MAINTENANCE");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formVehicleId, setFormVehicleId] = useState<string>("");
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>("TRANSFER");
  const [formTransactionDate, setFormTransactionDate] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");

  const initDates = useCallback(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(1); // 1st day of current month

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    setFormTransactionDate(new Date().toISOString().split("T")[0]);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      // Fetch operational expenses (OUTFLOW with operational categories)
      const res = await financeService.getTransactions({
        type: "OUTFLOW",
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });

      // Filter only operational & maintenance categories
      const opCategories = [
        "OP_ADMIN_SALARY",
        "OP_CAR_WASH",
        "OP_RENT",
        "OP_UTILITIES",
        "OP_MAINTENANCE",
        "OTHER_EXPENSE",
      ];

      const opTx = (res.data || []).filter((tx) =>
        opCategories.includes(tx.category)
      );

      setTransactions(opTx);

      // Load vehicles list for armada dropdown
      const vehiclesData = await adminService.getVehicles();
      setVehicles(vehiclesData || []);
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memuat daftar biaya operasional.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    initDates();
    loadData();
  }, [initDates, loadData]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      alert("Nominal biaya harus lebih dari Rp 0");
      return;
    }
    if (!formDescription.trim()) {
      alert("Keterangan pengeluaran wajib diisi");
      return;
    }

    setIsSubmitting(true);
    try {
      await financeService.createTransaction({
        type: "OUTFLOW",
        category: formCategory,
        amount: Number(formAmount),
        vehicleId: formVehicleId || undefined,
        paymentMethod: formPaymentMethod,
        transactionDate: formTransactionDate ? new Date(formTransactionDate).toISOString() : new Date().toISOString(),
        description: formDescription.trim(),
        status: "COMPLETED",
      });

      setIsExpenseModalOpen(false);
      setFormAmount(0);
      setFormDescription("");
      setFormVehicleId("");
      setActionFeedback({
        type: "success",
        message: "Biaya operasional berhasil dicatat.",
      });
      await loadData();
    } catch (err: any) {
      alert(err?.message || "Gagal mencatat biaya operasional");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (categoryFilter && tx.category !== categoryFilter) return false;
    if (vehicleFilter && tx.vehicleId !== vehicleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description?.toLowerCase().includes(q);
      const matchCode = tx.transactionNumber?.toLowerCase().includes(q);
      const matchVehicle = tx.vehiclePlate?.toLowerCase().includes(q);
      if (!matchDesc && !matchCode && !matchVehicle) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalExpenses = filteredTransactions.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0
  );
  const maintenanceExpenses = transactions
    .filter((tx) => tx.category === "OP_MAINTENANCE")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const washExpenses = transactions
    .filter((tx) => tx.category === "OP_CAR_WASH")
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const officeExpenses = transactions
    .filter((tx) =>
      ["OP_ADMIN_SALARY", "OP_RENT", "OP_UTILITIES"].includes(tx.category)
    )
    .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "OP_MAINTENANCE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Wrench className="w-3 h-3" /> Servis / Ganti Oli
          </span>
        );
      case "OP_CAR_WASH":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Sparkles className="w-3 h-3" /> Cuci Mobil
          </span>
        );
      case "OP_ADMIN_SALARY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Users className="w-3 h-3" /> Gaji Admin / Staff
          </span>
        );
      case "OP_RENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Building className="w-3 h-3" /> Sewa Tempat / Pool
          </span>
        );
      case "OP_UTILITIES":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Zap className="w-3 h-3" /> Listrik / Wifi / Air
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Receipt className="w-3 h-3" /> Operasional Lainnya
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wrench className="w-7 h-7 text-[#00677d]" />
            Biaya Operasional & Log Armada
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pencatatan beban operasional kantor (gaji admin, sewa, utilitas) serta pemeliharaan armada (servis berkala, ganti oli, cuci armada).
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
            onClick={() => setIsExpenseModalOpen(true)}
            className="bg-[#00677d] hover:bg-[#005264] text-white flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            + Catat Biaya Operasional
          </Button>
        </div>
      </div>

      {/* Reusable Horizontal Sub-menu Navigation */}
      <FinanceNavTabs />

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

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Beban Terpilih
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dari {filteredTransactions.length} transaksi operasional
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Servis & Ganti Oli
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(maintenanceExpenses)}
          </p>
          <p className="text-xs text-amber-600 mt-1">Pemeliharaan fisik armada</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Cuci & Kebersihan
            </span>
            <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(washExpenses)}
          </p>
          <p className="text-xs text-cyan-600 mt-1">Standar kebersihan trip</p>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Kantor, Sewa & Gaji Admin
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {formatCurrency(officeExpenses)}
          </p>
          <p className="text-xs text-purple-600 mt-1">Operasional tetap bulanan</p>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari transaksi, keterangan, atau plat nomor..."
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
              <option value="OP_MAINTENANCE">Servis / Ganti Oli</option>
              <option value="OP_CAR_WASH">Cuci Mobil</option>
              <option value="OP_ADMIN_SALARY">Gaji Admin / Staff</option>
              <option value="OP_RENT">Sewa Tempat / Pool</option>
              <option value="OP_UTILITIES">Listrik / Wifi / Air</option>
              <option value="OTHER_EXPENSE">Pengeluaran Lainnya</option>
            </select>

            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#00677d]"
            >
              <option value="">Semua Armada</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plateNumber} ({v.name || v.vehicleType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00677d] mb-2" />
            <p className="text-sm">Memuat daftar biaya operasional...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Belum ada pengeluaran operasional</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || categoryFilter || vehicleFilter
                ? "Tidak ada data yang cocok dengan kriteria filter saat ini."
                : "Klik '+ Catat Biaya Operasional' untuk mencatat biaya servis, ganti oli, cuci, atau gaji admin."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Tanggal & Ref</th>
                  <th className="py-3.5 px-4">Kategori Beban</th>
                  <th className="py-3.5 px-4">Armada Terkait</th>
                  <th className="py-3.5 px-4">Keterangan / Rincian</th>
                  <th className="py-3.5 px-4 text-center">Metode</th>
                  <th className="py-3.5 px-4 text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {formatDate(tx.transactionDate || tx.createdAt)}
                      </div>
                      <div className="text-xs font-mono text-slate-500 mt-0.5">
                        {tx.transactionNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getCategoryBadge(tx.category)}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.vehiclePlate ? (
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Car className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tx.vehiclePlate}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Umum / Kantor</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 text-sm max-w-xs">
                      <p className="truncate" title={tx.description || ""}>
                        {tx.description || "-"}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        {tx.paymentMethod || "TRANSFER"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-rose-600">
                        - {formatCurrency(tx.amount)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Catat Biaya Operasional */}
      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="max-w-lg bg-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#00677d]" />
              Catat Pengeluaran Operasional & Armada
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Input biaya servis berkala, ganti oli, cuci armada, sewa pool, utilitas, atau gaji admin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Pengeluaran *
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              >
                <option value="OP_MAINTENANCE">Servis Rutin / Ganti Oli Armada</option>
                <option value="OP_CAR_WASH">Biaya Cuci Mobil / Armada</option>
                <option value="OP_ADMIN_SALARY">Gaji Admin / Staff Operasional</option>
                <option value="OP_RENT">Sewa Kantor / Pool Armada</option>
                <option value="OP_UTILITIES">Listrik, Wifi, & Air Kantor</option>
                <option value="OTHER_EXPENSE">Pengeluaran Operasional Lainnya</option>
              </select>
            </div>

            {(formCategory === "OP_MAINTENANCE" || formCategory === "OP_CAR_WASH") && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Armada / Mobil Terkait
                </label>
                <select
                  value={formVehicleId}
                  onChange={(e) => setFormVehicleId(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="">-- Pilih Armada Terkait --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} - {v.name || v.vehicleType}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nominal Biaya (Rp) *
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1000"
                  value={formAmount || ""}
                  onChange={(e) => setFormAmount(Number(e.target.value))}
                  placeholder="0"
                  required
                  className="text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={formPaymentMethod}
                  onChange={(e) => setFormPaymentMethod(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                >
                  <option value="TRANSFER">Transfer Bank</option>
                  <option value="CASH">Kas Tunai (Petty Cash)</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi *
              </label>
              <Input
                type="date"
                value={formTransactionDate}
                onChange={(e) => setFormTransactionDate(e.target.value)}
                required
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Rincian Pengeluaran *
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="cth: Ganti oli mesin Shell Helix 4L + filter oli Avanza AB 1234 CD di Bengkel Resmi"
                rows={3}
                required
                className="w-full text-sm border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#00677d]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseModalOpen(false)}
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
                ) : (
                  "Simpan Pengeluaran"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

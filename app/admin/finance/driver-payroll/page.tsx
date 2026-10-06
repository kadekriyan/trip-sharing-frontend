"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Eye,
  Check,
  Building2,
  Wallet,
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
import { PrintSlipModal } from "@/src/components/admin/finance/print-slip-modal";
import type { DriverSettlementSlip, Driver } from "@/src/types";

export default function DriverPayrollPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [driverSlips, setDriverSlips] = useState<DriverSettlementSlip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [isDriverSlipModalOpen, setIsDriverSlipModalOpen] = useState(false);
  const [viewSlipModal, setViewSlipModal] = useState<{ type: "driver" | "vendor" | "deposit"; data: any } | null>(null);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initDates = useCallback(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const fifteenthDay = new Date(now.getFullYear(), now.getMonth(), 15).toISOString().split("T")[0];
    setSlipPeriodStart(firstDay);
    setSlipPeriodEnd(fifteenthDay);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dSlipsData, drvList] = await Promise.all([
        financeService.getDriverSlips(undefined, statusFilter || undefined),
        adminService.getDrivers(),
      ]);
      setDriverSlips(dSlipsData || []);
      setDrivers(drvList || []);
    } catch (err: any) {
      console.error("Failed loading driver payroll slips", err);
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memuat slip payroll driver.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    initDates();
  }, [initDates]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const netSalaryAmount =
    Number(slipDriverFee || 0) +
    Number(slipTransportAllowance || 0) +
    Number(slipBonus || 0) -
    Number(slipDeductions || 0);

  const handleCreateDriverSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipDriverId) {
      setActionFeedback({ type: "error", message: "Wajib memilih supir/driver." });
      return;
    }

    setIsSubmitting(true);
    try {
      const resSlip = await financeService.createDriverSlip({
        driverId: slipDriverId,
        periodStart: slipPeriodStart,
        periodEnd: slipPeriodEnd,
        packageType: slipPackageType,
        totalTrips: Number(slipTotalTrips),
        totalDriverFee: Number(slipDriverFee),
        totalTransportAllowance: Number(slipTransportAllowance),
        totalBonusOrCommission: Number(slipBonus),
        totalDeductions: Number(slipDeductions),
        netAmount: netSalaryAmount,
        notes: slipNotes || undefined,
      });

      setIsDriverSlipModalOpen(false);
      setActionFeedback({
        type: "success",
        message: `Slip gaji driver ${resSlip.slipNumber} berhasil dibuat (Status: DRAFT).`,
      });
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal membuat slip payroll driver.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDriverSlipStatus = async (id: string, newStatus: string) => {
    try {
      const updated = await financeService.updateDriverSlipStatus(id, { status: newStatus });
      setActionFeedback({
        type: "success",
        message: `Status slip gaji ${updated.slipNumber} berhasil diperbarui ke ${newStatus}.`,
      });
      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memperbarui status slip.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-[#00677d] tracking-tight">
              Payroll Driver (2-Mingguan)
            </h1>
            <Badge variant="azure" className="font-mono text-xs">
              Siklus Tgl 1–15 &amp; Tgl 16–Akhir Bulan
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Penggajian supir berkala, kalkulasi paket Jasa Transport Saja vs Paket All-In, approval, dan pencairan dana.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsDriverSlipModalOpen(true)}
            className="bg-[#00677d] text-white hover:bg-[#005264] rounded-xl font-bold gap-2 text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Buat Slip Gaji 2-Mingguan
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

      {/* SLIPS TABLE */}
      <Card className="border border-slate-100 shadow-stitch-card bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Daftar Slip Gaji &amp; Kompensasi Driver
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Alur settlement: DRAFT &rarr; DRIVER_CONFIRMED &rarr; PAID (Cairkan Dana &amp; Potong Kas).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
            >
              <option value="">Semua Status</option>
              <option value="DRAFT">DRAFT (Belum Konfirmasi)</option>
              <option value="DRIVER_CONFIRMED">DRIVER_CONFIRMED (Disetujui Supir)</option>
              <option value="PAID">PAID (Telah Ditransfer / Cair)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No. Slip Gaji</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Periode</th>
                <th className="py-3 px-4">Tipe Paket</th>
                <th className="py-3 px-4 text-center">Total Trips</th>
                <th className="py-3 px-4 text-right">Total Gaji Bersih</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#00677d] mb-2" />
                    Memuat slip gaji driver...
                  </td>
                </tr>
              ) : driverSlips.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada slip gaji 2-mingguan driver yang diterbitkan.
                  </td>
                </tr>
              ) : (
                driverSlips.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00677d]">
                      {s.slipNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {s.driverName || "Driver"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDate(s.periodStart)} s/d {formatDate(s.periodEnd)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {s.packageType === "TRANSPORT_ONLY" ? "Jasa Transport Saja" : "Paket All-In"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">{s.totalTrips} Trip</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-sm">
                      {formatCurrency(s.netAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          s.status === "PAID"
                            ? "success"
                            : s.status === "DRIVER_CONFIRMED"
                            ? "azure"
                            : "warning"
                        }
                        className="text-[10px] font-bold"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewSlipModal({ type: "driver", data: s })}
                          className="h-7 text-xs font-bold gap-1 rounded-lg"
                        >
                          <Eye className="h-3 w-3" />
                          Pratinjau
                        </Button>

                        {s.status === "DRAFT" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateDriverSlipStatus(s.id, "DRIVER_CONFIRMED")}
                            className="bg-[#00677d] text-white hover:bg-[#005264] h-7 text-xs font-bold rounded-lg"
                          >
                            Konfirmasi Driver
                          </Button>
                        )}

                        {s.status === "DRIVER_CONFIRMED" && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateDriverSlipStatus(s.id, "PAID")}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 h-7 text-xs font-bold rounded-lg gap-1"
                          >
                            <Check className="h-3 w-3" />
                            Cairkan Dana (Paid)
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: CREATE DRIVER PAYROLL SLIP */}
      <Dialog open={isDriverSlipModalOpen} onOpenChange={setIsDriverSlipModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#00677d]">
              Buat Slip Rekapitulasi Gaji Driver (2-Mingguan)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Kalkulasi fee supir, paket transport, bonus, dan potongan kasbon periode berjalan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDriverSlip} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Pilih Driver / Supir *</label>
              <select
                value={slipDriverId}
                onChange={(e) => setSlipDriverId(e.target.value)}
                required
                className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
              >
                <option value="">-- Pilih Personil Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.fullName || "Driver"} ({d.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Awal Periode *</label>
                <Input
                  type="date"
                  value={slipPeriodStart}
                  onChange={(e) => setSlipPeriodStart(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Akhir Periode *</label>
                <Input
                  type="date"
                  value={slipPeriodEnd}
                  onChange={(e) => setSlipPeriodEnd(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kategori Paket *</label>
                <select
                  value={slipPackageType}
                  onChange={(e) => setSlipPackageType(e.target.value as any)}
                  className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 bg-white font-medium"
                >
                  <option value="TRANSPORT_ONLY">Jasa Transport Saja (Transport Only)</option>
                  <option value="ALL_IN">Paket All-In (Driver + BBM + Armada)</option>
                  <option value="MIXED">Campuran (Mixed)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Jumlah Perjalanan (Trip)</label>
                <Input
                  type="number"
                  min="1"
                  value={slipTotalTrips}
                  onChange={(e) => setSlipTotalTrips(Number(e.target.value) || 1)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gaji Pokok / Fee Driver (Rp)</label>
                <Input
                  type="number"
                  value={slipDriverFee}
                  onChange={(e) => setSlipDriverFee(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Paket Transport (BBM/Mobil) (Rp)</label>
                <Input
                  type="number"
                  value={slipTransportAllowance}
                  onChange={(e) => setSlipTransportAllowance(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Bonus / Komisi Toko (Rp)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={slipBonus || ""}
                  onChange={(e) => setSlipBonus(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Potongan / Kasbon (Rp)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={slipDeductions || ""}
                  onChange={(e) => setSlipDeductions(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            {/* NET SALARY DISPLAY */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-900">TOTAL GAJI AKHIR (NET):</span>
              <span className="text-base font-extrabold text-emerald-800">
                {formatCurrency(netSalaryAmount)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
              <Input
                type="text"
                placeholder="Catatan bonus atau lembur..."
                value={slipNotes}
                onChange={(e) => setSlipNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDriverSlipModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !slipDriverId}
                className="bg-[#00677d] text-white hover:bg-[#005264] font-bold rounded-xl"
              >
                {isSubmitting ? "Menerbitkan..." : "Terbitkan Slip Gaji (Draft)"}
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

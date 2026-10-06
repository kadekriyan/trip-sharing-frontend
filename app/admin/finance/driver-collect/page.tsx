"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Eye,
  Filter,
  ArrowDownLeft,
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
import type { DriverManifestSummaryItem } from "@/src/types";

export default function DriverCollectPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [driverManifests, setDriverManifests] = useState<DriverManifestSummaryItem[]>([]);
  const [selectedDriverFilter, setSelectedDriverFilter] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedManifestForDeposit, setSelectedManifestForDeposit] = useState<DriverManifestSummaryItem | null>(null);
  const [viewSlipModal, setViewSlipModal] = useState<{ type: "driver" | "vendor" | "deposit"; data: any } | null>(null);

  // Form States - Driver Deposit / Auto-Nett
  const [depGuestCollectAmount, setDepGuestCollectAmount] = useState<number>(0);
  const [depModalRefundAmount, setDepModalRefundAmount] = useState<number>(0);
  const [depFuelExpenseDeduction, setDepFuelExpenseDeduction] = useState<number>(0);
  const [depNotes, setDepNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const manifestsData = await financeService.getDriverManifests(selectedDriverFilter || undefined);
      setDriverManifests(manifestsData || []);
    } catch (err: any) {
      console.error("Failed loading driver manifests", err);
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memuat data tagihan driver.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDriverFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDepositModal = (m: DriverManifestSummaryItem) => {
    setSelectedManifestForDeposit(m);
    setDepGuestCollectAmount(m.uncollectedGuestAmount || 0);
    setDepModalRefundAmount(0);
    setDepFuelExpenseDeduction(0);
    setDepNotes("");
    setIsDepositModalOpen(true);
  };

  const netCashToDeposit = depGuestCollectAmount + depModalRefundAmount - depFuelExpenseDeduction;

  const handleProcessDriverDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManifestForDeposit) return;

    if (netCashToDeposit <= 0) {
      setActionFeedback({
        type: "error",
        message: "Nominal uang bersih disetor harus lebih besar dari 0.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const resTx = await financeService.createTransaction({
        type: "INCOME",
        category: "GUEST_COLLECT",
        amount: netCashToDeposit,
        paymentMethod: "CASH",
        driverId: selectedManifestForDeposit.driverId,
        bookingGroupId: selectedManifestForDeposit.bookingGroupId,
        tripId: selectedManifestForDeposit.tripId,
        description: `Setoran kasir manifest grup #${selectedManifestForDeposit.groupNumber} (${selectedManifestForDeposit.destinationName}) oleh driver ${selectedManifestForDeposit.driverName || "Driver"}`,
        notes: `Guest collect: ${depGuestCollectAmount}, Sisa modal: ${depModalRefundAmount}, Potongan BBM: ${depFuelExpenseDeduction}. Catatan: ${depNotes}`,
      });

      setIsDepositModalOpen(false);
      setActionFeedback({
        type: "success",
        message: `Setoran driver ${selectedManifestForDeposit.driverName} sebesar ${formatCurrency(
          netCashToDeposit
        )} berhasil dicatat lunas.`,
      });

      // Show printable deposit slip
      setViewSlipModal({
        type: "deposit",
        data: {
          ...resTx,
          driver: { fullName: selectedManifestForDeposit.driverName },
          guestCollectAmount: depGuestCollectAmount,
          modalRefundAmount: depModalRefundAmount,
          fuelExpenseDeduction: depFuelExpenseDeduction,
          status: "LUNAS",
        },
      });

      await loadData();
    } catch (err: any) {
      setActionFeedback({
        type: "error",
        message: err?.message || "Gagal memproses setoran driver.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const unsettledCount = driverManifests.filter((m) => !m.isSettled).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-[#00677d] tracking-tight">
              Tagihan &amp; Setoran Driver
            </h1>
            <Badge variant="warning" className="font-mono text-xs">
              {unsettledCount} Belum Setor
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekonsiliasi penagihan sisa pembayaran tamu di tempat, sisa modal tiket, dan penerbitan Nota Setor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-[#00677d]" : ""}`} />
            Refresh Data
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

      {/* DRIVER MANIFEST RECONCILIATION TABLE */}
      <Card className="border border-slate-100 shadow-stitch-card bg-white overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Rekonsiliasi Manifest Lapangan per Grup Trip
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik &quot;Terima Setoran&quot; untuk mengonfirmasi penerimaan uang fisik dari supir.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Grup &amp; Trip</th>
                <th className="py-3 px-4">Driver Bertugas</th>
                <th className="py-3 px-4">Tanggal Trip</th>
                <th className="py-3 px-4 text-center">Pax (Lunas / Tagih)</th>
                <th className="py-3 px-4 text-right">Tagihan Tamu Lapangan</th>
                <th className="py-3 px-4 text-center">Status Setoran</th>
                <th className="py-3 px-4 text-center">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#00677d] mb-2" />
                    Memuat manifest penagihan driver...
                  </td>
                </tr>
              ) : driverManifests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Semua manifest trip telah lunas disetorkan ke kasir operasional.
                  </td>
                </tr>
              ) : (
                driverManifests.map((m) => (
                  <tr key={m.bookingGroupId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span>Grup #{m.groupNumber}</span>
                      <span className="text-[11px] text-slate-400 block font-normal mt-0.5">
                        {m.destinationName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#00677d]" />
                        <span className="font-bold text-slate-900">{m.driverName || "Driver"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatDate(m.departureDate)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-900">{m.totalParticipants} Pax</span>
                      <span className="text-[11px] text-slate-400 block">
                        ({m.paidCount} Lunas / {m.pendingCount} Bayar di Tempat)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                      {formatCurrency(m.uncollectedGuestAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {m.isSettled ? (
                        <Badge variant="success" className="text-[10px] font-bold gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          LUNAS
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] font-bold gap-1">
                          <Clock className="h-3 w-3" />
                          BELUM SETOR
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {!m.isSettled ? (
                        <Button
                          size="sm"
                          onClick={() => openDepositModal(m)}
                          className="bg-[#00677d] text-white hover:bg-[#005264] rounded-xl font-bold text-xs gap-1.5 h-8 px-3"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                          Terima Setoran
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Telah Disetor</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: TERIMA SETORAN DRIVER (AUTO-NETT) */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-[#00677d]">
              Form Penerimaan Setoran Driver (Auto-Nett)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Grup: <strong>Grup #{selectedManifestForDeposit?.groupNumber}</strong> · Driver:{" "}
              <strong>{selectedManifestForDeposit?.driverName || "Driver"}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleProcessDriverDeposit} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Tagihan Tamu di Lapangan:</span>
                <strong className="text-sm font-bold text-slate-900">
                  {formatCurrency(depGuestCollectAmount)}
                </strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Sisa Modal Belanja Tiket (Refund)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={depModalRefundAmount || ""}
                  onChange={(e) => setDepModalRefundAmount(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Uang lebih belanja tiket dikembalikan supir
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Talangan Biaya BBM Driver (Potongan)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={depFuelExpenseDeduction || ""}
                  onChange={(e) => setDepFuelExpenseDeduction(Number(e.target.value) || 0)}
                  className="text-xs h-9"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Uang BBM yang ditalangi driver (dipotongkan)
                </span>
              </div>
            </div>

            {/* AUTO-NETT TOTAL CALCULATION */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <div className="flex justify-between items-center text-xs text-emerald-800 font-bold">
                <span>RUMUS AUTO-NETT:</span>
                <span>Tagihan + Sisa Modal - Potongan BBM</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                <span className="text-xs font-extrabold text-emerald-900 uppercase">
                  Uang Fisik Wajib Diterima Kasir:
                </span>
                <span className="text-lg font-extrabold text-emerald-800">
                  {formatCurrency(netCashToDeposit)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Catatan Setoran</label>
              <Input
                type="text"
                placeholder="Contoh: Tamu rombongan 4 orang bayar cash pas"
                value={depNotes}
                onChange={(e) => setDepNotes(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDepositModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || netCashToDeposit <= 0}
                className="bg-[#00677d] text-white hover:bg-[#005264] font-bold rounded-xl"
              >
                {isSubmitting ? "Memproses..." : "Konfirmasi & Terbitkan Nota Setor"}
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

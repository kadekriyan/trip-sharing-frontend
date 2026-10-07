"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Printer, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { formatCurrency, formatDate } from "@/src/lib/utils";

export interface PrintSlipModalProps {
  viewSlipModal: { type: "driver" | "vendor" | "deposit"; data: any } | null;
  onClose: () => void;
}

export function PrintSlipModal({ viewSlipModal, onClose }: PrintSlipModalProps) {
  const [printFormat, setPrintFormat] = useState<"thermal" | "a4">("a4");

  if (!viewSlipModal) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={!!viewSlipModal} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`max-h-[90vh] overflow-y-auto ${
          printFormat === "thermal" ? "max-w-md" : "max-w-2xl"
        } print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none`}
      >
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-extrabold text-[#00677d]">
              {viewSlipModal.type === "deposit"
                ? "Nota Penerimaan & Setoran Kasir"
                : viewSlipModal.type === "driver"
                ? "Slip Rekapitulasi Gaji Driver"
                : "Slip Settlement Tagihan Vendor"}
            </DialogTitle>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setPrintFormat("thermal")}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  printFormat === "thermal" ? "bg-white shadow-xs text-[#00677d]" : "text-slate-500"
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat("a4")}
                className={`px-2 py-1 rounded text-[11px] font-bold ${
                  printFormat === "a4" ? "bg-white shadow-xs text-[#00677d]" : "text-slate-500"
                }`}
              >
                Format A4
              </button>
            </div>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Pratinjau dokumen resmi operasional Java Shared Tour.
          </DialogDescription>
        </DialogHeader>

        {/* PRINTABLE CONTAINER */}
        <div
          id="printable-slip"
          className={`p-6 bg-white border border-slate-200 rounded-xl space-y-4 text-slate-900 ${
            printFormat === "thermal" ? "font-mono text-xs max-w-sm mx-auto" : "font-sans text-sm"
          }`}
        >
          {/* HEADER */}
          <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
            <h2 className="font-extrabold text-base tracking-tight text-[#00677d]">
              JAVA SHARED TOUR
            </h2>
            <p className="text-[11px] text-slate-500">
              Jl. Malioboro No. 45, D.I. Yogyakarta · Telp/WA: 0812-3456-7890
            </p>
            <div className="inline-block mt-1 px-2.5 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase tracking-wider text-slate-700">
              {viewSlipModal.type === "deposit"
                ? "BUKTI SETORAN DRIVER & MANIFEST"
                : viewSlipModal.type === "driver"
                ? "SLIP GAJI & TRANSPORT DRIVER"
                : "BUKTI SETTLEMENT VENDOR"}
            </div>
          </div>

          {/* METADATA */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-3">
            <div>
              <span className="text-slate-400 block text-[10px]">No. Dokumen:</span>
              <strong className="font-mono">{viewSlipModal.data.slipNumber || viewSlipModal.data.transactionNumber || "-"}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Tanggal Cetak:</span>
              <span>{formatDate(new Date().toISOString())}</span>
            </div>
            {(viewSlipModal.data.driver || viewSlipModal.data.driverName) && (
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Driver:</span>
                <strong>{viewSlipModal.data.driverName || viewSlipModal.data.driver?.fullName || viewSlipModal.data.driver?.name || "-"}</strong>
              </div>
            )}
            {viewSlipModal.data.vendorName && (
              <div>
                <span className="text-slate-400 block text-[10px]">Nama Vendor:</span>
                <strong>{viewSlipModal.data.vendorName}</strong>
              </div>
            )}
            {viewSlipModal.data.periodStart && (
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Periode:</span>
                <span>
                  {formatDate(viewSlipModal.data.periodStart)} s/d {formatDate(viewSlipModal.data.periodEnd)}
                </span>
              </div>
            )}
          </div>

          {/* RINCIAN SETORAN DRIVER */}
          {viewSlipModal.type === "deposit" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Tagihan Tamu (Collect):</span>
                <span className="font-bold">{formatCurrency(viewSlipModal.data.guestCollectAmount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Sisa Belanja Tiket/Paket (Refund):</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(viewSlipModal.data.modalRefundAmount || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Talangan Biaya BBM Driver (Potongan):</span>
                <span className="font-bold text-rose-600">-{formatCurrency(viewSlipModal.data.fuelExpenseDeduction || 0)}</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm">
                <span>TOTAL UANG BERSIH DISETOR:</span>
                <span className="text-[#00677d]">{formatCurrency(viewSlipModal.data.amount || 0)}</span>
              </div>
            </div>
          )}

          {/* RINCIAN SLIP GAJI DRIVER */}
          {viewSlipModal.type === "driver" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Paket Penggajian:</span>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {viewSlipModal.data.packageType === "TRANSPORT_ONLY" ? "Jasa Transport Saja" : "Paket All-In"}
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Perjalanan (Trips):</span>
                <span>{viewSlipModal.data.totalTrips || 0} Trip</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Gaji Pokok / Fee Driver:</span>
                <span className="font-bold">{formatCurrency(viewSlipModal.data.totalDriverFee || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Uang Jalan / Paket Transport:</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(viewSlipModal.data.totalTransportAllowance || 0)}</span>
              </div>
              {viewSlipModal.data.totalBonusOrCommission > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Bonus / Komisi Belanja:</span>
                  <span className="font-bold text-emerald-600">+{formatCurrency(viewSlipModal.data.totalBonusOrCommission)}</span>
                </div>
              )}
              {viewSlipModal.data.totalDeductions > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Potongan / Kasbon:</span>
                  <span className="font-bold text-rose-600">-{formatCurrency(viewSlipModal.data.totalDeductions)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm">
                <span>TOTAL GAJI DITERIMA:</span>
                <span className="text-emerald-700">{formatCurrency(viewSlipModal.data.netAmount || 0)}</span>
              </div>
            </div>
          )}

          {/* RINCIAN SLIP VENDOR */}
          {viewSlipModal.type === "vendor" && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Kategori Vendor:</span>
                <span className="font-bold">{viewSlipModal.data.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Total Item / Tiket:</span>
                <span>{viewSlipModal.data.totalItems || 0} Unit</span>
              </div>
              <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-bold text-sm">
                <span>TOTAL TAGIHAN:</span>
                <span className="text-rose-700">{formatCurrency(viewSlipModal.data.totalAmount || 0)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 text-center text-[10px] text-slate-400 border-t border-slate-100">
            Status Dokumen: <strong>{viewSlipModal.data.status || "CONFIRMED"}</strong> · Dicetak pada {new Date().toLocaleString("id-ID")}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="bg-[#00677d] text-white font-bold rounded-xl gap-1.5"
          >
            <Printer className="h-4 w-4" />
            Cetak Dokumen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

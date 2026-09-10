"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  MapPin,
  Car,
  User,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Building2,
  FileCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  QrCode,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { bookingService } from "@/src/services/booking.service";
import { formatCurrency, formatDate, parsePickupLocation } from "@/src/lib/utils";
import type { InvoiceData } from "@/src/types";

export default function BookingInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const identifier = Array.isArray(params?.identifier)
    ? params.identifier[0]
    : (params?.identifier as string) || "";

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadInvoice() {
      if (!identifier) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await bookingService.getBookingInvoice(identifier);
        if (isMounted) {
          setInvoice(data);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Faktur tidak ditemukan atau terjadi kendala saat memuat data."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInvoice();
    return () => {
      isMounted = false;
    };
  }, [identifier]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#00677d] border-t-transparent" />
        <p className="text-sm font-semibold text-slate-600">Memuat Faktur Resmi...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-5 shadow-stitch-card">
          <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-extrabold text-xl text-slate-800">Faktur Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "Kami tidak dapat menemukan data faktur untuk kode booking atau ID ini."}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button asChild className="w-full bg-[#00677d] hover:bg-[#005264] text-xs font-bold">
              <Link href="/bookings">Kembali ke Riwayat Booking</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const {
    invoice: inv,
    issuer,
    customer,
    tripDetails,
    pricing,
    paymentDetails,
    verification,
  } = invoice;

  const isPaid = inv.status.toUpperCase() === "PAID" || inv.paymentStatus === "paid";
  const isCancelled = inv.status.toUpperCase() === "CANCELLED" || inv.paymentStatus === "cancelled";
  const pickupParsed = parsePickupLocation(tripDetails.pickupLocation);

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-8 sm:py-12 print:bg-white print:py-0 print:min-h-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 print:px-0 print:max-w-none">
        {/* ACTION BAR (Hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/bookings")}
            className="text-xs font-bold gap-1.5 text-slate-600 hover:text-[#00677d]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Tiket</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="text-xs font-semibold gap-1.5 text-slate-700"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Tautan</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Cetak / Unduh PDF</span>
            </Button>
          </div>
        </div>

        {/* INVOICE PAPER CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-stitch-card p-6 sm:p-12 space-y-8 print:shadow-none print:border-none print:p-0 print:rounded-none">
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
            {/* Issuer Entity Brand */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] flex items-center justify-center text-white font-heading font-black text-lg shadow-sm">
                  TS
                </div>
                <div>
                  <h1 className="font-heading font-extrabold text-xl text-[#191c1e] tracking-tight">
                    {issuer.companyName || "TripSharing Platform"}
                  </h1>
                  <span className="text-[11px] font-semibold text-[#00677d] block">
                    {issuer.legalName || "PT Trip Sharing Nusantara"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                {issuer.address}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>Email: <strong className="text-slate-700">{issuer.supportEmail}</strong></span>
                <span>•</span>
                <span>Telp/WA: <strong className="text-slate-700">{issuer.supportPhone}</strong></span>
              </div>
            </div>

            {/* Invoice Meta & Status */}
            <div className="sm:text-right space-y-2">
              <div className="inline-block">
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border ${
                    isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isCancelled
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {isPaid ? "LUNAS / PAID" : isCancelled ? "DIBATALKAN" : "MENUNGGU PEMBAYARAN"}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                  Nomor Faktur
                </span>
                <span className="font-mono font-bold text-sm text-[#00677d] block">
                  {inv.invoiceNumber}
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>Tanggal Faktur: <strong className="text-slate-700">{formatDate(inv.invoiceDate)}</strong></div>
                {inv.paidAt && (
                  <div>Waktu Lunas: <strong className="text-emerald-700">{formatDate(inv.paidAt)}</strong></div>
                )}
                <div>Kode Booking: <strong className="font-mono text-[#00677d] font-bold">{inv.bookingCode}</strong></div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DETAILS: CUSTOMER & TRIP OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70 text-xs">
            {/* Customer Information */}
            <div className="space-y-2.5">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <User className="h-3.5 w-3.5" />
                Ditagihkan Kepada (Customer)
              </span>
              <div className="space-y-1 text-slate-600">
                <div className="text-sm font-bold text-slate-800">{customer.fullName}</div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-slate-400">NIK / Paspor:</span>
                  <strong className="text-slate-700">{customer.identityNumber || "—"}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{customer.phoneNumber || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>{customer.email || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Kewarganegaraan: </span>
                  <span className="font-medium text-slate-700">{customer.country || "Indonesia"}</span>
                </div>
              </div>
            </div>

            {/* Trip Itinerary & Driver Information */}
            <div className="space-y-2.5">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <MapPin className="h-3.5 w-3.5" />
                Rincian Destinasi & Penjemputan
              </span>
              <div className="space-y-1.5 text-slate-600">
                <div>
                  <span className="text-slate-400">Destinasi: </span>
                  <strong className="text-slate-800 font-heading text-xs">
                    {tripDetails.destinationName}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                  <span>
                    {formatDate(tripDetails.departureDate)} s.d. {formatDate(tripDetails.returnDate)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 text-[#ff7f50] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">{pickupParsed.placeName}</span>
                      {pickupParsed.address && (
                        <span className="text-[11px] text-slate-500 block">{pickupParsed.address}</span>
                      )}
                      {tripDetails.pickupNotes && (
                        <span className="text-[10px] text-amber-700 italic block mt-0.5">
                          Catatan: {tripDetails.pickupNotes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <Car className="h-3 w-3 text-[#00677d] shrink-0" />
                  <span>
                    Grup Mobil #{tripDetails.groupNumber} ({tripDetails.vehicleModel || "HiAce 6-Seater"}) • Driver: {tripDetails.driverName || "Pak Driver"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZED BILLING TABLE */}
          <div className="space-y-3">
            <span className="font-heading font-extrabold text-sm text-[#191c1e] block">
              Rincian Tagihan Layanan (Itemized Charges)
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Deskripsi Layanan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Tarif Satuan</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {pricing.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">{item.itemNumber || idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{item.description}</td>
                      <td className="py-3 px-4 text-slate-500">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[10px] font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PRICING TOTALS BREAKDOWN */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
              <div className="text-xs text-slate-500 max-w-sm space-y-1">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Garansi Kepastian & Transparansi Biaya</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Seluruh tarif sudah mencakup bahan bakar, driver as guide, tiket masuk, dan fasilitas sharing armada.
                </p>
              </div>

              <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Paket:</span>
                  <span className="font-mono font-semibold">{formatCurrency(pricing.basePrice)}</span>
                </div>
                {pricing.insuranceFee > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Premi Asuransi:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      + {formatCurrency(pricing.insuranceFee)}
                    </span>
                  </div>
                )}
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Potongan Diskon:</span>
                    <span className="font-mono font-semibold">- {formatCurrency(pricing.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Administrasi:</span>
                  <span className="font-mono font-semibold text-emerald-600">Rp 0 (Gratis)</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-extrabold text-[#191c1e]">
                  <span>Total Tagihan:</span>
                  <span className="font-heading font-extrabold text-[#00677d] text-base">
                    {formatCurrency(pricing.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT & QR VERIFICATION SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-6 border-t border-slate-200 text-xs">
            {/* Payment Summary */}
            <div className="sm:col-span-8 space-y-2">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Informasi Pembayaran & Rekonsiliasi
              </span>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kanal Pembayaran:</span>
                  <strong className="text-slate-800">{paymentDetails.paymentMethod || "Midtrans Snap Gateway"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID Gateway:</span>
                  <span className="font-mono font-bold text-[#00677d]">
                    {paymentDetails.midtransOrderId || `TRIP-${inv.bookingCode}`}
                  </span>
                </div>
                {paymentDetails.midtransTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID Transaksi Midtrans:</span>
                    <span className="font-mono text-slate-600">{paymentDetails.midtransTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Pembayaran:</span>
                  <strong className={isPaid ? "text-emerald-700 uppercase" : "text-amber-700 uppercase"}>
                    {paymentDetails.paymentStatus || inv.paymentStatus}
                  </strong>
                </div>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="sm:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-center flex flex-col items-center justify-center space-y-1.5">
              <div className="relative h-24 w-24 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Image
                  src={verification.voucherQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inv.bookingCode}`}
                  alt="QR Verifikasi"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <span className="font-mono font-extrabold text-[11px] text-[#00677d] tracking-wider">
                {inv.bookingCode}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight block">
                Pindai untuk verifikasi e-faktur resmi
              </span>
            </div>
          </div>

          {/* LEGAL DISCLAIMER / FOOTER */}
          <div className="pt-4 border-t border-slate-200 text-center space-y-1 text-[11px] text-slate-400 leading-relaxed">
            <p>
              Dokumen ini diterbitkan secara otomatis dan sah oleh sistem komputerisasi <strong>PT Trip Sharing Nusantara</strong>.
            </p>
            <p>
              Untuk pertanyaan atau klaim faktur pajak, silakan hubungi bagian finance kami di <strong className="text-slate-600">{issuer.supportEmail}</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

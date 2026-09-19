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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { bookingService } from "@/src/services/booking.service";
import { formatCurrency, formatDate, parsePickupLocation, isTripPast } from "@/src/lib/utils";
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
              : "Invoice not found or an error occurred while loading data."
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
        <p className="text-sm font-semibold text-slate-600">Loading Official Invoice...</p>
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
            <h2 className="font-heading font-extrabold text-xl text-slate-800">Invoice Not Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {error || "We could not find invoice data for this booking code or identifier."}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Button asChild className="w-full bg-[#00677d] hover:bg-[#005264] text-xs font-bold">
              <Link href="/bookings">Back to Bookings</Link>
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
  const isTripFinished = isTripPast(tripDetails.departureDate, tripDetails.returnDate) && !isCancelled;
  const pickupParsed = parsePickupLocation(tripDetails.pickupLocation);

  const rawPackageType =
    tripDetails.packageType ||
    tripDetails.package_type ||
    tripDetails.serviceType ||
    inv.packageType ||
    inv.package_type ||
    "ALL_IN";
  const isTransportOnly =
    String(rawPackageType).toUpperCase() === "TRANSPORT_ONLY" ||
    String(rawPackageType).toLowerCase() === "transport_only";

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-8 sm:py-12 print:bg-white print:py-0 print:min-h-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 print:px-0 print:max-w-none print:space-y-0">
        {/* ACTION BAR (Hidden in print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/bookings")}
            className="text-xs font-bold gap-1.5 text-slate-600 hover:text-[#00677d]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Ticket</span>
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
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Download PDF</span>
            </Button>
          </div>
        </div>

        {/* INVOICE PAPER CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-stitch-card p-6 sm:p-12 space-y-6 sm:space-y-8 print:shadow-none print:border-none print:p-0 print:space-y-2.5 print:rounded-none">
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-4 sm:gap-6 print:gap-2 border-b border-slate-200 pb-6 sm:pb-8 print:pb-2.5">
            {/* Issuer Entity Brand */}
            <div className="space-y-1.5 print:space-y-0.5">
              <div className="flex items-center gap-2.5 print:gap-2">
                <div className="h-10 w-10 print:h-8 print:w-8 rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] flex items-center justify-center text-white font-heading font-black text-lg print:text-sm shadow-sm">
                  ST
                </div>
                <div>
                  <h1 className="font-heading font-extrabold text-xl print:text-base text-[#191c1e] tracking-tight">
                    {issuer.companyName && !issuer.companyName.toLowerCase().includes("trip sharing platform")
                      ? issuer.companyName
                      : "Share Tour Jogja"}
                  </h1>
                  <span className="text-[11px] print:text-[10px] font-semibold text-[#00677d] block">
                    {issuer.tagline &&
                    !issuer.tagline.toLowerCase().includes("teman berbagi") &&
                    !issuer.tagline.toLowerCase().includes("platform petualangan")
                      ? issuer.tagline
                      : "Yogyakarta Tour & Trip Sharing Adventure Platform"}
                  </span>
                </div>
              </div>
              <p className="text-xs print:text-[10px] text-slate-500 max-w-sm leading-relaxed print:leading-tight">
                {issuer.address && !issuer.address.toLowerCase().includes("malang")
                  ? issuer.address
                  : "Tegallayang 9, RT 02, Caturharjo, Pandak Bantul, Yogyakarta, 55761"}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs print:text-[10px] text-slate-500">
                <span>
                  Email:{" "}
                  <strong className="text-slate-700">
                    {issuer.supportEmail && !issuer.supportEmail.includes("support@tripsharing.id")
                      ? issuer.supportEmail
                      : "dejaayajax@gmail.com"}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Phone/WhatsApp:{" "}
                  <strong className="text-slate-700">
                    {issuer.supportPhone && !issuer.supportPhone.includes("812-3456-7890")
                      ? issuer.supportPhone
                      : "081216916003"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Invoice Meta & Status */}
            <div className="sm:text-right print:text-right space-y-1.5 print:space-y-0.5 shrink-0">
              <div className="flex flex-wrap items-center sm:justify-end gap-1.5">
                {/* Badge Jenis Layanan Paket */}
                <span
                  className={`text-xs print:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                    isTransportOnly
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-teal-50 text-teal-800 border-teal-200"
                  }`}
                >
                  {isTransportOnly ? "TRANSPORT ONLY" : "ALL-INCLUSIVE"}
                </span>

                <span
                  className={`text-xs print:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${isPaid
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isCancelled
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                >
                  {isPaid ? "PAID" : isCancelled ? "CANCELLED" : "PAYMENT PENDING"}
                </span>

                {/* Status Pelaksanaan Trip */}
                <span
                  className={`text-xs print:text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border flex items-center gap-1 ${
                    isCancelled
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : isTripFinished
                        ? "bg-slate-100 text-slate-700 border-slate-300"
                        : "bg-sky-50 text-sky-700 border-sky-200"
                  }`}
                >
                  {isCancelled ? (
                    "TRIP CANCELLED"
                  ) : isTripFinished ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 print:text-slate-700 shrink-0" />
                      <span>TRIP COMPLETED</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3 w-3 text-sky-600 shrink-0" />
                      <span>UPCOMING TRIP</span>
                    </>
                  )}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  Invoice Number
                </span>
                <span className="font-mono font-bold text-sm print:text-xs text-[#00677d] block">
                  {inv.invoiceNumber}
                </span>
              </div>
              <div className="text-xs print:text-[10px] text-slate-500 space-y-0.5">
                <div>Invoice Date: <strong className="text-slate-700">{formatDate(inv.invoiceDate)}</strong></div>
                {inv.paidAt && (
                  <div>Paid Date: <strong className="text-emerald-700">{formatDate(inv.paidAt)}</strong></div>
                )}
                <div>Booking Code: <strong className="font-mono text-[#00677d] font-bold">{inv.bookingCode}</strong></div>
              </div>
            </div>
          </div>

          {/* TRIP COMPLETION NOTICE BANNER (WHEN EXECUTED/FINISHED) */}
          {isTripFinished && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 print:p-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs print:text-[9.5px]">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block">Tour & Travel Service Completed</span>
                  <span className="text-slate-500 text-[11px] print:text-[8.5px]">
                    The itinerary scheduled for {formatDate(tripDetails.departureDate)} has been completed successfully.
                  </span>
                </div>
              </div>
              <span className="font-mono font-extrabold text-[10px] print:text-[8.5px] px-2.5 py-1 bg-white rounded-lg border border-slate-300 text-slate-700 shrink-0 uppercase tracking-wider shadow-xs">
                STATUS: COMPLETED
              </span>
            </div>
          )}

          {/* TWO-COLUMN DETAILS: CUSTOMER & TRIP OVERVIEW (ALWAYS 2 COLUMNS IN PRINT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-6 print:gap-3 bg-slate-50/80 p-4 sm:p-5 print:p-2.5 rounded-2xl print:rounded-xl border border-slate-200/70 text-xs print:text-[10.5px]">
            {/* Customer Information (Left Column) */}
            <div className="space-y-2 print:space-y-1">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] print:text-[10px] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <User className="h-3.5 w-3.5 print:h-3 print:w-3" />
                Billed To (Customer)
              </span>
              <div className="space-y-1.5 print:space-y-0.5 text-slate-600">
                <div className="text-sm print:text-xs font-bold text-slate-800">{customer.fullName}</div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 print:h-2.5 print:w-2.5 text-slate-400 shrink-0" />
                  <span>{customer.phoneNumber || "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 print:h-2.5 print:w-2.5 text-slate-400 shrink-0" />
                  <span className="truncate">{customer.email || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Nationality: </span>
                  <span className="font-medium text-slate-700">{customer.country || customer.nationality || "Indonesia"}</span>
                </div>
                <div>
                  <span className="text-slate-400">Date of Birth: </span>
                  <span className="font-medium text-slate-700">
                    {customer.dateOfBirth || customer.date_of_birth
                      ? formatDate(customer.dateOfBirth || customer.date_of_birth || "")
                      : "— (Not provided)"}
                  </span>
                </div>
                {/* Status Asuransi Perjalanan */}
                <div className="pt-1">
                  {customer.dateOfBirth || customer.date_of_birth || customer.hasInsurance || customer.has_insurance ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                      Covered by Travel Insurance (Active Policy)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-medium">
                      <ShieldCheck className="h-3 w-3 text-slate-400 shrink-0" />
                      No Insurance (Date of Birth Not Provided)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Itinerary & Driver Information (Right Column) */}
            <div className="space-y-2 print:space-y-1">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] print:text-[10px] flex items-center gap-1.5 pb-1 border-b border-slate-200">
                <MapPin className="h-3.5 w-3.5 print:h-3 print:w-3" />
                Destination & Pickup Details
              </span>
              <div className="space-y-1 print:space-y-0.5 text-slate-600">
                <div>
                  <span className="text-slate-400">Destination: </span>
                  <strong className="text-slate-800 font-heading text-xs print:text-[11px]">
                    {tripDetails.destinationName}
                  </strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 print:h-2.5 print:w-2.5 text-slate-400 shrink-0" />
                  <span>
                    {formatDate(tripDetails.departureDate)} to {formatDate(tripDetails.returnDate)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 print:h-2.5 print:w-2.5 text-[#ff7f50] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">{pickupParsed.placeName}</span>
                      {pickupParsed.address && (
                        <span className="text-[11px] print:text-[9.5px] text-slate-500 block leading-tight">
                          {pickupParsed.address}
                        </span>
                      )}
                      {tripDetails.pickupNotes && (
                        <span className="text-[10px] print:text-[9px] text-amber-700 italic block mt-0.5">
                          Pickup Notes: {tripDetails.pickupNotes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60">
                  <Car className="h-3 w-3 print:h-2.5 print:w-2.5 text-[#00677d] shrink-0" />
                  <span className="truncate">
                    Fleet Group #{tripDetails.groupNumber} ({tripDetails.vehicleModel || "HiAce VIP"}) • Driver Assist: {tripDetails.driverName || "Assigned Driver"}
                  </span>
                </div>
                <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-slate-400">Service Type: </span>
                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] print:text-[9px] border ${
                      isTransportOnly
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-teal-50 text-teal-800 border-teal-200"
                    }`}
                  >
                    {isTransportOnly ? "Transport Only (Vehicle & Driver Assist)" : "All-Inclusive (Complete Tour Package)"}
                  </span>
                </div>
                <div className="pt-0.5">
                  <span className="text-slate-400">Service Status: </span>
                  {isCancelled ? (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[10px] print:text-[9px]">
                      Cancelled
                    </span>
                  ) : isTripFinished ? (
                    <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded text-[10px] print:text-[9px]">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded text-[10px] print:text-[9px]">
                      Scheduled & Awaiting Departure
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ITEMIZED BILLING TABLE */}
          <div className="space-y-2 sm:space-y-3 print:space-y-1.5">
            <span className="font-heading font-extrabold text-sm print:text-xs text-[#191c1e] block">
              Itemized Charges & Billing Details
            </span>
            <div className="overflow-x-auto border border-slate-200 rounded-2xl print:rounded-xl">
              <table className="w-full text-left text-xs print:text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] print:text-[9px]">
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 w-10 text-center">No</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2">Service Description</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2">Category</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-center">Qty</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {pricing.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-center font-mono text-slate-400">{item.itemNumber || idx + 1}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 font-semibold text-slate-800">
                        <div>{item.description}</div>
                        <span className="text-[10px] print:text-[8.5px] text-slate-400 block font-normal mt-0.5">
                          {isTransportOnly
                            ? "Facility: VIP HiAce Passenger Seat + Driver Assist + Fuel (Admission tickets not included)"
                            : "Facility: Admission Tickets + VIP HiAce Passenger Seat + Driver Assist + Fuel"}
                        </span>
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-slate-500">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] print:text-[8.5px] font-semibold ${
                            isTransportOnly
                              ? "bg-amber-100/70 text-amber-800 border border-amber-200/60"
                              : "bg-teal-100/70 text-teal-800 border border-teal-200/60"
                          }`}
                        >
                          {item.category || (isTransportOnly ? "Transport Only" : "All-In Package")}
                        </span>
                      </td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-center">{item.quantity}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-3 sm:py-3 sm:px-4 print:py-1 print:px-2 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PRICING TOTALS BREAKDOWN */}
            <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-3 sm:gap-4 print:gap-2 pt-1">
              <div className="text-xs print:text-[9.5px] text-slate-500 max-w-sm space-y-0.5">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Guaranteed Price & Cost Transparency</span>
                </div>
                <p className="text-[11px] print:text-[9px] leading-relaxed print:leading-tight text-slate-400">
                  {isTransportOnly
                    ? "Rate includes fuel, fleet operations, and Driver Assist support. Destination admission tickets and personal expenses are paid independently by the traveler."
                    : "All rates include vehicle fuel, Driver Assist, destination admission tickets, and full fleet sharing facilities."}
                </p>
              </div>

              <div className="w-full sm:w-72 print:w-64 bg-slate-50 p-3 sm:p-4 print:p-2 rounded-2xl print:rounded-xl border border-slate-200 space-y-1.5 print:space-y-0.5 text-xs print:text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>Package Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(pricing.basePrice)}</span>
                </div>
                {Boolean(pricing.insuranceFee && pricing.insuranceFee > 0) && (
                  <div className="flex justify-between text-slate-600">
                    <span>Insurance Premium:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      + {formatCurrency(pricing.insuranceFee)}
                    </span>
                  </div>
                )}
                {pricing.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount / Voucher:</span>
                    <span className="font-mono font-semibold">- {formatCurrency(pricing.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Administrative Fee:</span>
                  <span className="font-mono font-semibold text-emerald-600">Rp 0 (Free)</span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center text-sm print:text-xs font-extrabold text-[#191c1e]">
                  <span>Total Amount Due:</span>
                  <span className="font-heading font-extrabold text-[#00677d] text-base print:text-xs">
                    {formatCurrency(pricing.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT & QR VERIFICATION SECTION */}
          <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-4 sm:gap-6 print:gap-2.5 pt-4 sm:pt-6 print:pt-2 border-t border-slate-200 text-xs print:text-[10px]">
            {/* Payment Summary (8 cols) */}
            <div className="sm:col-span-8 print:col-span-8 space-y-1.5 print:space-y-0.5">
              <span className="font-bold text-[#00677d] uppercase tracking-wider text-[11px] print:text-[9.5px] flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5 print:h-3 print:w-3" />
                Payment Information & Settlement
              </span>
              <div className="bg-slate-50 p-3 sm:p-3.5 print:p-2 rounded-xl border border-slate-200/70 space-y-1 print:space-y-0.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Method / Gateway:</span>
                  <strong className="text-slate-800">{paymentDetails.paymentMethod || "Midtrans Snap Gateway"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway Order ID:</span>
                  <span className="font-mono font-bold text-[#00677d]">
                    {paymentDetails.midtransOrderId || `TRIP-${inv.bookingCode}`}
                  </span>
                </div>
                {paymentDetails.midtransTransactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Midtrans Transaction ID:</span>
                    <span className="font-mono text-slate-600">{paymentDetails.midtransTransactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <strong className={isPaid ? "text-emerald-700 uppercase" : "text-amber-700 uppercase"}>
                    {paymentDetails.paymentStatus || inv.paymentStatus}
                  </strong>
                </div>
              </div>
            </div>

            {/* QR Verification Box (4 cols) */}
            <div className="sm:col-span-4 print:col-span-4 bg-slate-50 p-2.5 sm:p-3.5 print:p-1.5 rounded-xl border border-slate-200/70 text-center flex flex-col items-center justify-center space-y-1 print:space-y-0.5">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 print:h-14 print:w-14 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                <Image
                  src={verification.voucherQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${inv.bookingCode}`}
                  alt="Verification QR Code"
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              <span className="font-mono font-extrabold text-[11px] print:text-[9px] text-[#00677d] tracking-wider">
                {inv.bookingCode}
              </span>
              <span className="text-[10px] print:text-[8px] text-slate-400 leading-tight block">
                Scan to verify official electronic invoice
              </span>
            </div>
          </div>

          {/* LEGAL DISCLAIMER / FOOTER */}
          <div className="pt-3 sm:pt-4 print:pt-1.5 border-t border-slate-200 text-center space-y-0.5 text-[11px] print:text-[8.5px] text-slate-400 leading-tight">
            <p>
              This document is officially generated and validated by the computerized system of <strong>Share Tour Jogja</strong>.
            </p>
            <p>
              For invoice inquiries or support, please contact our customer service at{" "}
              <strong className="text-slate-600">
                {issuer.supportEmail && !issuer.supportEmail.includes("support@tripsharing.id")
                  ? issuer.supportEmail
                  : "dejaayajax@gmail.com"}
              </strong>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

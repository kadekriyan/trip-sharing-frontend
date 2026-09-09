"use client";

import { parsePickupLocation } from "@/src/lib/utils";

export interface TicketPrintPayload {
  bookingCode: string;
  destinationTitle: string;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  identityNumber?: string;
  groupNumber?: number | string;
  driverName?: string;
  vehicleModel?: string;
  plateNumber?: string;
  departureDate?: string;
  totalAmount?: number | string;
  pickupLocation?: string;
  pickupNotes?: string;
}

/**
 * Prints a clean, compact single-card physical ticket voucher (Boarding Pass format)
 * via an isolated hidden iframe.
 */
export function printTicketVoucher(data: TicketPrintPayload): void {
  if (typeof window === "undefined") return;

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    data.bookingCode || ""
  )}`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>E-Voucher Tiket - ${data.bookingCode}</title>
  <style>
    @page {
      size: auto;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 10px;
      color: #1e293b;
    }
    .ticket-card {
      width: 380px;
      max-width: 380px;
      background: #ffffff;
      border: 1.5px dashed #94a3b8;
      border-radius: 16px;
      overflow: hidden;
      margin: 0 auto;
    }
    .ticket-header {
      background: #00677d;
      color: #ffffff;
      padding: 18px 16px;
      text-align: center;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      color: #ffffff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      border-radius: 9999px;
      margin-bottom: 6px;
    }
    .title {
      font-size: 17px;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 11px;
      color: #e0f2fe;
    }
    .ticket-body {
      padding: 18px 16px;
      text-align: center;
    }
    .qr-container {
      background: #f8fafc;
      border: 1.5px dashed #cbd5e1;
      border-radius: 12px;
      padding: 10px;
      display: inline-block;
      margin-bottom: 14px;
    }
    .qr-image {
      width: 125px;
      height: 125px;
      display: block;
      margin: 0 auto;
    }
    .booking-code {
      font-family: monospace;
      font-size: 13px;
      font-weight: 800;
      color: #00677d;
      letter-spacing: 2px;
      margin-top: 6px;
      display: block;
    }
    .details-table {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
      text-align: left;
      font-size: 11px;
      margin-bottom: 14px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .detail-row + .detail-row {
      border-top: 1px solid #f1f5f9;
    }
    .detail-label {
      color: #64748b;
    }
    .detail-val {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }
    .val-paid {
      color: #059669;
      text-transform: uppercase;
    }
    .footer-note {
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.4;
      border-top: 1px dashed #cbd5e1;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="ticket-card">
    <div class="ticket-header">
      <span class="badge">Official E-Voucher</span>
      <div class="title">${data.destinationTitle || "Trip Sharing Platform"}</div>
      <div class="subtitle">Platform Wisata Patungan Berkelompok</div>
    </div>
    <div class="ticket-body">
      <div class="qr-container">
        <img class="qr-image" src="${qrUrl}" alt="QR Code" />
        <span class="booking-code">${data.bookingCode}</span>
      </div>

      <div class="details-table">
        <div class="detail-row">
          <span class="detail-label">Nama Penumpang</span>
          <span class="detail-val">${data.fullName}</span>
        </div>
        ${
          data.identityNumber && data.identityNumber !== "-"
            ? `
        <div class="detail-row">
          <span class="detail-label">Nomor Identitas (NIK)</span>
          <span class="detail-val font-mono">${data.identityNumber}</span>
        </div>
        `
            : ""
        }
        ${
          data.phoneNumber
            ? `
        <div class="detail-row">
          <span class="detail-label">No. Telepon / WA</span>
          <span class="detail-val">${data.phoneNumber}</span>
        </div>
        `
            : ""
        }
        ${
          data.email
            ? `
        <div class="detail-row">
          <span class="detail-label">Email Penumpang</span>
          <span class="detail-val" style="font-size: 10px; max-width: 200px; word-break: break-all;">${data.email}</span>
        </div>
        `
            : ""
        }
        ${
          data.departureDate
            ? `
        <div class="detail-row">
          <span class="detail-label">Tanggal Booking</span>
          <span class="detail-val">${data.departureDate}</span>
        </div>
        `
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Status Pembayaran</span>
          <span class="detail-val val-paid">Lunas (PAID)</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Alokasi Grup</span>
          <span class="detail-val">Grup #${data.groupNumber || 1} (Maks 6 Pax)</span>
        </div>
        ${
          data.driverName
            ? `
        <div class="detail-row">
          <span class="detail-label">Driver & Armada</span>
          <span class="detail-val">${data.driverName} ${
                data.vehicleModel ? `(${data.vehicleModel})` : ""
              }</span>
        </div>
        `
            : ""
        }
        ${
          data.pickupLocation
            ? (() => {
                const parsed = parsePickupLocation(data.pickupLocation);
                return `
        <div class="detail-row" style="flex-direction: column; align-items: flex-start; gap: 2px;">
          <div style="display: flex; justify-content: space-between; width: 100%;">
            <span class="detail-label">Lokasi Jemput</span>
            <span class="detail-val" style="color: #00677d; font-weight: 800;">${parsed.placeName}</span>
          </div>
          ${parsed.address ? `<div style="font-size: 10px; color: #64748b; text-align: right; width: 100%;">${parsed.address}</div>` : ""}
        </div>
        `;
              })()
            : ""
        }
        ${
          data.pickupNotes
            ? `
        <div class="detail-row">
          <span class="detail-label">Catatan Jemput</span>
          <span class="detail-val" style="max-width: 210px; word-break: break-word; font-style: italic; color: #475569;">${data.pickupNotes}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="footer-note">
        Tunjukkan kode QR e-voucher ini kepada Driver saat penjemputan armada.
      </div>
    </div>
  </div>
</body>
</html>`;

  // Use hidden iframe to isolate the print document completely
  let iframe = document.getElementById("print-ticket-iframe") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "print-ticket-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait for QR image to load before triggering print with fallback safety
  const img = doc.querySelector(".qr-image") as HTMLImageElement | null;
  let printed = false;
  const triggerPrint = () => {
    if (printed) return;
    printed = true;
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      window.print();
    }
  };

  if (img) {
    img.onload = () => setTimeout(triggerPrint, 100);
    img.onerror = () => triggerPrint();
  }
  setTimeout(triggerPrint, 400);
}

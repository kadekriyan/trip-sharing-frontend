"use client";

import { formatDate, formatCurrency, getDestinationTitle, parsePickupLocation } from "@/src/lib/utils";
import type { BookingGroup, Participant } from "@/src/types";

function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function calculateAgeYears(dobStr?: string | null): string {
  if (!dobStr) return "-";
  const birthDate = new Date(dobStr);
  if (isNaN(birthDate.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} Thn` : "-";
}

/**
 * Prints or exports A4 Passenger Manifest & Operational Driver Waybill (Surat Jalan Driver)
 * via an isolated hidden iframe.
 */
export function printGroupManifest(group: BookingGroup): void {
  if (typeof window === "undefined") return;

  const dest = group.trip?.destination;
  const destTitle = getDestinationTitle(dest);
  const destLocation = dest?.location || "Yogyakarta & Sekitarnya";
  const departureDate = group.trip?.departureDate ? formatDate(group.trip.departureDate) : "-";
  const returnDate = group.trip?.returnDate ? formatDate(group.trip.returnDate) : "-";
  const meetingPoint = dest?.meetingPoint || group.trip?.notes || "Titik Kumpul / Penjemputan Area Terdaftar";

  const groupNumber = group.groupNumber || 1;
  const currentPax = group.currentParticipants || group.participants?.length || 0;
  const maxPax = group.capacity || group.maxParticipants || 6;

  // Driver details
  const driver = group.driver;
  const driverName = driver?.fullName || driver?.name || "(Belum Ditugaskan)";
  const driverPhone = driver?.phoneNumber || driver?.phone || "-";
  const driverLicense = driver?.licenseNumber ? `SIM: ${driver.licenseNumber}` : "-";

  // Vehicle details
  const assignedVehicle = group.vehicle || group.driver?.vehicle;
  const vehicleName =
    assignedVehicle?.name ||
    group.driver?.vehicleModel ||
    group.driver?.vehicleType ||
    "(Belum Ditugaskan)";
  const vehiclePlate =
    assignedVehicle?.plateNumber ||
    assignedVehicle?.plate_number ||
    group.driver?.plateNumber ||
    group.driver?.vehiclePlat ||
    "NO-PLATE";
  const vehicleTrans = assignedVehicle?.transmission || "Manual";
  const vehicleFuel = assignedVehicle?.fuelType || assignedVehicle?.fuel_type || "Diesel";
  const vehicleCapacity = assignedVehicle?.capacity || maxPax || 6;

  const participants: Participant[] = group.participants || [];
  const printDate = new Date().toLocaleString("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const manifestDocNumber = `SJ-ARM-${String(group.id || "").slice(0, 8).toUpperCase()}-${new Date().getFullYear()}`;

  const rowsHtml =
    participants.length === 0
      ? `<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748b; font-style: italic;">Belum ada data penumpang terdaftar di armada ini.</td></tr>`
      : participants
          .map((p, idx) => {
            const pRec = p as unknown as Record<string, unknown>;
            const pUser = (pRec.user && typeof pRec.user === "object") ? (pRec.user as Record<string, unknown>) : undefined;
            const pCust = (pRec.customer && typeof pRec.customer === "object") ? (pRec.customer as Record<string, unknown>) : undefined;

            const fullName = escapeHtml(p.fullName || p.full_name || pRec.name || pUser?.fullName || pCust?.fullName || "Traveler");
            const phone = escapeHtml(p.phoneNumber || p.phone_number || pRec.phone || pUser?.phoneNumber || pCust?.phoneNumber || "-");
            const bookingCode = escapeHtml(p.bookingCode || p.booking_code || pRec.code || "-");
            
            const rawDob =
              p.dateOfBirth ||
              p.date_of_birth ||
              pRec.dob ||
              pRec.birthDate ||
              pRec.birth_date ||
              pRec.tanggalLahir ||
              pRec.tanggal_lahir ||
              pRec.tglLahir ||
              pRec.tgl_lahir ||
              pUser?.dateOfBirth ||
              pUser?.date_of_birth ||
              pUser?.dob ||
              pCust?.dateOfBirth ||
              pCust?.date_of_birth ||
              pCust?.dob;

            const dob = typeof rawDob === "string" ? rawDob : rawDob instanceof Date ? rawDob.toISOString().split("T")[0] : undefined;
            const formattedDob = dob ? escapeHtml(formatDate(dob)) : `<span style="color: #94a3b8; font-style: italic;">Tidak diisi</span>`;
            
            const hasInsurance = Boolean(
              (dob && String(dob).trim() !== "" && String(dob).trim() !== "-") ||
              p.hasInsurance === true ||
              p.has_insurance === true ||
              pRec.isInsured === true ||
              pRec.is_insured === true ||
              pRec.insurance === true ||
              (typeof p.insuranceFee === "number" && p.insuranceFee > 0) ||
              (typeof p.insurance_fee === "number" && p.insurance_fee > 0)
            );
            
            const rawPickup =
              p.pickupLocation ||
              p.pickup_location ||
              pRec.pickupAddress ||
              pRec.pickup_address ||
              pRec.pickup ||
              pRec.pickupPoint ||
              pRec.pickup_point ||
              pRec.meetingPoint ||
              pRec.meeting_point ||
              pRec.titikJemput ||
              pRec.lokasiPenjemputan ||
              pUser?.pickupLocation ||
              pCust?.pickupLocation ||
              dest?.meetingPoint ||
              "";

            const parsedPickup = parsePickupLocation(String(rawPickup));
            let pickupDisplay = "Area Penjemputan Terjadwal";
            if (parsedPickup.placeName && parsedPickup.address) {
              pickupDisplay = `${parsedPickup.placeName} (${parsedPickup.address})`;
            } else if (parsedPickup.placeName) {
              pickupDisplay = parsedPickup.placeName;
            } else if (rawPickup) {
              pickupDisplay = String(rawPickup);
            } else if (dest?.meetingPoint) {
              pickupDisplay = `${dest.meetingPoint} (Meeting Point)`;
            }

            const pickupNotes = p.pickupNotes || p.pickup_notes || pRec.pickupNote || pRec.catatanJemput || pRec.catatan || "";

            const gender = p.gender ? (p.gender === "male" ? "L" : p.gender === "female" ? "P" : "-") : "-";
            const nationality = escapeHtml(p.nationality || pUser?.nationality || pCust?.nationality || "Indonesia");
            const identityNumber = p.identityNumber || p.identity_number || pRec.nik || pRec.ktp || pRec.idNumber || pUser?.identityNumber;

            let emergencyName = p.emergencyContact?.name || "";
            let emergencyPhone = p.emergencyContact?.phone || "";
            let emergencyRel = p.emergencyContact?.relationship || "Kerabat";

            if (!emergencyName && !emergencyPhone) {
              const rawEmergObj = (pRec.emergencyContact || pRec.emergency_contact || pRec.emergency || pUser?.emergencyContact) as Record<string, unknown> | undefined;
              if (rawEmergObj && typeof rawEmergObj === "object") {
                emergencyName = String(rawEmergObj.name || rawEmergObj.fullName || rawEmergObj.nama || "");
                emergencyPhone = String(rawEmergObj.phone || rawEmergObj.phoneNumber || rawEmergObj.noHp || "");
                emergencyRel = String(rawEmergObj.relationship || rawEmergObj.relation || rawEmergObj.hubungan || "Kerabat");
              } else {
                emergencyName = String(pRec.emergencyName || pRec.emergency_name || pRec.namaKontakDarurat || "");
                emergencyPhone = String(pRec.emergencyPhone || pRec.emergency_phone || pRec.noKontakDarurat || "");
                emergencyRel = String(pRec.emergencyRelationship || pRec.emergency_relationship || pRec.emergencyRelation || "Kerabat");
              }
            }

            const healthNotes = p.healthNotes || p.health_notes || pRec.medicalNotes || pRec.catatanKesehatan || "";
            const ageDisplay = calculateAgeYears(dob);

            const rawPkg =
              p.packageType ||
              p.package_type ||
              p.serviceType ||
              pRec.packageType ||
              pRec.package_type ||
              pRec.serviceType ||
              pRec.tipePaket ||
              "ALL_IN";
            const isTransportOnly = String(rawPkg).toUpperCase().includes("TRANSPORT");
            const packageLabel = isTransportOnly ? "TRANSPORT ONLY" : "ALL IN";
            const badgeBg = isTransportOnly ? "#fef3c7" : "#e0f2fe";
            const badgeColor = isTransportOnly ? "#b45309" : "#0369a1";
            const badgeBorder = isTransportOnly ? "#fde68a" : "#bae6fd";

            return `
              <tr style="page-break-inside: avoid; border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 6px; text-align: center; vertical-align: top; font-weight: 700; font-size: 11px; color: #475569;">
                  ${idx + 1}
                </td>
                <td style="padding: 8px 6px; vertical-align: top;">
                  <div style="font-weight: 800; font-size: 12px; color: #0f172a;">${fullName}</div>
                  <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">
                    Code: <strong>${bookingCode}</strong> ${identityNumber ? `| NIK: ${escapeHtml(identityNumber)}` : ""}
                  </div>
                </td>
                <td style="padding: 8px 6px; vertical-align: top; font-size: 11px;">
                  <div><strong>Umur:</strong> ${ageDisplay}</div>
                  <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                    Gender: <strong>${gender}</strong> | WN: <strong>${nationality}</strong>
                  </div>
                  <div style="margin-top: 4px;">
                    ${
                      hasInsurance
                        ? `<span style="background: #dcfce7; color: #166534; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0; display: inline-block;">✓ TERCOVER ASURANSI</span>`
                        : `<span style="background: #fee2e2; color: #991b1b; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid #fecaca; display: inline-block;">TANPA ASURANSI</span>`
                    }
                  </div>
                </td>
                <td style="padding: 8px 6px; vertical-align: top; font-size: 10.5px; line-height: 1.35;">
                  <div style="font-weight: 700; color: #00677d;">📍 ${escapeHtml(pickupDisplay)}</div>
                  ${
                    pickupNotes
                      ? `<div style="font-size: 9.5px; color: #c2410c; background: #fff7ed; padding: 2px 4px; border-radius: 4px; border: 1px dashed #fed7aa; margin-top: 3px;"><strong>Catatan:</strong> ${escapeHtml(pickupNotes)}</div>`
                      : ""
                  }
                </td>
                <td style="padding: 8px 6px; vertical-align: top; font-size: 10.5px; line-height: 1.3;">
                  <div style="font-weight: 700; font-size: 11px; color: #0284c7;">
                    ${phone ? `WA: ${escapeHtml(phone)}` : `<span style="color: #94a3b8; font-style: italic;">Tidak ada</span>`}
                  </div>
                  ${
                    healthNotes
                      ? `<div style="font-size: 9px; color: #be123c; margin-top: 3px;"><strong>Medis:</strong> ${escapeHtml(healthNotes)}</div>`
                      : ""
                  }
                  ${
                    emergencyName || emergencyPhone
                      ? `<div style="font-size: 8.5px; color: #64748b; margin-top: 3px;"><strong>Darurat:</strong> ${escapeHtml(emergencyName || "")} (${escapeHtml(emergencyPhone || "")})</div>`
                      : ""
                  }
                </td>
                <td style="padding: 8px 6px; text-align: center; vertical-align: top;">
                  <span style="display: inline-block; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; font-size: 9.5px; font-weight: 800; padding: 3px 7px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px;">
                    ${packageLabel}
                  </span>
                </td>
              </tr>
            `;
          })
          .join("");

  const insuredCount = participants.filter((p) => {
    const pRec = p as unknown as Record<string, unknown>;
    const pUser = (pRec.user && typeof pRec.user === "object") ? (pRec.user as Record<string, unknown>) : undefined;
    const rawDob =
      p.dateOfBirth ||
      p.date_of_birth ||
      pRec.dob ||
      pRec.birthDate ||
      pRec.birth_date ||
      pRec.tanggalLahir ||
      pUser?.dateOfBirth;
    const dob = typeof rawDob === "string" ? rawDob : rawDob instanceof Date ? rawDob.toISOString().split("T")[0] : undefined;
    return Boolean(
      (dob && String(dob).trim() !== "" && String(dob).trim() !== "-") ||
      p.hasInsurance === true ||
      p.has_insurance === true ||
      pRec.isInsured === true ||
      pRec.is_insured === true ||
      pRec.insurance === true ||
      (typeof p.insuranceFee === "number" && p.insuranceFee > 0)
    );
  }).length;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Manifes Penumpang - Mobil #${groupNumber} - ${destTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background: #ffffff;
      color: #0f172a;
      font-size: 11px;
      line-height: 1.4;
      padding: 0;
    }
    .container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    /* Header Kop */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2.5px solid #00677d;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      color: #00677d;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
    }
    .doc-meta {
      text-align: right;
    }
    .doc-badge {
      display: inline-block;
      background: #00677d;
      color: #ffffff;
      font-size: 10.5px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .doc-number {
      font-size: 10px;
      font-family: monospace;
      color: #475569;
      margin-top: 3px;
      font-weight: 700;
    }
    /* Info Grid Boxes */
    .info-section {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 9px 12px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .card-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #00677d;
      margin-bottom: 5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      display: flex;
      justify-content: space-between;
    }
    .info-row {
      display: flex;
      font-size: 10.5px;
      margin-bottom: 3px;
    }
    .info-label {
      width: 105px;
      color: #64748b;
      font-weight: 600;
      flex-shrink: 0;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
      flex-grow: 1;
    }
    /* Manifest Table */
    .table-container {
      width: 100%;
      margin-bottom: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #cbd5e1;
    }
    thead {
      background: #00677d;
      color: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    th {
      padding: 7px 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid #005264;
    }
    /* Summary stats */
    .summary-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 14px;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Driver SOP and Signatures */
    .footer-section {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 12px;
      page-break-inside: avoid;
      margin-top: 10px;
    }
    .sop-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      background: #fafafa;
      font-size: 9.5px;
      color: #475569;
    }
    .sop-box h4 {
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .sop-box ul {
      margin-left: 14px;
    }
    .sop-box li {
      margin-bottom: 2px;
    }
    .sign-box {
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
      height: 95px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sign-title {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
    }
    .sign-name {
      font-size: 10.5px;
      font-weight: 800;
      color: #0f172a;
      border-top: 1px solid #94a3b8;
      padding-top: 2px;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-title">SHARE TOUR JOGJA</div>
        <div class="brand-sub">Platform Trip Sharing & Wisata Rombongan Terpercaya</div>
      </div>
      <div class="doc-meta">
        <div class="doc-badge">SURAT JALAN & MANIFES PENUMPANG</div>
        <div class="doc-number">No: ${manifestDocNumber}</div>
        <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Dicetak: ${printDate}</div>
      </div>
    </div>

    <!-- Info Trip & Operational Assignment -->
    <div class="info-section">
      <!-- Info Destinasi & Trip -->
      <div class="info-card">
        <div class="card-title">
          <span>Rincian Jadwal & Destinasi</span>
          <span style="color: #0284c7;">Mobil #${groupNumber}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Destinasi:</span>
          <span class="info-value" style="color: #00677d; font-size: 11.5px;">${escapeHtml(destTitle)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Lokasi Wisata:</span>
          <span class="info-value">${escapeHtml(destLocation)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Keberangkatan:</span>
          <span class="info-value">${departureDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Kepulangan:</span>
          <span class="info-value">${returnDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Meeting Point:</span>
          <span class="info-value" style="font-size: 10px;">${escapeHtml(meetingPoint)}</span>
        </div>
      </div>

      <!-- Info Driver & Armada -->
      <div class="info-card">
        <div class="card-title">
          <span>Penugasan Driver & Armada</span>
          <span style="color: ${group.status === "confirmed" || group.status === "full" ? "#15803d" : "#00677d"}; text-transform: uppercase;">
            Status: ${group.status || "Aktif"}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Driver Bertugas:</span>
          <span class="info-value" style="font-size: 11.5px; color: #0f172a;">${escapeHtml(driverName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">No. WA Driver:</span>
          <span class="info-value" style="color: #0284c7;">${escapeHtml(driverPhone)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">No. SIM Driver:</span>
          <span class="info-value">${escapeHtml(driverLicense)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Unit Armada:</span>
          <span class="info-value">${escapeHtml(vehicleName)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Nomor Plat Polisi:</span>
          <span class="info-value" style="font-family: monospace; font-size: 11px; background: #e2e8f0; padding: 1px 5px; border-radius: 4px; display: inline-block;">
            ${escapeHtml(vehiclePlate)}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Kapasitas Armada:</span>
          <span class="info-value">${vehicleCapacity} Kursi (${vehicleTrans} / ${vehicleFuel})</span>
        </div>
      </div>
    </div>

    <!-- Summary Box -->
    <div class="summary-box">
      <div>
        <strong>Total Penumpang Terdaftar:</strong> ${currentPax} dari ${maxPax} Kursi
      </div>
      <div>
        <strong>Tercover Asuransi:</strong> <span style="color: #15803d; font-weight: 800;">${insuredCount} Pax</span> | 
        <strong>Tanpa Asuransi:</strong> <span style="color: #b91c1c; font-weight: 800;">${currentPax - insuredCount} Pax</span>
      </div>
      <div>
        <strong>Unit Armada:</strong> Mobil #${groupNumber} (${escapeHtml(vehiclePlate)})
      </div>
    </div>

    <!-- Manifest Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 25px; text-align: center;">No</th>
            <th style="width: 175px; text-align: left;">Nama Traveler</th>
            <th style="width: 145px; text-align: left;">Umur & Asuransi</th>
            <th style="text-align: left;">Titik Jemput (Pickup)</th>
            <th style="width: 140px; text-align: left;">Kontak Traveler</th>
            <th style="width: 105px; text-align: center;">Layanan</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>

    <!-- SOP & Signature Section -->
    <div class="footer-section">
      <div class="sop-box">
        <h4>📋 SOP Penjemputan Driver:</h4>
        <ul>
          <li>Hubungi nomor WhatsApp traveler H-1 atau minimal 2 jam sebelum jadwal penjemputan.</li>
          <li>Verifikasi kecocokan Nama, Kode Booking, dan Umur / Identitas traveler.</li>
          <li>Periksa jenis paket layanan (All In / Transport Only) sesuai manifes perjalanan.</li>
          <li>Patuhi batas kecepatan dan utamakan keselamatan seluruh penumpang.</li>
        </ul>
      </div>

      <div class="sign-box">
        <div class="sign-title">Driver Bertugas</div>
        <div class="sign-name">${escapeHtml(driverName)}</div>
      </div>

      <div class="sign-box">
        <div class="sign-title">Koordinator Operasional</div>
        <div class="sign-name">Admin Share Tour</div>
      </div>
    </div>

    <!-- Footer Note -->
    <div style="text-align: center; margin-top: 12px; font-size: 8.5px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 5px;">
      Dokumen ini sah dikeluarkan oleh Sistem Informasi Manajemen Operasional Share Tour Jogja dan berfungsi sebagai manifes perjalanan resmi.
    </div>
  </div>
</body>
</html>`;

  // Hidden Iframe Print Strategy
  const iframeId = "print-manifest-iframe";
  let iframe = document.getElementById(iframeId) as HTMLIFrameElement | null;
  if (iframe) {
    document.body.removeChild(iframe);
  }

  iframe = document.createElement("iframe");
  iframe.id = iframeId;
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    try {
      iframe?.contentWindow?.focus();
      iframe?.contentWindow?.print();
    } catch {
      window.print();
    }
  };
}

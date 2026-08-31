"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Plus,
  Search,
  Star,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_DESTINATIONS, MOCK_TRIPS } from "@/src/services/mockData";
import { formatCurrency, formatDuration } from "@/src/lib/utils";

export default function DestinationsAdminPage() {
  const [destinations] = useState(MOCK_DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = destinations.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Kelola Destinasi & Paket Trip
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atur paket wisata trip sharing, jadwal keberangkatan, dan itinerary harian.
          </p>
        </div>

        <Button asChild className="gap-2 shadow-sm">
          <Link href="/admin/destinations/new">
            <Plus className="h-4 w-4" />
            + Buat Destinasi Baru
          </Link>
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Destinasi Aktif</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {destinations.length} Paket
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#ff7f50] flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Total Grup Terjadwal</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {MOCK_TRIPS.reduce((acc, t) => acc + t.groups.length, 0)} Grup Armada
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Kapasitas Maksimal</span>
            <span className="font-heading font-extrabold text-xl text-[#00677d] block">
              6 Pax / Mobil
            </span>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama destinasi atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 text-xs"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Total: {filtered.length} Destinasi
        </span>
      </div>

      {/* Destinations Table */}
      <div className="rounded-2xl bg-white shadow-stitch-card border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Destinasi & Foto</th>
                <th className="px-5 py-3.5">Lokasi</th>
                <th className="px-5 py-3.5">Durasi</th>
                <th className="px-5 py-3.5">Harga (Per Pax)</th>
                <th className="px-5 py-3.5">Kapasitas Grup</th>
                <th className="px-5 py-3.5">Rating & Review</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((dest) => (
                <tr key={dest.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <Image
                          src={dest.coverImage}
                          alt={dest.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">
                          {dest.title}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-xs">
                          {dest.tagline}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                      <span>{dest.location}</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-medium text-slate-600">
                    {formatDuration(dest.durationDays, dest.durationNights)}
                  </td>

                  <td className="px-5 py-4 font-bold text-[#a43c12] text-sm">
                    {formatCurrency(dest.pricePerPax)}
                  </td>

                  <td className="px-5 py-4">
                    <Badge variant="azure" className="text-[10px] font-bold">
                      Maks 6 Orang / Grup
                    </Badge>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-slate-700 font-bold">
                      <Star className="h-3.5 w-3.5 fill-[#ff7f50] text-[#ff7f50]" />
                      <span>{dest.rating}</span>
                      <span className="text-slate-400 font-normal">({dest.totalReviews})</span>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1">
                      <Link href={`/destinations/${dest.slug}`}>
                        Pratinjau
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

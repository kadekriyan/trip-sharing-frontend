"use client";

import React, { useState, useEffect } from "react";
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
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_DESTINATIONS, MOCK_TRIPS } from "@/src/services/mockData";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, formatDuration } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function DestinationsAdminPage() {
  const [destinations, setDestinations] = useState<Destination[]>(MOCK_DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await adminService.getDestinations();
        if (isMounted && data.length > 0) {
          setDestinations(data);
        }
      } catch {
        // Fallback
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

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
              {destinations.length} Lokasi
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#ff7f50] flex items-center justify-center">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Jadwal Trip Berjalan</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              {MOCK_TRIPS.length} Jadwal
            </span>
          </div>
        </Card>

        <Card className="p-4 border border-slate-100 shadow-stitch-card flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-100 text-[#00a3c4] flex items-center justify-center">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold uppercase">Rata-rata Rating Wisata</span>
            <span className="font-heading font-extrabold text-xl text-[#191c1e] block">
              ⭐ 4.9 / 5.0
            </span>
          </div>
        </Card>
      </div>

      {/* Destinations List Card */}
      <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari judul destinasi atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dest) => (
            <Card
              key={dest.id}
              className="overflow-hidden border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video w-full">
                  <Image
                    src={dest.coverImage}
                    alt={dest.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#5cd5f8]" />
                    {formatDuration(dest.durationDays, dest.durationNights)}
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <span className="text-[11px] font-bold text-[#00677d] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {dest.location}
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#191c1e] line-clamp-1">
                    {dest.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {dest.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Mulai dari</span>
                  <span className="font-heading font-extrabold text-[#a43c12] text-sm">
                    {formatCurrency(dest.pricePerPax)}
                  </span>
                </div>
                <Button asChild size="sm" variant="outline" className="text-xs gap-1">
                  <Link href={`/destinations/${dest.slug}`}>
                    Lihat Detail <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

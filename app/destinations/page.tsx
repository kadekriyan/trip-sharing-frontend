"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  MapPin,
  Star,
  Users,
  CheckCircle2,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { MOCK_DESTINATIONS } from "@/src/services/mockData";
import { formatCurrency, formatDuration } from "@/src/lib/utils";

export default function DestinationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [onlyAvailableSlots, setOnlyAvailableSlots] = useState(false);

  const filteredDestinations = useMemo(() => {
    return MOCK_DESTINATIONS.filter((item) => {
      if (
        searchQuery &&
        !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.location.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (selectedLocation !== "all" && !item.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }
      if (selectedDuration === "1-2" && item.durationDays > 2) return false;
      if (selectedDuration === "3+" && item.durationDays < 3) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.pricePerPax - b.pricePerPax;
      if (sortBy === "price_desc") return b.pricePerPax - a.pricePerPax;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.totalReviews - a.totalReviews; // default popular
    });
  }, [searchQuery, selectedLocation, selectedDuration, sortBy]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 space-y-2">
          <Badge variant="azure" className="font-semibold">
            Katalog Trip Sharing
          </Badge>
          <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
            Eksplorasi Destinasi Wisata
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed">
            Pilih destinasi impianmu dan bergabunglah ke grup mobil 6-seater bersama traveler lain. Biaya hemat, pengalaman maksimal.
          </p>
        </div>

        {/* Top Control Bar (Search & Sort) */}
        <div className="mb-8 rounded-2xl bg-white p-4 shadow-stitch-card border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari Bromo, Komodo, Bali, dsb..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Controls: Sorting & Filter Count */}
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Menampilkan <strong>{filteredDestinations.length}</strong> Paket
            </span>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs font-semibold text-slate-700 focus:border-[#00677d] focus:outline-none"
              >
                <option value="popular">Paling Populer</option>
                <option value="price_asc">Harga: Rendah ke Tinggi</option>
                <option value="price_desc">Harga: Tinggi ke Rendah</option>
                <option value="rating">Rating Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar Filters + Destinations List */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-2xl bg-white p-5 shadow-stitch-card border border-slate-100 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="font-heading font-bold text-sm text-[#191c1e] flex items-center gap-2">
                  <Filter className="h-4 w-4 text-[#00677d]" />
                  Filter Pencarian
                </span>
                {(selectedLocation !== "all" || selectedDuration !== "all" || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedLocation("all");
                      setSelectedDuration("all");
                      setSearchQuery("");
                    }}
                    className="text-[11px] text-[#ff7f50] font-semibold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Filter: Lokasi */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Wilayah / Destinasi
                </label>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {[
                    { id: "all", label: "Semua Wilayah" },
                    { id: "Jawa Timur", label: "Jawa Timur (Bromo/Ijen)" },
                    { id: "Labuan Bajo", label: "NTT (Komodo/Padar)" },
                    { id: "Bali", label: "Bali & Nusa Penida" },
                  ].map((loc) => (
                    <label key={loc.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio"
                        name="location"
                        checked={selectedLocation === loc.id}
                        onChange={() => setSelectedLocation(loc.id)}
                        className="accent-[#00677d]"
                      />
                      <span>{loc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter: Durasi */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Durasi Perjalanan
                </label>
                <div className="space-y-1.5 text-xs text-slate-600">
                  {[
                    { id: "all", label: "Semua Durasi" },
                    { id: "1-2", label: "Trip Singkat (1 - 2 Hari)" },
                    { id: "3+", label: "Trip Panjang (3+ Hari)" },
                  ].map((dur) => (
                    <label key={dur.id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === dur.id}
                        onChange={() => setSelectedDuration(dur.id)}
                        className="accent-[#00677d]"
                      />
                      <span>{dur.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter: Slot Availability Checkbox */}
              <div className="pt-3 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyAvailableSlots}
                    onChange={(e) => setOnlyAvailableSlots(e.target.checked)}
                    className="rounded accent-[#00677d]"
                  />
                  <span>Hanya grup dengan sisa kursi</span>
                </label>
              </div>
            </div>

            {/* Info Box: Auto-Grouping guarantee */}
            <div className="rounded-2xl bg-gradient-to-br from-[#00677d]/10 to-[#00a3c4]/10 p-5 border border-[#00677d]/20 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-1.5 font-bold text-[#00677d]">
                <Users className="h-4 w-4" />
                Jaminan Auto-Grouping
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Kapasitas mobil dibatasi ketat <strong>maksimal 6 orang</strong> untuk kenyamanan perjalanan. Jika grup penuh, sistem otomatis membuat grup baru.
              </p>
            </div>
          </div>

          {/* Destinations Grid List */}
          <div className="lg:col-span-3">
            {filteredDestinations.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center border border-slate-100 shadow-sm space-y-4">
                <Sparkles className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-slate-700">
                  Tidak Ada Destinasi yang Cocok
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh paket trip sharing yang tersedia.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedLocation("all");
                    setSelectedDuration("all");
                    setSearchQuery("");
                  }}
                >
                  Reset Semua Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDestinations.map((dest) => (
                  <Card
                    key={dest.id}
                    className="overflow-hidden flex flex-col group border border-slate-100"
                  >
                    {/* 16:9 Image */}
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={dest.coverImage}
                        alt={dest.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Price Tag Coral */}
                      <div className="absolute top-3 right-3 bg-[#a43c12] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                        {formatCurrency(dest.pricePerPax)}
                        <span className="text-[10px] font-normal opacity-90">/pax</span>
                      </div>

                      {/* Location Badge */}
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#5cd5f8]" />
                        {dest.location}
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold text-[#00677d] bg-[#e0f2fe] px-2 py-0.5 rounded">
                            {formatDuration(dest.durationDays, dest.durationNights)}
                          </span>
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                            <Star className="h-3.5 w-3.5 fill-[#ff7f50] text-[#ff7f50]" />
                            <span>{dest.rating}</span>
                            <span className="text-slate-400 font-normal">({dest.totalReviews})</span>
                          </div>
                        </div>

                        <h3 className="font-heading font-bold text-base sm:text-lg text-[#191c1e] line-clamp-1 group-hover:text-[#00677d] transition-colors">
                          <Link href={`/destinations/${dest.slug}`}>{dest.title}</Link>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {dest.tagline}
                        </p>
                      </div>

                      {/* Highlights */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="space-y-1.5 mb-4">
                          {dest.highlights.slice(0, 2).map((hl, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-600">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{hl}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-bold text-slate-500">
                            Maks 6 Orang / Grup
                          </span>
                          <Button asChild size="sm" className="gap-1.5">
                            <Link href={`/destinations/${dest.slug}`}>
                              Cek Jadwal & Slot
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

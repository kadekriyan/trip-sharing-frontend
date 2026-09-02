"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { destinationService } from "@/src/services/destination.service";
import { formatCurrency, formatDuration } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>(MOCK_DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDestinations() {
      setIsLoading(true);
      try {
        const data = await destinationService.getAllDestinations({
          search: searchQuery || undefined,
          location: selectedLocation === "all" ? undefined : selectedLocation,
          duration: selectedDuration === "1-2" ? 2 : selectedDuration === "3+" ? 3 : undefined,
          sortBy,
        });
        if (isMounted && data.length > 0) {
          setDestinations(data);
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadDestinations();
    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedLocation, selectedDuration, sortBy]);

  const filteredDestinations = useMemo(() => {
    return destinations.filter((item) => {
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
  }, [destinations, searchQuery, selectedLocation, selectedDuration, sortBy]);

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
                onChange={(e) => setSortBy(e.target.value as "popular" | "price_asc" | "price_desc" | "rating")}
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
                    { id: "1-2", label: "1 - 2 Hari (Weekend Trip)" },
                    { id: "3+", label: "3 Hari ke Atas (Long Trip)" },
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

              {/* Information Banner */}
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#00677d]">
                  <Sparkles className="h-4 w-4" />
                  <span>Jaminan 6 Orang / Mobil</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Tidak ada desak-desakan. Setiap perjalanan menggunakan armada HiAce/Innova VIP dengan kursi lega.
                </p>
              </div>
            </div>
          </div>

          {/* Destinations Cards Stream */}
          <div className="lg:col-span-3 space-y-6">
            {isLoading && (
              <div className="text-center py-12 text-slate-400 text-sm">
                Memuat katalog destinasi...
              </div>
            )}

            {!isLoading && filteredDestinations.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
                <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <h3 className="font-heading font-bold text-base text-slate-700">Destinasi Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Coba gunakan kata kunci pencarian lain atau reset filter yang sedang aktif.
                </p>
                <Button
                  onClick={() => {
                    setSelectedLocation("all");
                    setSelectedDuration("all");
                    setSearchQuery("");
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Reset Semua Filter
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDestinations.map((destination) => (
                <Card
                  key={destination.id}
                  className="group overflow-hidden border border-slate-100 shadow-stitch-card hover:shadow-stitch-hover transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Image & Badges */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <Image
                        src={destination.coverImage}
                        alt={destination.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                      {/* Location Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-[#00677d] flex items-center gap-1 shadow-sm">
                        <MapPin className="h-3 w-3" />
                        {destination.location}
                      </div>

                      {/* Price Badge */}
                      <div className="absolute top-3 right-3 bg-[#a43c12] text-white px-3 py-1 rounded-xl font-heading font-extrabold text-xs shadow-md">
                        {formatCurrency(destination.pricePerPax)}
                        <span className="text-[10px] font-normal opacity-90">/pax</span>
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-3 left-3 text-white text-xs font-semibold flex items-center gap-1.5 drop-shadow">
                        <span>{formatDuration(destination.durationDays, destination.durationNights)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-300">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {destination.rating} ({destination.totalReviews})
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <CardContent className="p-5 space-y-3">
                      <h3 className="font-heading text-lg font-bold text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-1">
                        {destination.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {destination.tagline || destination.description}
                      </p>

                      {/* Inclusions Highlights */}
                      <div className="space-y-1 pt-1">
                        {destination.inclusions && destination.inclusions.slice(0, 3).map((inc, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{inc}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 border-t border-slate-100/80 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Users className="h-4 w-4 text-[#00677d]" />
                      <span className="font-semibold text-slate-700">Maks 6 Orang/Mobil</span>
                    </div>

                    <Button asChild size="sm" className="gap-1 shadow-sm text-xs">
                      <Link href={`/destinations/${destination.slug}`}>
                        Pesan Kursi
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

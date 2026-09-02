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
  Sparkles,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { destinationService } from "@/src/services/destination.service";
import { formatCurrency, formatDuration } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedDuration, setSelectedDuration] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");
  const [isLoading, setIsLoading] = useState(true);

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
        if (isMounted) {
          setDestinations(data);
        }
      } catch {
        // Silently handled
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
    return destinations.filter((dest) => {
      const matchSearch =
        dest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLocation =
        selectedLocation === "all" ||
        dest.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchDuration =
        selectedDuration === "all" ||
        (selectedDuration === "1-2" && dest.durationDays <= 2) ||
        (selectedDuration === "3+" && dest.durationDays >= 3);

      return matchSearch && matchLocation && matchDuration;
    });
  }, [destinations, searchQuery, selectedLocation, selectedDuration]);

  return (
    <div className="min-h-screen bg-[#f7f9fb] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Page Title & Search Header */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff7f50] block mb-1">
                Eksplorasi Perjalanan Terkurasi
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
                Katalog Destinasi Trip Sharing
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Pilih paket liburan favorit Anda dan bergabunglah dengan grup maks 6 orang untuk menghemat biaya.
              </p>
            </div>

            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium shrink-0">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Urutkan destinasi"
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm focus:border-[#00677d] focus:outline-none"
              >
                <option value="popular">Paling Populer</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="price_asc">Harga: Termurah</option>
                <option value="price_desc">Harga: Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Layout: Filters (Left) + Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filter Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-stitch-card space-y-6 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-[#191c1e]">
                  <Filter className="h-4 w-4 text-[#00677d]" />
                  <span>Filter Pencarian</span>
                </div>
                {(selectedLocation !== "all" || selectedDuration !== "all" || searchQuery !== "") && (
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

              {/* Filter: Input Pencarian */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Cari Nama Trip
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Ketik destinasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
                  />
                </div>
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
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
                ))}
              </div>
            ) : filteredDestinations.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="font-heading font-bold text-base text-slate-700">Destinasi Tidak Ditemukan</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
                  className="mt-2"
                >
                  Reset Semua Filter
                </Button>
              </div>
            ) : (
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
                          src={destination.coverImage || "/images/dest-bromo.jpg"}
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
                            {destination.rating || 4.9} ({destination.totalReviews || 0})
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

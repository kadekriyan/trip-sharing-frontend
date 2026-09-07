"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  MapPin,
  Users,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { destinationService } from "@/src/services/destination.service";
import { formatCurrency, formatDuration, getDestinationTitle, getDestinationPrice } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

interface DestinationsCatalogClientProps {
  initialDestinations: Destination[];
}

export function DestinationsCatalogClient({ initialDestinations }: DestinationsCatalogClientProps) {
  const [destinations, setDestinations] = useState<Destination[]>(initialDestinations);
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

  // Extract dynamic location options from destination list
  const availableLocations = useMemo(() => {
    const locationMap = new Map<string, { id: string; label: string; count: number }>();
    const totalCount = destinations?.length || 0;

    (destinations || []).forEach((dest) => {
      if (!dest?.location) return;
      const rawLoc = dest.location.trim();
      const parts = rawLoc.split(",").map((p) => p.trim()).filter(Boolean);
      // Use main province/region (last part if multiple, else full name)
      const regionKey = parts.length > 1 ? parts[parts.length - 1] : parts[0];

      const existing = locationMap.get(regionKey);
      if (existing) {
        existing.count += 1;
      } else {
        locationMap.set(regionKey, {
          id: regionKey,
          label: regionKey,
          count: 1,
        });
      }
    });

    const list = Array.from(locationMap.values()).map((item) => ({
      id: item.id,
      label: `${item.label} (${item.count})`,
    }));

    return [{ id: "all", label: `Semua Wilayah (${totalCount})` }, ...list];
  }, [destinations]);

  // Extract dynamic duration options
  const availableDurations = useMemo(() => {
    const total = destinations?.length || 0;
    let countShort = 0;
    let countLong = 0;

    (destinations || []).forEach((dest) => {
      const days = dest.durationDays || 0;
      if (days <= 2) {
        countShort += 1;
      } else {
        countLong += 1;
      }
    });

    return [
      { id: "all", label: `Semua Durasi (${total})` },
      { id: "1-2", label: `1 - 2 Hari (Weekend Trip) (${countShort})` },
      { id: "3+", label: `3 Hari ke Atas (Long Trip) (${countLong})` },
    ];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (!Array.isArray(destinations)) return [];
    return destinations.filter((dest) => {
      if (!dest) return false;
      const title = (dest.title || dest.name || dest.tagline || "").toLowerCase();
      const loc = (dest.location || "").toLowerCase();
      const query = (searchQuery || "").toLowerCase();

      const matchSearch = !query || title.includes(query) || loc.includes(query);
      const matchLocation =
        selectedLocation === "all" || loc.includes(selectedLocation.toLowerCase());
      const matchDuration =
        selectedDuration === "all" ||
        (selectedDuration === "1-2" && (dest.durationDays || 0) <= 2) ||
        (selectedDuration === "3+" && (dest.durationDays || 0) >= 3);

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
              <p className="text-sm text-slate-600 mt-1">
                Pilih paket liburan favorit Anda dan bergabunglah dengan grup maks 6 orang untuk menghemat biaya.
              </p>
            </div>

            {/* Quick Sort Dropdown with Accessible Label */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort-by-select" className="text-xs text-slate-700 font-semibold shrink-0">
                Urutkan:
              </label>
              <select
                id="sort-by-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Urutkan daftar paket wisata"
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 shadow-sm focus:border-[#00677d] focus:outline-none"
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
                    className="text-xs text-[#ff7f50] font-semibold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Filter: Input Pencarian */}
              <div className="space-y-2">
                <label htmlFor="search-input" className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Cari Nama Trip
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="search-input"
                    aria-label="Cari nama destinasi wisata"
                    placeholder="Ketik destinasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 text-xs bg-slate-50 border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              {/* Filter: Lokasi */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Wilayah / Destinasi
                </span>
                <div className="space-y-2 text-xs text-slate-700">
                  {availableLocations.map((loc) => (
                    <label key={loc.id} className="flex items-center gap-2.5 cursor-pointer py-1 text-slate-700 hover:text-[#00677d] transition-colors">
                      <input
                        type="radio"
                        name="location"
                        checked={selectedLocation === loc.id}
                        onChange={() => setSelectedLocation(loc.id)}
                        className="accent-[#00677d] h-4 w-4"
                      />
                      <span className="font-medium">{loc.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter: Durasi */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Durasi Perjalanan
                </span>
                <div className="space-y-2 text-xs text-slate-700">
                  {availableDurations.map((dur) => (
                    <label key={dur.id} className="flex items-center gap-2.5 cursor-pointer py-1 text-slate-700 hover:text-[#00677d] transition-colors">
                      <input
                        type="radio"
                        name="duration"
                        checked={selectedDuration === dur.id}
                        onChange={() => setSelectedDuration(dur.id)}
                        className="accent-[#00677d] h-4 w-4"
                      />
                      <span className="font-medium">{dur.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Daftar Destinasi */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-1">
              <span>
                Menampilkan <strong className="text-[#00677d]">{filteredDestinations.length}</strong> Destinasi
              </span>
            </div>

            {/* Content List */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="rounded-3xl border border-slate-200/80 bg-white p-4 space-y-4 animate-pulse">
                    <div className="aspect-[16/10] w-full bg-slate-200 rounded-2xl" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                    <div className="h-3 w-1/2 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredDestinations.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <PackageOpen className="h-12 w-12 text-slate-400 mx-auto" />
                <h3 className="font-heading font-bold text-lg text-slate-800">
                  Tidak Ada Destinasi yang Cocok
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh paket wisata yang tersedia.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLocation("all");
                    setSelectedDuration("all");
                  }}
                >
                  Reset Semua Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredDestinations.map((dest) => (
                  <Card
                    key={dest.id}
                    className="group overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-stitch-card hover:shadow-stitch-card-hover transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Container with strict Aspect Ratio (Anti-CLS) */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <Image
                          src={dest.coverImage || dest.image || dest.imageUrl || "/images/dest-bromo.jpg"}
                          alt={`Paket Wisata ${getDestinationTitle(dest)}`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        <div className="absolute top-3.5 left-3.5 flex gap-2">
                          <Badge variant="coral" className="text-[10px] font-bold">
                            Maks 6 Pax
                          </Badge>
                          {dest.category && (
                            <Badge variant="secondary" className="text-[10px] font-bold bg-white/95 text-slate-800">
                              {dest.category}
                            </Badge>
                          )}
                        </div>

                        <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <MapPin className="h-3.5 w-3.5 text-[#ff7f50]" />
                            <span>{dest.location || "Indonesia"}</span>
                          </div>
                          <span className="text-xs font-semibold text-amber-300">
                            ⭐ {dest.rating || 5.0}
                          </span>
                        </div>
                      </div>

                      <CardContent className="p-6 space-y-3">
                        <h3 className="font-heading text-base font-bold text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-1">
                          <Link href={`/destinations/${dest.slug || dest.id}`}>{getDestinationTitle(dest)}</Link>
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {dest.tagline || dest.shortDescription || dest.description || "Jelajahi keindahan alam bersama teman baru."}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
                          <span>⏱️ {formatDuration(dest.durationDays || 2, dest.durationNights || 1)}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-[#00677d]" />
                            {dest.currentParticipants || 0}/{dest.maxGroupCapacity || dest.maxParticipants || 6} Kursi
                          </span>
                        </div>
                      </CardContent>
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-[11px] text-slate-500 font-medium block">Biaya Patungan:</span>
                        <span className="font-heading font-extrabold text-base text-[#a43c12]">
                          {formatCurrency(getDestinationPrice(dest))}
                        </span>
                        <span className="text-[10px] text-slate-500"> /pax</span>
                      </div>

                      <Button asChild size="sm" className="gap-1 rounded-xl text-xs font-bold shadow-sm">
                        <Link href={`/destinations/${dest.slug || dest.id}`}>
                          Detail Trip
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

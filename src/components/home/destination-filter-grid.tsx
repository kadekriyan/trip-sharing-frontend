"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  MapPin,
  Calendar,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { formatCurrency, formatDuration, calculateOccupancyPercent } from "@/src/lib/utils";
import type { Destination } from "@/src/types";

interface DestinationFilterGridProps {
  initialDestinations: Destination[];
}

export function DestinationFilterGrid({ initialDestinations }: DestinationFilterGridProps) {
  const [searchLocation, setSearchLocation] = useState("all");
  const [searchDuration, setSearchDuration] = useState("all");

  const filtered = initialDestinations.filter((dest) => {
    if (searchLocation !== "all" && !dest.location.toLowerCase().includes(searchLocation.toLowerCase())) {
      return false;
    }
    if (searchDuration === "short" && dest.durationDays > 2) return false;
    if (searchDuration === "long" && dest.durationDays <= 2) return false;
    return true;
  });

  // Extract unique locations for the filter
  const locations = Array.from(new Set(initialDestinations.map((d) => d.location)));

  return (
    <div className="space-y-8">
      {/* Filter Bar with Accessible Labels */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-location" className="text-xs font-bold text-slate-700 sr-only">
              Pilih Lokasi
            </label>
            <select
              id="filter-location"
              aria-label="Pilih lokasi destinasi wisata"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
            >
              <option value="all">Semua Lokasi Wisata</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-duration" className="text-xs font-bold text-slate-700 sr-only">
              Pilih Durasi
            </label>
            <select
              id="filter-duration"
              aria-label="Pilih durasi perjalanan wisata"
              value={searchDuration}
              onChange={(e) => setSearchDuration(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
            >
              <option value="all">Semua Durasi Trip</option>
              <option value="short">Trip Singkat (1-2 Hari)</option>
              <option value="long">Trip Panjang (&gt; 2 Hari)</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600">
          Menampilkan <strong className="text-[#00677d]">{filtered.length}</strong> Paket Trip Sharing
        </span>
      </div>

      {/* Destination Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-base text-slate-800">
            Tidak ada destinasi yang cocok
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Coba ganti filter lokasi atau durasi untuk menemukan paket wisata trip sharing lainnya.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchLocation("all");
              setSearchDuration("all");
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((dest) => {
            const occupancy = calculateOccupancyPercent(
              dest.currentParticipants || 0,
              dest.maxParticipants || 6
            );
            return (
              <Card
                key={dest.id}
                className="group overflow-hidden rounded-3xl border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-stitch-card-hover flex flex-col justify-between"
              >
                <div>
                  {/* Image Container with strict Aspect Ratio (Anti-CLS) */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <Image
                      src={dest.coverImage || "/images/dest-bromo.jpg"}
                      alt={`Paket Wisata ${dest.title} - ${dest.location}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-3.5 left-3.5 flex gap-2">
                      <Badge variant="coral" className="text-[10px] font-bold px-2 py-0.5 shadow-sm">
                        Maks 6 Pax
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                        {dest.category}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-[#ff7f50]" />
                        <span>{dest.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow-sm">
                        <Calendar className="h-3.5 w-3.5 text-[#00a3c4]" />
                        <span>{formatDuration(dest.durationDays, dest.durationNights)}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-1">
                        <Link href={`/destinations/${dest.slug}`}>{dest.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {dest.shortDescription || dest.description}
                      </p>
                    </div>

                    {/* Auto-grouping slot indicator */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Users className="h-3.5 w-3.5 text-[#00677d]" />
                          Slot Terisi
                        </span>
                        <span className="text-[#00677d] font-bold">
                          {dest.currentParticipants || 0} / {dest.maxParticipants || 6} Kursi
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#00677d] to-[#ff7f50] transition-all duration-500"
                          style={{ width: `${occupancy}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Price & CTA */}
                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Biaya Patungan:</span>
                    <span className="font-heading font-extrabold text-lg text-[#a43c12]">
                      {formatCurrency(dest.pricePerPax)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal"> /pax</span>
                  </div>

                  <Button asChild size="sm" className="gap-1 rounded-xl shadow-sm text-xs font-bold">
                    <Link href={`/destinations/${dest.slug}`}>
                      Pesan Kursi
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

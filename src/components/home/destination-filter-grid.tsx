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
import {
  formatCurrency,
  formatDuration,
  calculateOccupancyPercent,
  getDestinationTitle,
  getDestinationPrice,
  getDestinationTripCount,
} from "@/src/lib/utils";
import type { Destination } from "@/src/types";

interface DestinationFilterGridProps {
  initialDestinations: Destination[];
}

export function DestinationFilterGrid({ initialDestinations }: DestinationFilterGridProps) {
  const [searchLocation, setSearchLocation] = useState("all");
  const [searchDuration, setSearchDuration] = useState("all");

  const filtered = Array.isArray(initialDestinations)
    ? initialDestinations.filter((dest) => {
        if (!dest) return false;
        const loc = (dest.location || "").toLowerCase();
        if (searchLocation !== "all" && !loc.includes(searchLocation.toLowerCase())) {
          return false;
        }
        const days = dest.durationDays || 0;
        if (searchDuration === "short" && days > 2) return false;
        if (searchDuration === "long" && days <= 2) return false;
        return true;
      })
    : [];

  // Extract unique locations for the filter
  const locations = Array.isArray(initialDestinations)
    ? Array.from(new Set(initialDestinations.map((d) => d?.location).filter(Boolean)))
    : [];

  return (
    <div className="space-y-8">
      {/* Filter Bar with Accessible Labels */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="filter-location" className="text-xs font-bold text-slate-700 sr-only">
              Select Location
            </label>
            <select
              id="filter-location"
              aria-label="Select tour destination location"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
            >
              <option value="all">All Tour Locations</option>
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
              Select Duration
            </label>
            <select
              id="filter-duration"
              aria-label="Select tour trip duration"
              value={searchDuration}
              onChange={(e) => setSearchDuration(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:outline-none"
            >
              <option value="all">All Durations</option>
              <option value="short">Short Trips (1-2 Days)</option>
              <option value="long">Multi-Day Trips (&gt; 2 Days)</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-600">
          Showing <strong className="text-[#00677d]">{filtered.length}</strong> Sharing Tour Packages
        </span>
      </div>

      {/* Destination Cards Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
          <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="font-heading font-bold text-base text-slate-800">
            No tour packages match your filters
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Try resetting or changing the location and duration filters to find other tours.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearchLocation("all");
              setSearchDuration("all");
            }}
          >
            Reset Filters
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
                      src={dest.coverImage || dest.image || dest.imageUrl || "https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800&auto=format&fit=crop&q=80"}
                      alt={`Tour Package ${getDestinationTitle(dest)} - ${dest.location || "Indonesia"}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-3.5 left-3.5 flex gap-2">
                      {dest.category && (
                        <Badge variant="secondary" className="text-[10px] font-bold bg-white/95 text-slate-800 shadow-sm backdrop-blur-sm">
                          {dest.category}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-[#ff7f50]" />
                        <span>{dest.location || "Indonesia"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold drop-shadow-sm">
                        <Calendar className="h-3.5 w-3.5 text-[#00a3c4]" />
                        <span>{formatDuration(dest.durationDays || 2, dest.durationNights || 1)}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-heading text-lg font-bold text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-1">
                        <Link href={`/destinations/${dest.slug || dest.id}`}>{getDestinationTitle(dest)}</Link>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                        {dest.tagline || dest.shortDescription || dest.description || "Explore beautiful natural and cultural wonders with fellow travelers."}
                      </p>
                    </div>

                    {/* Scheduled Trip indicator */}
                    <div className="flex items-center justify-between text-xs font-semibold p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="flex items-center gap-1.5 text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-[#00677d]" />
                        <span>Available Schedule</span>
                      </span>
                      <span className="text-[#00677d] font-bold">
                        {getDestinationTripCount(dest)} {getDestinationTripCount(dest) === 1 ? "Trip" : "Trips"}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Footer Price & CTA */}
                <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">Sharing Rate:</span>
                    <span className="font-heading font-extrabold text-lg text-[#a43c12]">
                      {formatCurrency(getDestinationPrice(dest))}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal"> /pax</span>
                  </div>

                  <Button asChild size="sm" className="gap-1 rounded-xl shadow-sm text-xs font-bold">
                    <Link href={`/destinations/${dest.slug || dest.id}`}>
                      Book Seat
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

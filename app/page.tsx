"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Users,
  Sparkles,
  ArrowRight,
  Star,
  MapPin,
  Calendar,
  TrendingDown,
  Car,
  ChevronRight,
  Search,
  Loader2,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { destinationService } from "@/src/services/destination.service";
import { articleService } from "@/src/services/article.service";
import { formatCurrency, formatDuration, calculateOccupancyPercent } from "@/src/lib/utils";
import type { Destination, Article } from "@/src/types";

export default function HomePage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("all");
  const [searchDuration, setSearchDuration] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        const [dests, arts] = await Promise.all([
          destinationService.getAllDestinations(),
          articleService.getAllArticles(),
        ]);
        if (isMounted) {
          setDestinations(dests);
          setArticles(arts);
        }
      } catch {
        // Handled silently, defaults to empty arrays
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredDestinations = destinations.filter((dest) => {
    if (searchLocation !== "all" && !dest.location.toLowerCase().includes(searchLocation.toLowerCase())) {
      return false;
    }
    if (searchDuration === "short" && dest.durationDays > 2) return false;
    if (searchDuration === "long" && dest.durationDays <= 2) return false;
    return true;
  });

  const featuredDest = destinations[0];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-20 overflow-hidden bg-gradient-to-b from-[#e0f2fe]/40 via-[#f7f9fb] to-[#f7f9fb]">
        {/* Background Glow Blobs */}
        <div className="absolute top-0 right-0 w-[45vw] h-[45vw] bg-[#00a3c4]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#ff7f50]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#00677d]">
                Open Trip Cost-Sharing Wisata Indonesia
              </span>
              <Badge variant="coral" className="text-[10px] px-1.5 py-0">
                Maks 6 Pax
              </Badge>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191c1e] leading-[1.12]">
              Jelajahi Negeri,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00677d] via-[#00a3c4] to-[#ff7f50]">
                Bagi Biayanya
              </span>
              , Temukan Teman Baru.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Platform trip sharing terpercaya di Indonesia. Gabung grup perjalanan berkapasitas maksimal 6 orang per mobil, nikmati kenyamanan privat dengan biaya patungan yang hemat hingga 60%.
            </p>

            {/* Micro Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-[#00677d] text-lg sm:text-xl">6 Pax</span>
                <span className="text-[11px] text-slate-500 font-medium">Maksimal per Mobil</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-[#ff7f50] text-lg sm:text-xl">60%</span>
                <span className="text-[11px] text-slate-500 font-medium">Lebih Hemat Biaya</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-emerald-600 text-lg sm:text-xl">100%</span>
                <span className="text-[11px] text-slate-500 font-medium">Garansi Berangkat</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Button asChild size="lg" className="shadow-lg shadow-[#00677d]/20 gap-2">
                <Link href="/destinations">
                  <Compass className="h-5 w-5" />
                  Pilih Destinasi Wisata
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2 bg-white">
                <Link href="/bookings">
                  <Calendar className="h-5 w-5 text-[#ff7f50]" />
                  Cek Booking Saya
                </Link>
              </Button>
            </div>

            {/* Trust Pilot / Rating Indicator */}
            <div className="pt-4 flex items-center justify-center lg:justify-start gap-3">
              <div className="flex -space-x-2">
                {["/images/dest-bromo.jpg", "/images/dest-komodo.jpg", "/images/dest-penida.jpg"].map((src, i) => (
                  <div key={i} className="relative h-8 w-8 rounded-full border-2 border-white overflow-hidden shadow-sm">
                    <Image src={src} alt="Traveler Avatar" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-[#ff7f50]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="font-bold text-slate-800 text-sm ml-1">4.92 / 5</span>
                </div>
                <span className="text-xs text-slate-500">Dari 2.400+ traveler puas di seluruh Indonesia</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {isLoading ? (
                <div className="h-96 rounded-3xl bg-slate-200 animate-pulse flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
                </div>
              ) : featuredDest ? (
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
                  <div className="relative h-96 w-full overflow-hidden">
                    <Image
                      src={featuredDest.coverImage || "/images/dest-bromo.jpg"}
                      alt={featuredDest.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Floating Top Badge */}
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="font-bold text-xs uppercase px-3 py-1 shadow-md">
                        Paling Diminati 🔥
                      </Badge>
                    </div>

                    {/* Floating Price Pill */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-1.5 text-right shadow-md">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Mulai Dari</span>
                      <span className="font-heading font-extrabold text-[#a43c12] text-sm sm:text-base">
                        {formatCurrency(featuredDest.pricePerPax)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">/pax</span>
                    </div>

                    {/* Card Bottom Meta */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-heading font-bold text-lg sm:text-xl text-white drop-shadow-md line-clamp-1">
                        {featuredDest.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-200">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-[#5cd5f8]" />
                          {featuredDest.location}
                        </span>
                        <span>•</span>
                        <span>{formatDuration(featuredDest.durationDays, featuredDest.durationNights)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Group Occupancy Progress */}
                  <div className="p-4 bg-white space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-[#00677d]" />
                        Status Keterisian Grup 1
                      </span>
                      <span className="text-[#00677d] bg-sky-50 px-2 py-0.5 rounded-full font-bold">
                        4/6 Kursi (Sisa 2)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#00a3c4] to-[#00677d] rounded-full transition-all duration-500" style={{ width: `${calculateOccupancyPercent(4, 6)}%` }} />
                    </div>
                    <Button asChild className="w-full justify-center">
                      <Link href={`/destinations/${featuredDest.slug}`}>
                        Gabung Grup Ini
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
                  <PackageOpen className="h-10 w-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">Belum ada paket wisata aktif di database.</p>
                </div>
              )}

              {/* Floating Benefit 1: Save Cost */}
              <div className="absolute -top-6 -left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 hidden sm:flex">
                <div className="h-10 w-10 rounded-xl bg-orange-100 text-[#ff7f50] flex items-center justify-center">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Hemat Biaya</span>
                  <span className="font-heading font-extrabold text-sm text-[#191c1e]">Hingga 60%</span>
                </div>
              </div>

              {/* Floating Benefit 2: Group Max 6 */}
              <div className="absolute -bottom-6 -right-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 hidden sm:flex">
                <div className="h-10 w-10 rounded-xl bg-teal-100 text-[#00677d] flex items-center justify-center">
                  <Car className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-400 block">Kapasitas Maksimal</span>
                  <span className="font-heading font-extrabold text-sm text-[#00677d]">6 Pax / Mobil</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SEARCH & FILTER BAR */}
      <section className="relative -mt-8 z-20 mx-auto max-w-5xl px-4 w-full">
        <Card className="p-4 sm:p-6 bg-white shadow-xl shadow-slate-200/50 border border-slate-100 rounded-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Cari Destinasi / Lokasi
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Misal: Bromo, Labuan Bajo, Bali..."
                  onChange={(e) => setSearchLocation(e.target.value === "" ? "all" : e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="sm:col-span-4 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Durasi Wisata
              </label>
              <select
                value={searchDuration}
                onChange={(e) => setSearchDuration(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 focus:border-[#00677d] focus:bg-white focus:outline-none"
              >
                <option value="all">Semua Durasi</option>
                <option value="short">Trip Singkat (1-2 Hari)</option>
                <option value="long">Trip Panjang (3+ Hari)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <Button asChild className="w-full h-10 font-bold gap-2">
                <Link href="/destinations">
                  <Sparkles className="h-4 w-4" />
                  Jelajah ({filteredDestinations.length})
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 3. FEATURED DESTINATIONS SECTION */}
      <section className="py-20 bg-[#f7f9fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="azure" className="mb-2">
                Pilihan Terbaik
              </Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#191c1e]">
                Destinasi Trip Sharing Populer
              </h2>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                Pilih paket perjalanan yang sedang membuka pendaftaran slot grup minggu ini.
              </p>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/destinations">
                Lihat Semua ({destinations.length})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Destination Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : filteredDestinations.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <PackageOpen className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">Tidak ada paket destinasi yang ditemukan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDestinations.map((dest) => (
                <Card key={dest.id} className="overflow-hidden flex flex-col group border border-slate-100">
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={dest.coverImage || "/images/dest-bromo.jpg"}
                      alt={dest.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md rounded-lg px-2.5 py-1 text-right shadow-sm">
                      <span className="font-heading font-extrabold text-[#a43c12] text-xs">
                        {formatCurrency(dest.pricePerPax)}
                      </span>
                      <span className="text-[9px] text-slate-400">/pax</span>
                    </div>
                  </div>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                        <span>{dest.location}</span>
                        <span>•</span>
                        <span>{formatDuration(dest.durationDays, dest.durationNights)}</span>
                      </div>
                      <h3 className="font-heading font-bold text-base text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-1">
                        <Link href={`/destinations/${dest.slug}`}>{dest.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {dest.tagline}
                      </p>
                    </div>

                    <Button asChild size="sm" className="w-full font-bold">
                      <Link href={`/destinations/${dest.slug}`}>
                        Pilih Tanggal & Gabung
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="azure">Mudah & Otomatis</Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
              Cara Kerja Trip Sharing (Maks 6 Orang)
            </h2>
            <p className="text-sm sm:text-base text-slate-500">
              Sistem pintar kami mengelompokkan peserta secara otomatis ke dalam grup mobil berkapasitas 6 orang.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#00677d] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#00677d]/20">
                1
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Pilih Destinasi</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Tentukan paket trip dan tanggal keberangkatan yang sesuai dengan agenda liburan Anda.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#00a3c4] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#00a3c4]/20">
                2
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Auto Grouping</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Sistem otomatis memasukkan Anda ke Grup Mobil aktif (Maks 6 orang) dengan transparansi slot.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#ff7f50] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#ff7f50]/20">
                3
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Bayar Instan</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Pembayaran aman via QRIS atau Transfer Bank. E-Voucher dan tiket digital terbit otomatis.
              </p>
            </div>

            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-emerald-600/20">
                4
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Berangkat Bersama</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Driver profesional kami siap menjemput Anda di meeting point yang telah disepakati.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRAVEL BLOG & COMMUNITY SECTION */}
      <section className="py-20 bg-[#f7f9fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="azure" className="mb-2">
                Tips Perjalanan
              </Badge>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#191c1e]">
                Artikel & Panduan Wisata Terbaru
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Wawasan seputar budget travel, rute populer, dan etika trip sharing.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/blog" className="gap-2">
                Lihat Semua Artikel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">Belum ada artikel yang diterbitkan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {articles.map((art) => (
                <Card key={art.id} className="overflow-hidden flex flex-col sm:flex-row border border-slate-100 group">
                  <div className="relative sm:w-2/5 aspect-video sm:aspect-auto">
                    <Image
                      src={art.coverImage || "/images/dest-bromo.jpg"}
                      alt={art.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6 sm:w-3/5 flex flex-col justify-between">
                    <div>
                      <Badge variant="coral" className="mb-2 text-[10px]">
                        {art.category}
                      </Badge>
                      <h3 className="font-heading font-bold text-lg text-[#191c1e] line-clamp-2 group-hover:text-[#00677d] transition-colors">
                        <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{art.readTimeMinutes} menit baca</span>
                      <Link
                        href={`/blog/${art.slug}`}
                        className="font-bold text-[#00677d] hover:text-[#00a3c4] flex items-center gap-1"
                      >
                        Baca Lengkap
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. CTA BANNER SECTION */}
      <section className="py-16 bg-gradient-to-br from-[#00677d] to-[#004e5f] text-white">
        <div className="mx-auto max-w-5xl px-4 text-center space-y-6">
          <Badge variant="secondary" className="px-3 py-1 font-bold">
            Siap Menjelajah?
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-white">
            Temukan Teman Perjalanan & Hemat Biaya Liburanmu Sekarang
          </h2>
          <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan traveler yang telah merasakan serunya petualangan berbagi perjalanan. Maksimal 6 orang per mobil, tanpa biaya tersembunyi.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-[#ff7f50] hover:bg-[#fe7e4f] text-white text-base shadow-xl">
              <Link href="/destinations" className="gap-2">
                <Sparkles className="h-5 w-5" />
                Pilih Destinasi Wisata
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 text-base">
              <Link href="/bookings">
                Cek Riwayat Booking
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

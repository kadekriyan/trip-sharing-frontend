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
  CheckCircle2,
  TrendingDown,
  Car,
  ChevronRight,
  Search,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { MOCK_DESTINATIONS, MOCK_ARTICLES } from "@/src/services/mockData";
import { destinationService } from "@/src/services/destination.service";
import { adminService } from "@/src/services/admin.service";
import { formatCurrency, formatDuration, calculateOccupancyPercent } from "@/src/lib/utils";
import type { Destination, Article } from "@/src/types";

export default function HomePage() {
  const [destinations, setDestinations] = useState<Destination[]>(MOCK_DESTINATIONS);
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [searchLocation, setSearchLocation] = useState("all");
  const [searchDuration, setSearchDuration] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadHomeData() {
      try {
        const [dests, arts] = await Promise.all([
          destinationService.getAllDestinations(),
          adminService.getArticles(),
        ]);
        if (isMounted) {
          if (dests.length > 0) setDestinations(dests);
          if (arts.length > 0) setArticles(arts);
        }
      } catch {
        // Fallback
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

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-20 overflow-hidden bg-gradient-to-b from-[#e0f2fe]/40 via-[#f7f9fb] to-[#f7f9fb]">
        {/* Background Glow Blobs */}
        <div className="absolute top-0 right-0 w-[45vw] h-[45vw] bg-[#00a3c4]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#ff7f50]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm w-fit">
              <span className="w-2 h-2 rounded-full bg-[#ff7f50] animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#00677d]">
                Platform Trip Cost-Sharing #1 di Indonesia
              </span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191c1e] leading-[1.15]">
              Berbagi Perjalanan, <br />
              <span className="text-[#00677d] relative inline-block">
                Hemat Biaya
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3 text-[#ff7f50]"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path
                    d="M0 5 Q 50 10 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
              </span>
              , Teman Baru.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              Jelajahi keindahan Indonesia bersama grup kecil eksklusif (maksimal <strong>6 traveler</strong> per mobil). Biaya sewa armada, bensin, dan pemandu terbagi rata secara otomatis.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button asChild size="lg" className="shadow-lg shadow-[#ff7f50]/20 text-base">
                <Link href="/destinations" className="gap-2">
                  <Compass className="h-5 w-5" />
                  Jelajahi Paket Wisata
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-white text-base">
                <a href="#cara-kerja" className="gap-2">
                  <span>Lihat Cara Kerja</span>
                  <ChevronRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Trust Badges / Social Proof */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6">
              <div className="flex -space-x-3">
                <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Traveler Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                    alt="Traveler Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                    alt="Traveler Avatar"
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-10 w-10 rounded-full border-2 border-white bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
                  +1.8k
                </div>
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
              {/* Main Trip Card Visual */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white group">
                <div className="relative h-96 w-full overflow-hidden">
                  <Image
                    src={MOCK_DESTINATIONS[0].coverImage}
                    alt={MOCK_DESTINATIONS[0].title}
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
                      {formatCurrency(MOCK_DESTINATIONS[0].pricePerPax)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">/pax</span>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-white drop-shadow-md line-clamp-1">
                      {MOCK_DESTINATIONS[0].title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-200">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#5cd5f8]" />
                        {MOCK_DESTINATIONS[0].location}
                      </span>
                      <span>•</span>
                      <span>{formatDuration(MOCK_DESTINATIONS[0].durationDays, MOCK_DESTINATIONS[0].durationNights)}</span>
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
                    <Link href={`/destinations/${MOCK_DESTINATIONS[0].slug}`}>
                      Gabung Grup Ini
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Floating Benefit 1: Save Cost */}
              <div className="absolute -top-6 -left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce duration-1000 hidden sm:flex">
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

      {/* 2. INTERACTIVE SEARCH & AVAILABILITY BAR */}
      <section className="relative -mt-10 z-20 mx-auto max-w-6xl px-4 sm:px-6 w-full">
        <div className="rounded-2xl bg-white p-4 sm:p-6 shadow-xl border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            {/* Filter 1: Lokasi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                Destinasi Wisata
              </label>
              <select
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="all">Semua Destinasi</option>
                <option value="Jawa Timur">Bromo & Jawa Timur</option>
                <option value="Labuan Bajo">Komodo & NTT</option>
                <option value="Bali">Bali & Nusa Penida</option>
              </select>
            </div>

            {/* Filter 2: Durasi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#00677d]" />
                Durasi Trip
              </label>
              <select
                value={searchDuration}
                onChange={(e) => setSearchDuration(e.target.value)}
                className="h-11 rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium text-slate-800 focus:border-[#00677d] focus:outline-none"
              >
                <option value="all">Semua Durasi</option>
                <option value="short">Weekend / Singkat (1-2 Hari)</option>
                <option value="long">Eksplorasi (3+ Hari)</option>
              </select>
            </div>

            {/* Filter 3: Slot Availability Info */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#00677d]" />
                Status Kuota
              </label>
              <div className="h-11 flex items-center px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                Slot Terbuka (Maks 6/Grup)
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 sm:pt-6">
              <Button asChild className="w-full h-11 justify-center gap-2">
                <Link href="/destinations">
                  <Search className="h-4 w-4" />
                  Cari Jadwal Trip
                </Link>
              </Button>
            </div>
          </div>
        </div>
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
                Lihat Semua ({MOCK_DESTINATIONS.length})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Destination Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDestinations.map((dest) => (
              <Card key={dest.id} className="overflow-hidden flex flex-col group border border-slate-100">
                {/* 16:9 Image Header */}
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={dest.coverImage}
                    alt={dest.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Floating Price Tag Top-Right */}
                  <div className="absolute top-3 right-3 bg-[#a43c12] text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                    {formatCurrency(dest.pricePerPax)}
                    <span className="text-[10px] font-normal opacity-90">/pax</span>
                  </div>
                  {/* Location badge bottom-left */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#5cd5f8]" />
                    {dest.location}
                  </div>
                </div>

                {/* Card Body */}
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

                    <h3 className="font-heading font-bold text-lg text-[#191c1e] line-clamp-1 group-hover:text-[#00677d] transition-colors">
                      {dest.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                      {dest.tagline}
                    </p>
                  </div>

                  {/* Highlights & Inclusions */}
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
                          Detail & Slot
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION (CARA KERJA) */}
      <section id="cara-kerja" className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="coral" className="mb-2 font-bold">
              Mudah & Transparan
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
              Bagaimana Trip Sharing Bekerja?
            </h2>
            <p className="text-base text-slate-500 mt-3">
              Solusi cerdas bagi solo traveler maupun pasangan yang ingin menjelajahi destinasi impian tanpa harus membayar biaya sewa mobil sendirian.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#00677d] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#00677d]/20">
                1
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Pilih Destinasi</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Tentukan paket wisata dan tanggal keberangkatan yang sesuai dengan agenda liburan Anda.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#ff7f50] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#ff7f50]/20">
                2
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Auto-Grouping (Maks 6)</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Sistem otomatis menggabungkan Anda ke dalam grup mobil 6-seater bersama traveler lain.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#f7f9fb] border border-slate-100 hover:shadow-md transition-shadow">
              <div className="h-14 w-14 rounded-2xl bg-[#00a3c4] text-white flex items-center justify-center font-heading font-extrabold text-xl mb-5 shadow-md shadow-[#00a3c4]/20">
                3
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">Bayar Instan Midtrans</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                Selesaikan pembayaran aman via QRIS, Virtual Account, atau Kartu Kredit. E-voucher otomatis terbit.
              </p>
            </div>

            {/* Step 4 */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {articles.map((art) => (
              <Card key={art.id} className="overflow-hidden flex flex-col sm:flex-row border border-slate-100 group">
                <div className="relative sm:w-2/5 aspect-video sm:aspect-auto">
                  <Image
                    src={art.coverImage}
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

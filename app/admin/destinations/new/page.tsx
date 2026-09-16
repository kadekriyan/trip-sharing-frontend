"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  Code2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { ImageUploader } from "@/src/components/ui/image-uploader";
import { adminService } from "@/src/services/admin.service";
import type { ItineraryDay } from "@/src/types";

export default function NewDestinationPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState(2);
  const [durationNights, setDurationNights] = useState(1);
  const [pricePerPax, setPricePerPax] = useState<number | string>("");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
  );
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [meetingPoint, setMeetingPoint] = useState("Meeting Point Utama (Stasiun / Bandara)");

  // Dynamic SEO & Schema Overrides
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywordsText, setSeoKeywordsText] = useState("");
  const [seoOgImage, setSeoOgImage] = useState("");
  const [customSchemaJson, setCustomSchemaJson] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  // Inclusions & Exclusions String
  const [inclusionsText, setInclusionsText] = useState(
    "Transportasi Armada HiAce AC, Tiket Masuk Wisata, Dokumentasi Foto, Driver & Guide"
  );
  const [exclusionsText, setExclusionsText] = useState(
    "Pengeluaran Pribadi, Makan di luar paket"
  );

  // Dynamic Itinerary Days
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    {
      day: 1,
      title: "Penjemputan & Perjalanan Menuju Transit",
      description: "Briefing dan kumpul bersama teman se-grup.",
      activities: ["Meeting point & perkenalan grup", "Perjalanan menuju lokasi"],
    },
    {
      day: 2,
      title: "Eksplorasi Spot Utama & Kembali",
      description: "Menikmati pemandangan alam dan sesi foto bersama.",
      activities: ["Sunrise viewing & trekking", "Drop off kembali ke meeting point"],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const addItineraryDay = () => {
    const newDayNum = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      {
        day: newDayNum,
        title: `Hari ${newDayNum}: Eksplorasi Lanjutan`,
        description: "Aktivitas wisata lanjutan bersama grup.",
        activities: ["Kunjungan spot wisata", "Makan siang bersama"],
      },
    ]);
  };

  const removeItineraryDay = (index: number) => {
    if (itinerary.length <= 1) return;
    const updated = itinerary.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      day: i + 1,
    }));
    setItinerary(updated);
  };

  const addActivity = (dayIndex: number) => {
    const updated = [...itinerary];
    const currentActivities = updated[dayIndex].activities || [];
    updated[dayIndex].activities = [...currentActivities, ""];
    setItinerary(updated);
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    const updated = [...itinerary];
    const currentActivities = updated[dayIndex].activities || [];
    updated[dayIndex].activities = currentActivities.filter((_, i) => i !== activityIndex);
    setItinerary(updated);
  };

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    const updated = [...itinerary];
    const currentActivities = [...(updated[dayIndex].activities || [])];
    currentActivities[activityIndex] = value;
    updated[dayIndex].activities = currentActivities;
    setItinerary(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !pricePerPax) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanedItinerary = itinerary.map((item) => ({
        ...item,
        activities: (item.activities || []).map((a) => a.trim()).filter(Boolean),
      }));

      await adminService.addDestination({
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
        tagline,
        description,
        location,
        durationDays: Number(durationDays),
        durationNights: Number(durationNights),
        pricePerPax: Number(pricePerPax),
        coverImage,
        galleryImages,
        meetingPoint,
        inclusions: inclusionsText.split(",").map((s) => s.trim()),
        exclusions: exclusionsText.split(",").map((s) => s.trim()),
        highlights: ["Eksplorasi Alam Terbaik", "Grup Nyaman Maks 6 Pax"],
        itinerary: cleanedItinerary,
        maxGroupCapacity: 6,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywordsText ? seoKeywordsText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        seoOgImage: seoOgImage.trim() || null,
        customSchemaJson: customSchemaJson.trim() || null,
        noIndex,
      });

      setFeedback({ type: "success", message: "Paket destinasi berhasil dibuat dan dipublikasikan!" });
      setTimeout(() => {
        router.push("/admin/destinations");
      }, 1000);
    } catch {
      setIsSubmitting(false);
      setFeedback({ type: "error", message: "Gagal menyimpan destinasi." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/destinations"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Destinasi
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#00677d]" />
            Buat Paket Destinasi Baru
          </h1>
        </div>
        <Badge variant="azure">Kapasitas Maksimal: 6 Pax / Grup</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informasi Umum */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Informasi Umum Paket Wisata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Judul Paket Destinasi *
              </label>
              <Input
                required
                placeholder="Contoh: Bromo Sunrise & Midnight Crater Shared Odyssey"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                URL Slug
              </label>
              <Input
                placeholder="contoh: bromo-sunrise-midnight-crater"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tagline Singkat
              </label>
              <Input
                placeholder="Contoh: Saksikan magisnya golden hour di Bromo bersama teman baru"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Deskripsi Lengkap Destinasi
              </label>
              <Input
                placeholder="Jelaskan daya tarik, keindahan alam, dan pengalaman yang didapatkan..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Lokasi / Wilayah *
              </label>
              <Input
                required
                placeholder="Contoh: Probolinggo, Jawa Timur"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Harga per Pax (Rp) *
              </label>
              <Input
                required
                type="number"
                placeholder="Contoh: 750000"
                value={pricePerPax}
                onChange={(e) => setPricePerPax(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Durasi Hari
              </label>
              <Input
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Durasi Malam
              </label>
              <Input
                type="number"
                value={durationNights}
                onChange={(e) => setDurationNights(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
              <ImageUploader
                mode="single"
                folder="destinations"
                label="Foto Cover Destinasi *"
                value={coverImage}
                onChange={setCoverImage}
                helperText="Unggah gambar utama lanskap resolusi tinggi (16:9) untuk cover katalog."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
              <ImageUploader
                mode="multiple"
                folder="destinations"
                label="Galeri Foto Destinasi (Maks. 10 Foto)"
                values={galleryImages}
                onChangeMultiple={setGalleryImages}
                helperText="Unggah foto-foto suasana trip atau dokumentasi keindahan alam destinasi."
                maxFiles={10}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Meeting Point
              </label>
              <Input
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Inclusions & Exclusions */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              2
            </span>
            Fasilitas (Inclusions & Exclusions)
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Termasuk dalam Paket (Pisahkan dengan koma)
              </label>
              <Input
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tidak Termasuk dalam Paket (Pisahkan dengan koma)
              </label>
              <Input
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Itinerary Builder */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              Rencana Perjalanan (Itinerary Builder)
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItineraryDay}
              className="gap-1 text-xs text-[#00677d]"
            >
              <Plus className="h-3.5 w-3.5" />
              + Tambah Hari
            </Button>
          </div>

          <div className="space-y-4">
            {itinerary.map((day, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="azure" className="font-bold text-xs px-2.5 py-0.5">
                    Hari ke-{day.day}
                  </Badge>
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(idx)}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold p-1 rounded hover:bg-rose-50 transition-colors"
                      title="Hapus hari ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Hari</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Judul Hari *
                    </label>
                    <Input
                      placeholder={`Contoh: Hari ${day.day} - Penjemputan & Perjalanan Menuju Transit`}
                      value={day.title}
                      onChange={(e) => {
                        const updated = [...itinerary];
                        updated[idx].title = e.target.value;
                        setItinerary(updated);
                      }}
                      className="text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Deskripsi Singkat Hari
                    </label>
                    <Input
                      placeholder="Contoh: Briefing dan kumpul bersama teman se-grup."
                      value={day.description}
                      onChange={(e) => {
                        const updated = [...itinerary];
                        updated[idx].description = e.target.value;
                        setItinerary(updated);
                      }}
                      className="text-xs bg-white"
                    />
                  </div>

                  {/* Dynamic Activities List */}
                  <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-[#00677d]" />
                        <span>Daftar Rincian Kegiatan (Activities)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => addActivity(idx)}
                        className="text-[11px] font-bold text-[#00677d] hover:text-[#005566] flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-teal-50 border border-[#00677d]/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tambah Kegiatan</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(day.activities || []).map((activity, actIdx) => (
                        <div key={actIdx} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#00677d] shrink-0 ml-1" />
                          <Input
                            placeholder={`Kegiatan ${actIdx + 1}, contoh: ${
                              actIdx === 0
                                ? "Meeting point & perkenalan grup"
                                : "Perjalanan menuju lokasi wisata"
                            }`}
                            value={activity}
                            onChange={(e) => updateActivity(idx, actIdx, e.target.value)}
                            className="text-xs bg-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeActivity(idx, actIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus kegiatan ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!day.activities || day.activities.length === 0) && (
                        <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-center">
                          <p className="text-[11px] text-slate-400">
                            Belum ada rincian kegiatan untuk hari ini.
                          </p>
                          <button
                            type="button"
                            onClick={() => addActivity(idx)}
                            className="mt-1 text-[11px] font-bold text-[#00677d] hover:underline"
                          >
                            + Klik untuk menambah kegiatan
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 4: SEO & Custom Schema.org (Optional) */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <div
            onClick={() => setIsSeoOpen(!isSeoOpen)}
            className="flex items-center justify-between cursor-pointer select-none border-b border-slate-100 pb-2"
          >
            <div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#00677d]" />
                <h2 className="font-heading font-bold text-sm text-[#191c1e]">
                  4. Pengaturan SEO & Schema.org (Opsional)
                </h2>
                <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 font-medium">
                  Per-Destinasi Override
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Kustomisasi title, meta description, keywords, OG Image, dan JSON-LD khusus destinasi ini.
              </p>
            </div>
            <button type="button" className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50">
              {isSeoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {isSeoOpen && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Custom SEO Meta Title
                </label>
                <Input
                  placeholder={`Default: ${title || "Judul Destinasi"} — Yogyakarta Sharing Tour (Max 6 Pax)`}
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="text-xs bg-white"
                />
                <p className="text-[10px] text-slate-400">
                  Kosongkan jika ingin memakai judul destinasi default.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Custom SEO Meta Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat yang tampil di hasil pencarian Google..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#00677d] focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Rekomendasi 140–160 karakter untuk hasil pencarian Google yang optimal.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Target Keywords (Pisahkan dengan koma)
                  </label>
                  <Input
                    placeholder="trip jogja, open trip bromo, paket 6 pax"
                    value={seoKeywordsText}
                    onChange={(e) => setSeoKeywordsText(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Custom OpenGraph (OG) Image URL
                  </label>
                  <Input
                    placeholder="Default memakai Cover Image destinasi"
                    value={seoOgImage}
                    onChange={(e) => setSeoOgImage(e.target.value)}
                    className="text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-[#00677d]" />
                    <span>Custom JSON-LD Schema (Schema.org)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Format JSON Valid</span>
                </div>
                <textarea
                  rows={4}
                  placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "TouristTrip",\n  "name": "${title || "Paket Wisata"}"\n}`}
                  value={customSchemaJson}
                  onChange={(e) => setCustomSchemaJson(e.target.value)}
                  className="w-full font-mono rounded-lg border border-slate-200 bg-slate-900 text-slate-100 p-3 text-xs focus:border-[#00677d] focus:outline-none"
                />
                <p className="text-[10px] text-slate-400">
                  Jika diisi JSON valid, schema ini akan menggantikan auto-generated TouristTrip schema.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="destNewNoIndex"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="rounded border-slate-300 text-[#00677d] focus:ring-[#00677d]"
                />
                <label htmlFor="destNewNoIndex" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Cegah mesin pencari mengindeks destinasi ini (noindex / nofollow)
                </label>
              </div>
            </div>
          )}
        </Card>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/destinations")}
            className="flex-1 justify-center"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 justify-center bg-[#00677d] text-white"
          >
            {isSubmitting ? "Mempublikasikan..." : "Publikasikan Destinasi"}
          </Button>
        </div>
      </form>
    </div>
  );
}

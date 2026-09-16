"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Save,
  Loader2,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  Code2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { ImageUploader } from "@/src/components/ui/image-uploader";
import { adminService } from "@/src/services/admin.service";
import { getDestinationTitle, getDestinationPrice } from "@/src/lib/utils";
import type { ItineraryDay } from "@/src/types";

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const destinationId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState(2);
  const [durationNights, setDurationNights] = useState(1);
  const [pricePerPax, setPricePerPax] = useState<number | string>(0);
  const [coverImage, setCoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Dynamic SEO & Schema Overrides
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywordsText, setSeoKeywordsText] = useState("");
  const [seoOgImage, setSeoOgImage] = useState("");
  const [customSchemaJson, setCustomSchemaJson] = useState("");
  const [noIndex, setNoIndex] = useState(false);
  const [isSeoOpen, setIsSeoOpen] = useState(false);

  // Inclusions & Exclusions String
  const [inclusionsText, setInclusionsText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");

  // Dynamic Itinerary Days
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadDestination() {
      if (!destinationId) return;
      setIsLoading(true);
      try {
        const dest = await adminService.getDestinationById(destinationId);
        if (dest && isMounted) {
          setTitle(getDestinationTitle(dest));
          setSlug(dest.slug || "");
          setTagline(dest.tagline || "");
          setDescription(dest.description || "");
          setLocation(dest.location || "");
          setDurationDays(dest.durationDays || 2);
          setDurationNights(dest.durationNights || 1);
          setPricePerPax(getDestinationPrice(dest) || 0);
          setCoverImage(dest.coverImage || dest.image || dest.imageUrl || "");
          const rawDest = dest as unknown as Record<string, unknown>;
          const gallery = (dest.galleryImages || rawDest.gallery || rawDest.images || []) as string[];
          setGalleryImages(Array.isArray(gallery) ? gallery : []);
          setMeetingPoint(dest.meetingPoint || "Stasiun / Bandara Terdekat");
          setIsPopular(Boolean(dest.isPopular));
          setIsActive(dest.isActive !== undefined ? Boolean(dest.isActive) : true);

          // SEO fields
          setSeoTitle(dest.seoTitle || "");
          setSeoDescription(dest.seoDescription || "");
          setSeoKeywordsText(Array.isArray(dest.seoKeywords) ? dest.seoKeywords.join(", ") : "");
          setSeoOgImage(dest.seoOgImage || "");
          setCustomSchemaJson(dest.customSchemaJson || "");
          setNoIndex(Boolean(dest.noIndex));
          if (dest.seoTitle || dest.seoDescription || dest.customSchemaJson || dest.noIndex) {
            setIsSeoOpen(true);
          }

          const incl = dest.inclusions || dest.includedFacilities || [];
          setInclusionsText(incl.join(", "));

          const excl = dest.exclusions || dest.excludedFacilities || [];
          setExclusionsText(excl.join(", "));

          if (Array.isArray(dest.itinerary) && dest.itinerary.length > 0) {
            setItinerary(
              dest.itinerary.map((d, i) => ({
                day: d.day || i + 1,
                title: d.title || `Hari ke-${i + 1}`,
                description: d.description || "",
                activities: Array.isArray(d.activities)
                  ? d.activities
                  : typeof (d as unknown as { activities: unknown }).activities === "string"
                  ? ((d as unknown as { activities: string }).activities as string)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [],
              }))
            );
          } else {
            setItinerary([
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
          }
        }
      } catch {
        if (isMounted) {
          setFeedback({ type: "error", message: "Gagal memuat data destinasi dari server." });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDestination();
    return () => {
      isMounted = false;
    };
  }, [destinationId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
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
    setFeedback(null);
    try {
      const cleanedItinerary = itinerary.map((item) => ({
        ...item,
        activities: (item.activities || []).map((a) => a.trim()).filter(Boolean),
      }));

      await adminService.updateDestination(destinationId, {
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
        isPopular,
        isActive,
        inclusions: inclusionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        exclusions: exclusionsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        itinerary: cleanedItinerary,
        maxGroupCapacity: 6,
        seoTitle: seoTitle.trim() || null,
        seoDescription: seoDescription.trim() || null,
        seoKeywords: seoKeywordsText ? seoKeywordsText.split(",").map((s) => s.trim()).filter(Boolean) : [],
        seoOgImage: seoOgImage.trim() || null,
        customSchemaJson: customSchemaJson.trim() || null,
        noIndex,
      });

      setFeedback({ type: "success", message: "Data destinasi berhasil diperbarui!" });
      setTimeout(() => {
        router.push("/admin/destinations");
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui destinasi.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <p className="font-semibold text-slate-600">Memuat formulir edit destinasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header Back & Action */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link href="/admin/destinations">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-[#191c1e]">
              Edit Paket Destinasi Wisata
            </h1>
            <p className="text-xs text-slate-500">ID: {destinationId}</p>
          </div>
        </div>

        <Badge variant="coral" className="text-xs font-bold px-3 py-1">
          Max 6-Pax Standard
        </Badge>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-semibold">{feedback.message}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Informasi Utama */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <h2 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2">
            1. Informasi Master Destinasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nama / Judul Paket Wisata *
              </label>
              <Input
                required
                placeholder="Contoh: Bromo Midnight & Sunrise Safari"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                URL Slug
              </label>
              <Input
                placeholder="contoh: bromo-midnight-sunrise-safari"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Lokasi / Wilayah *
              </label>
              <div className="relative">
                <MapPin className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  required
                  placeholder="Contoh: Probolinggo, Jawa Timur"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-xs pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Meeting Point Kumpul *
              </label>
              <Input
                required
                placeholder="Contoh: Stasiun Malang Kota Baru (Pintu Timur)"
                value={meetingPoint}
                onChange={(e) => setMeetingPoint(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Tagline Singkat (Catchy)
            </label>
            <Input
              placeholder="Contoh: Jelajahi keajaiban kawah Bromo dan lautan pasir bersama grup seru."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Deskripsi Lengkap
            </label>
            <textarea
              rows={4}
              placeholder="Jelaskan detail pengalaman, pesona alam, dan kenyamanan trip..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 placeholder-slate-400 focus:border-[#00677d] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <ImageUploader
              mode="single"
              folder="destinations"
              label="Foto Cover Destinasi *"
              value={coverImage}
              onChange={setCoverImage}
              helperText="Unggah gambar utama beresolusi tinggi (16:9) untuk cover katalog destinasi."
            />
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <ImageUploader
              mode="multiple"
              folder="destinations"
              label="Galeri Foto Destinasi (Maks. 10 Foto)"
              values={galleryImages}
              onChangeMultiple={setGalleryImages}
              helperText="Unggah foto-foto suasana dan dokumentasi destinasi."
              maxFiles={10}
            />
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#00677d] rounded"
              />
              <span>Status Aktif (Tampil di Katalog Publik)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="h-4 w-4 accent-[#00677d] rounded"
              />
              <span>Tandai sebagai Destinasi Populer ⭐</span>
            </label>
          </div>
        </Card>

        {/* Card 2: Durasi & Harga Sharing */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <h2 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2">
            2. Durasi & Biaya Trip Sharing (Max 6 Pax)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Durasi Hari (Days) *
              </label>
              <Input
                required
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Durasi Malam (Nights) *
              </label>
              <Input
                required
                type="number"
                min={0}
                value={durationNights}
                onChange={(e) => setDurationNights(Number(e.target.value))}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Harga Per Orang (IDR) *
              </label>
              <Input
                required
                type="number"
                step={10000}
                value={pricePerPax}
                onChange={(e) => setPricePerPax(Number(e.target.value))}
                className="text-xs font-bold text-[#a43c12]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                Fasilitas Termasuk (Pisahkan dengan koma)
              </label>
              <textarea
                rows={3}
                value={inclusionsText}
                onChange={(e) => setInclusionsText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#00677d] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-700 block">
                Tidak Termasuk (Pisahkan dengan koma)
              </label>
              <textarea
                rows={3}
                value={exclusionsText}
                onChange={(e) => setExclusionsText(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-[#00677d] focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Card 3: Dynamic Itinerary Builder */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="font-heading font-bold text-sm text-[#191c1e]">
                3. Rencana Perjalanan Harian (Itinerary)
              </h2>
              <p className="text-[11px] text-slate-500">Susun jadwal kegiatan untuk setiap harinya.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItineraryDay}
              className="text-xs gap-1 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              Tambah Hari
            </Button>
          </div>

          <div className="space-y-4">
            {itinerary.map((dayItem, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-xs text-[#00677d] bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    Hari ke-{dayItem.day}
                  </span>
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(index)}
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
                    <label className="text-[11px] font-bold text-slate-600 block">Judul Hari *</label>
                    <Input
                      placeholder="Contoh: Sunrise Bromo & Kawah Eksplorasi"
                      value={dayItem.title}
                      onChange={(e) => {
                        const updated = [...itinerary];
                        updated[index].title = e.target.value;
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
                      placeholder="Contoh: Menikmati pemandangan alam dan sesi foto bersama."
                      value={dayItem.description}
                      onChange={(e) => {
                        const updated = [...itinerary];
                        updated[index].description = e.target.value;
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
                        onClick={() => addActivity(index)}
                        className="text-[11px] font-bold text-[#00677d] hover:text-[#005566] flex items-center gap-1 px-2 py-0.5 rounded-lg hover:bg-teal-50 border border-[#00677d]/20 transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Tambah Kegiatan</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(dayItem.activities || []).map((activity, actIdx) => (
                        <div key={actIdx} className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-[#00677d] shrink-0 ml-1" />
                          <Input
                            placeholder={`Kegiatan ${actIdx + 1}, contoh: ${
                              actIdx === 0
                                ? "Meeting point & perkenalan grup"
                                : "Perjalanan menuju lokasi wisata"
                            }`}
                            value={activity}
                            onChange={(e) => updateActivity(index, actIdx, e.target.value)}
                            className="text-xs bg-white flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeActivity(index, actIdx)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus kegiatan ini"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {(!dayItem.activities || dayItem.activities.length === 0) && (
                        <div className="p-3 rounded-xl bg-white border border-dashed border-slate-200 text-center">
                          <p className="text-[11px] text-slate-400">
                            Belum ada rincian kegiatan untuk hari ini.
                          </p>
                          <button
                            type="button"
                            onClick={() => addActivity(index)}
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
                  id="destNoIndex"
                  checked={noIndex}
                  onChange={(e) => setNoIndex(e.target.checked)}
                  className="rounded border-slate-300 text-[#00677d] focus:ring-[#00677d]"
                />
                <label htmlFor="destNoIndex" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Cegah mesin pencari mengindeks destinasi ini (noindex / nofollow)
                </label>
              </div>
            </div>
          )}
        </Card>

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/admin/destinations">Batal</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="rounded-xl gap-2 font-bold px-8 shadow-md"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </form>
    </div>
  );
}

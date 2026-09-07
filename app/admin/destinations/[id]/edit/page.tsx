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
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState(2);
  const [durationNights, setDurationNights] = useState(1);
  const [pricePerPax, setPricePerPax] = useState(850000);
  const [coverImage, setCoverImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [meetingPoint, setMeetingPoint] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

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
          setTagline(dest.tagline || "");
          setDescription(dest.description || "");
          setLocation(dest.location || "");
          setDurationDays(dest.durationDays || 2);
          setDurationNights(dest.durationNights || 1);
          setPricePerPax(getDestinationPrice(dest) || 850000);
          setCoverImage(dest.coverImage || dest.image || dest.imageUrl || "");
          const rawDest = dest as unknown as Record<string, unknown>;
          const gallery = (dest.galleryImages || rawDest.gallery || rawDest.images || []) as string[];
          setGalleryImages(Array.isArray(gallery) ? gallery : []);
          setMeetingPoint(dest.meetingPoint || "Stasiun / Bandara Terdekat");
          setIsPopular(Boolean(dest.isPopular));
          setIsActive(dest.isActive !== undefined ? Boolean(dest.isActive) : true);

          const incl = dest.inclusions || dest.includedFacilities || [];
          setInclusionsText(incl.join(", "));

          const excl = dest.exclusions || dest.excludedFacilities || [];
          setExclusionsText(excl.join(", "));

          if (Array.isArray(dest.itinerary) && dest.itinerary.length > 0) {
            setItinerary(dest.itinerary);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !pricePerPax) {
      setFeedback({ type: "error", message: "Harap lengkapi semua kolom wajib (*)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.updateDestination(destinationId, {
        title,
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
        itinerary,
        maxGroupCapacity: 6,
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

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Nama / Judul Paket Wisata *
            </label>
            <Input
              required
              placeholder="Contoh: Bromo Midnight & Sunrise Safari"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
            />
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
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-extrabold text-xs text-[#00677d] bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    Hari ke-{dayItem.day}
                  </span>
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(index)}
                      className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1 font-semibold"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">Judul Hari</label>
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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    Aktivitas (Pisahkan tiap aktivitas dengan tanda koma)
                  </label>
                  <textarea
                    rows={2}
                    value={dayItem.activities?.join(", ") || ""}
                    onChange={(e) => {
                      const updated = [...itinerary];
                      updated[index].activities = e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setItinerary(updated);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-[#00677d] focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
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

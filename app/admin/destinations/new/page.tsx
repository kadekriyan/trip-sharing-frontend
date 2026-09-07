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
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [durationDays, setDurationDays] = useState(2);
  const [durationNights, setDurationNights] = useState(1);
  const [pricePerPax, setPricePerPax] = useState(850000);
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
  );
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [meetingPoint, setMeetingPoint] = useState("Meeting Point Utama (Stasiun / Bandara)");

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
    try {
      await adminService.addDestination({
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
        inclusions: inclusionsText.split(",").map((s) => s.trim()),
        exclusions: exclusionsText.split(",").map((s) => s.trim()),
        highlights: ["Eksplorasi Alam Terbaik", "Grup Nyaman Maks 6 Pax"],
        itinerary,
        maxGroupCapacity: 6,
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
                onChange={(e) => setTitle(e.target.value)}
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
                placeholder="850000"
                value={pricePerPax}
                onChange={(e) => setPricePerPax(Number(e.target.value))}
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
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="azure" className="font-bold">
                    Hari ke-{day.day}
                  </Badge>
                  {itinerary.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItineraryDay(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder={`Judul Aktivitas Hari ${day.day}`}
                    value={day.title}
                    onChange={(e) => {
                      const updated = [...itinerary];
                      updated[idx].title = e.target.value;
                      setItinerary(updated);
                    }}
                  />
                  <Input
                    placeholder="Deskripsi singkat kegiatan..."
                    value={day.description}
                    onChange={(e) => {
                      const updated = [...itinerary];
                      updated[idx].description = e.target.value;
                      setItinerary(updated);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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

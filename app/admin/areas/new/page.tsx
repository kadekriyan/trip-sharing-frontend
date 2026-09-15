"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  MapPin,
  FileText,
  Sparkles,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { adminService } from "@/src/services/admin.service";

const PROVINCE_PRESETS = [
  "DI Yogyakarta",
  "Jawa Timur",
  "Jawa Tengah",
  "Jawa Barat",
  "DKI Jakarta",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Sumatera Utara",
  "Sumatera Barat",
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export default function NewAreaPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("Jawa Timur");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManual(true);
    setSlug(slugify(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFeedback({ type: "error", message: "Harap isi nama wilayah operasional (*)." });
      return;
    }

    const finalSlug = slug.trim() || slugify(name);

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.createArea({
        name: name.trim(),
        slug: finalSlug,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      });

      setFeedback({ type: "success", message: "Wilayah operasional berhasil ditambahkan!" });
      setTimeout(() => {
        router.push("/admin/areas");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan wilayah operasional.";
      setFeedback({ type: "error", message: msg });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/areas"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Wilayah
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <Compass className="h-6 w-6 text-[#00677d]" />
            Tambah Wilayah Operasional Baru
          </h1>
        </div>
        <Badge variant="azure">Master Data Wilayah</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Form Card */}
        <Card className="p-6 border border-slate-200/90 rounded-2xl shadow-sm bg-white space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            <h2 className="font-heading font-bold text-base text-slate-900">
              Informasi Utama Wilayah Operasional
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Area Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Nama Wilayah Operasional <span className="text-rose-500">*</span>
              </label>
              <Input
                value={name}
                onChange={handleNameChange}
                placeholder="Contoh: Malang Raya, Banyuwangi & Ijen, Bali Selatan"
                required
                className="text-xs h-10 rounded-xl"
              />
              <span className="text-[11px] text-slate-400">
                Nama grup wilayah yang akan tampil pada filter driver, armada, dan destinasi.
              </span>
            </div>

            {/* Slug */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block flex items-center justify-between">
                <span>Slug Identifier</span>
                {!isSlugManual && (
                  <span className="text-[10px] text-teal-700 font-normal">
                    (Auto-generate aktif)
                  </span>
                )}
              </label>
              <Input
                value={slug}
                onChange={handleSlugChange}
                placeholder="contoh: malang-raya"
                className="text-xs h-10 rounded-xl font-mono text-slate-700"
              />
              <span className="text-[11px] text-slate-400">
                Digunakan untuk parameter URL API filter, misal: <code>?area={slug || "nama-area"}</code>
              </span>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                Kota / Kabupaten
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Malang, Denpasar, Sleman"
                className="text-xs h-10 rounded-xl"
              />
            </div>

            {/* Province */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                Provinsi
              </label>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Contoh: Jawa Timur, Bali"
                className="text-xs h-10 rounded-xl"
              />
            </div>

            {/* Quick Province Presets */}
            <div className="sm:col-span-2 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Saran Provinsi Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROVINCE_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvince(p)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                      province === p
                        ? "bg-[#00677d] text-white border-[#00677d] font-bold"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Deskripsi Cakupan Area
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Tuliskan keterangan cakupan wilayah, misal: Meliputi Kota Malang, Kota Batu, dan Kabupaten Malang."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00677d] transition-all bg-white text-slate-800"
              />
            </div>

            {/* Status Active */}
            <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Status Operasional
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="isActive"
                    checked={isActive === true}
                    onChange={() => setIsActive(true)}
                    className="text-[#00677d] focus:ring-[#00677d]"
                  />
                  <span>Aktif (Siap Menerima Alokasi Driver & Armada)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="isActive"
                    checked={isActive === false}
                    onChange={() => setIsActive(false)}
                    className="text-slate-400 focus:ring-slate-400"
                  />
                  <span>Non-Aktif (Ditutup Sementara)</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Live Preview Card */}
        {name.trim() && (
          <Card className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00677d]">
              <Sparkles className="h-4 w-4" />
              Preview Kartu Wilayah Operasional
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-teal-100/80 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-teal-50 text-[#00677d] flex items-center justify-center font-bold">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-sm text-slate-900">{name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span>{city || "Kota"}</span>
                    <span>•</span>
                    <span>{province || "Provinsi"}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">slug: {slug || slugify(name)}</span>
                  </div>
                </div>
              </div>
              <Badge className={isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500"}>
                {isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </Card>
        )}

        {/* Action Feedback Banner */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link href="/admin/areas">
            <Button
              type="button"
              variant="outline"
              className="text-xs font-bold rounded-xl px-5 h-10 border-slate-200"
            >
              Batal
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-bold rounded-xl px-6 h-10 shadow-md flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Compass className="h-4 w-4" />
                Simpan Wilayah Operasional
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

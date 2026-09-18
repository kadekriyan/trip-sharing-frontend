"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Compass,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building,
  MapPin,
  FileText,
  UserCheck,
  Car,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { adminService } from "@/src/services/admin.service";
import type { Area } from "@/src/types";

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
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

export default function EditAreaPage() {
  const router = useRouter();
  const params = useParams();
  const areaId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [driversCount, setDriversCount] = useState(0);
  const [vehiclesCount, setVehiclesCount] = useState(0);

  // Delete modal state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAreaData() {
      if (!areaId) return;
      setIsLoading(true);
      try {
        const area = await adminService.getAreaById(areaId);
        if (isMounted && area) {
          setName(area.name || "");
          setSlug(area.slug || "");
          setCity(area.city || "");
          setProvince(area.province || "Jawa Timur");
          setDescription(area.description || "");
          const activeStatus = area.isActive !== undefined ? area.isActive : area.is_active;
          setIsActive(activeStatus !== false);
          setDriversCount(area.driversCount || 0);
          setVehiclesCount(area.vehiclesCount || 0);
        }
      } catch {
        if (isMounted) {
          setFeedback({ type: "error", message: "Gagal memuat data wilayah operasional dari server." });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAreaData();
    return () => {
      isMounted = false;
    };
  }, [areaId]);

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
      await adminService.updateArea(areaId, {
        name: name.trim(),
        slug: finalSlug,
        city: city.trim() || undefined,
        province: province.trim() || undefined,
        description: description.trim() || undefined,
        isActive,
      });

      setFeedback({ type: "success", message: "Perubahan wilayah operasional berhasil disimpan!" });
      setTimeout(() => {
        router.push("/admin/areas");
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui wilayah operasional.";
      setFeedback({ type: "error", message: msg });
      setIsSubmitting(false);
    }
  };

  const handleDeleteArea = async () => {
    setIsDeleting(true);
    try {
      await adminService.deleteArea(areaId);
      setIsDeleteDialogOpen(false);
      router.push("/admin/areas");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus wilayah operasional.";
      setFeedback({ type: "error", message: msg });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#00677d]" />
        <p className="text-xs font-semibold">Memuat data wilayah operasional...</p>
      </div>
    );
  }

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
            Edit Wilayah: {name}
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDeleteDialogOpen(true)}
          className="text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-xl flex items-center gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Hapus Area
        </Button>
      </div>

      {/* Resource Stats Quick Info */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/admin/areas/drivers?areaId=${areaId}`}
          className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Driver di Area Ini</span>
              <p className="text-lg font-extrabold text-blue-700">{driversCount} Personil</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 group-hover:underline">Kelola &rarr;</span>
        </Link>

        <Link
          href={`/admin/vehicles?areaId=${areaId}`}
          className="group p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-amber-300 transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Armada di Area Ini</span>
              <p className="text-lg font-extrabold text-amber-700">{vehiclesCount} Kendaraan</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 group-hover:underline">Kelola &rarr;</span>
        </Link>
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
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Malang Raya, Banyuwangi & Ijen, Bali Selatan"
                required
                className="text-xs h-10 rounded-xl"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Slug Identifier (URL param)
              </label>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="contoh: malang-raya"
                className="text-xs h-10 rounded-xl font-mono text-slate-700"
              />
              <span className="text-[11px] text-slate-400">
                Digunakan untuk filter API: <code>?area={slug || "nama-area"}</code>
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
                Menyimpan Perubahan...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="h-10 w-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-1">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
              Hapus Wilayah Operasional?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Apakah Anda yakin ingin menghapus wilayah operasional{" "}
              <strong className="text-slate-800 font-semibold">{name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          {(driversCount > 0 || vehiclesCount > 0) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Perhatian: Resource masih terhubung!
              </div>
              <p className="text-[11px] text-amber-800">
                Terdapat <strong>{driversCount} driver</strong> dan <strong>{vehiclesCount} armada</strong> yang tercatat di area ini.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="text-xs font-semibold rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteArea}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Ya, Hapus Area
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

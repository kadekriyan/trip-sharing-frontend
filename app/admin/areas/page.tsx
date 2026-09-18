"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Compass,
  MapPin,
  Building,
  UserCheck,
  Car,
  Loader2,
  PackageOpen,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { adminService } from "@/src/services/admin.service";
import type { Area } from "@/src/types";

export default function AreasAdminPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [provinceFilter, setProvinceFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const areasData = await adminService.getAreas();
      setAreas(areasData);
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteSubmit = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await adminService.deleteArea(deleteTarget.id);
      setActionFeedback({
        type: "success",
        message: res.message || `Wilayah "${deleteTarget.name}" berhasil dihapus.`,
      });
      setDeleteTarget(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus wilayah operasional.";
      setActionFeedback({ type: "error", message: msg });
    } finally {
      setIsDeleting(false);
    }
  };

  // Dynamic Provinces list for filter
  const provinceOptions = useMemo(() => {
    const list = new Set<string>();
    areas.forEach((a) => {
      if (a.province && a.province.trim()) {
        list.add(a.province.trim());
      }
    });
    return Array.from(list).sort();
  }, [areas]);

  // Metrics
  const metrics = useMemo(() => {
    const total = areas.length;
    const active = areas.filter((a) => a.isActive || a.is_active).length;
    const totalDrivers = areas.reduce((acc, curr) => acc + (curr.driversCount || 0), 0);
    const totalVehicles = areas.reduce((acc, curr) => acc + (curr.vehiclesCount || 0), 0);
    return { total, active, totalDrivers, totalVehicles };
  }, [areas]);

  // Filtered Areas
  const filteredAreas = useMemo(() => {
    return areas.filter((area) => {
      const name = (area.name || "").toLowerCase();
      const slug = (area.slug || "").toLowerCase();
      const city = (area.city || "").toLowerCase();
      const province = (area.province || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesQuery =
        !query ||
        name.includes(query) ||
        slug.includes(query) ||
        city.includes(query) ||
        province.includes(query);

      const isActive = area.isActive !== undefined ? area.isActive : area.is_active;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      const matchesProvince =
        provinceFilter === "all" ||
        (area.province && area.province.trim() === provinceFilter);

      return matchesQuery && matchesStatus && matchesProvince;
    });
  }, [areas, searchQuery, statusFilter, provinceFilter]);

  const handleResetFilter = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProvinceFilter("all");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-[#00677d]">
              <Compass className="h-6 w-6" />
            </span>
            <div>
              <h1 className="font-heading text-2xl font-extrabold text-[#191c1e]">
                Wilayah Operasional (Areas)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola cakupan kota & wilayah untuk pengelompokan driver dan armada trip sharing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/areas/new">
            <Button className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all">
              <Plus className="h-4 w-4" />
              Tambah Area Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            actionFeedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Wilayah
            </span>
            <Compass className="h-4 w-4 text-[#00677d]" />
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2 font-heading">
            {metrics.total}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Wilayah terdaftar
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Area Aktif
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2 font-heading">
            {metrics.active}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Melayani operasional
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Driver Terhubung
            </span>
            <UserCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-600 mt-2 font-heading">
            {metrics.totalDrivers}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Personil teralokasi
          </span>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Armada Terhubung
            </span>
            <Car className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2 font-heading">
            {metrics.totalVehicles}
          </p>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Kendaraan operasional
          </span>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama area, slug, kota, provinsi..."
              className="pl-9 bg-slate-50 border-slate-200 text-xs rounded-xl focus:bg-white transition-all h-10"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00677d] text-slate-700 font-medium"
            >
              <option value="all">Semua Status Operasional</option>
              <option value="active">Hanya Area Aktif</option>
              <option value="inactive">Hanya Area Non-Aktif</option>
            </select>
          </div>

          {/* Province Filter */}
          <div className="flex gap-2">
            <select
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00677d] text-slate-700 font-medium"
            >
              <option value="all">Semua Provinsi</option>
              {provinceOptions.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>

            {(searchQuery || statusFilter !== "all" || provinceFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                className="h-10 px-3 text-xs text-slate-600 hover:text-slate-900 border-slate-200 rounded-xl shrink-0"
                title="Reset Filter"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Content Area List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00677d]" />
          <p className="text-xs font-semibold">Memuat data wilayah operasional...</p>
        </div>
      ) : filteredAreas.length === 0 ? (
        <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <PackageOpen className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-bold text-sm text-slate-700">
            Tidak ada wilayah operasional ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== "all" || provinceFilter !== "all"
              ? "Coba ubah kata kunci pencarian atau sesuaikan filter status dan provinsi."
              : "Belum ada data wilayah operasional. Mulai dengan menambahkan area baru seperti Malang, Banyuwangi, Bali, atau Jogja."}
          </p>
          <div className="pt-2">
            <Link href="/admin/areas/new">
              <Button className="bg-[#00677d] hover:bg-[#005264] text-white text-xs font-bold rounded-xl px-4 py-2">
                <Plus className="h-4 w-4 mr-1.5" />
                Tambah Area Baru
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAreas.map((area) => {
            const isActive = area.isActive !== undefined ? area.isActive : area.is_active;

            return (
              <Card
                key={area.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Bar: Title & Active Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-xl bg-teal-50 border border-teal-100 text-[#00677d] flex items-center justify-center font-bold shrink-0">
                        <Compass className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-base text-slate-900 leading-snug">
                          {area.name}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400">
                          slug: {area.slug}
                        </span>
                      </div>
                    </div>

                    <Badge
                      className={`text-[10px] font-bold shrink-0 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>

                  {/* Location Info */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Building className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-700">
                        {area.city || "Kota belum diset"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <MapPin className="h-3.5 w-3.5 text-[#00677d]" />
                      <span className="text-slate-600">
                        {area.province || "Provinsi belum diset"}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {area.description && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
                      {area.description}
                    </p>
                  )}

                  {/* Resource Counts Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                    <Link
                      href={`/admin/areas/drivers?areaId=${area.id}`}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-100 transition-colors"
                      title="Lihat driver di area ini"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-[11px] font-bold text-blue-900">
                          {area.driversCount ?? 0} Driver
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-blue-400 group-hover:text-blue-600 transition-colors" />
                    </Link>

                    <Link
                      href={`/admin/vehicles?areaId=${area.id}`}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-100 transition-colors"
                      title="Lihat armada di area ini"
                    >
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-amber-600" />
                        <span className="text-[11px] font-bold text-amber-900">
                          {area.vehiclesCount ?? 0} Armada
                        </span>
                      </div>
                      <ExternalLink className="h-3 w-3 text-amber-400 group-hover:text-amber-600 transition-colors" />
                    </Link>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <Link href={`/admin/areas/${area.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs font-bold text-slate-700 hover:text-[#00677d] hover:bg-teal-50 border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Area
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(area)}
                    className="h-8 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Hapus area ini"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
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
              <strong className="text-slate-800 font-semibold">{deleteTarget?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && ((deleteTarget.driversCount || 0) > 0 || (deleteTarget.vehiclesCount || 0) > 0) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Perhatian: Area ini memiliki resource aktif!
              </div>
              <p className="text-[11px] text-amber-800">
                Terdapat <strong>{deleteTarget.driversCount || 0} driver</strong> dan{" "}
                <strong>{deleteTarget.vehiclesCount || 0} armada</strong> yang masih terpasang pada area ini.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="text-xs font-semibold rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteSubmit}
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

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Calendar,
  MapPin,
  CornerDownRight,
  Send,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { reviewService } from "@/src/services/review.service";
import { formatDate } from "@/src/lib/utils";
import type { Review, ReviewStatus } from "@/src/types";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReviewStatus>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Reject Modal State
  const [rejectTarget, setRejectTarget] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Reply Modal State
  const [replyTarget, setReplyTarget] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  // Loading indicator for quick actions
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const reloadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await reviewService.listAdminReviews({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 100,
      });
      setReviews(res.reviews);
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal memuat daftar ulasan",
      });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const res = await reviewService.listAdminReviews({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          limit: 100,
        });
        if (!ignore) {
          setReviews(res.reviews);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setFeedback({
            type: "error",
            message: err instanceof Error ? err.message : "Gagal memuat daftar ulasan",
          });
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === "PENDING").length;
    const approved = reviews.filter((r) => r.status === "APPROVED").length;
    const rejected = reviews.filter((r) => r.status === "REJECTED").length;
    const sumRating = approved > 0 ? reviews.filter((r) => r.status === "APPROVED").reduce((acc, r) => acc + (r.rating || 0), 0) : 0;
    const avgRating = approved > 0 ? (sumRating / approved).toFixed(1) : "0.0";
    return { total, pending, approved, rejected, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const customer = (rev.participant?.fullName || rev.participant?.full_name || "").toLowerCase();
      const dest = (rev.destination?.name || rev.destination?.title || "").toLowerCase();
      const comment = (rev.comment || "").toLowerCase();
      return customer.includes(q) || dest.includes(q) || comment.includes(q);
    });
  }, [reviews, searchQuery]);

  // Quick Approve Action
  const handleApprove = async (review: Review) => {
    try {
      setActionLoadingId(review.id);
      await reviewService.moderateReview(review.id, { status: "APPROVED" });
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: "APPROVED" as ReviewStatus } : r))
      );
      setFeedback({
        type: "success",
        message: `Ulasan dari ${review.participant?.fullName || review.participant?.full_name || "Peserta"} disetujui dan kini tayang di halaman destinasi.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyetujui ulasan",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject Confirmation
  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    try {
      setIsRejecting(true);
      await reviewService.moderateReview(rejectTarget.id, {
        status: "REJECTED",
        admin_notes: rejectReason || undefined,
      });
      setReviews((prev) =>
        prev.map((r) =>
          r.id === rejectTarget.id ? { ...r, status: "REJECTED" as ReviewStatus, admin_notes: rejectReason } : r
        )
      );
      setFeedback({
        type: "success",
        message: `Ulasan ditolak dan tidak akan dipublikasikan.`,
      });
      setRejectTarget(null);
      setRejectReason("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menolak ulasan",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Submit Admin Reply
  const handleSubmitReply = async () => {
    if (!replyTarget || !replyText.trim()) return;
    try {
      setIsReplying(true);
      const updated = await reviewService.replyReview(replyTarget.id, {
        reply: replyText.trim(),
      });
      setReviews((prev) =>
        prev.map((r) => (r.id === replyTarget.id ? { ...r, admin_reply: updated.admin_reply, admin_reply_at: updated.admin_reply_at } : r))
      );
      setFeedback({
        type: "success",
        message: `Tanggapan resmi pengelola berhasil disimpan.`,
      });
      setReplyTarget(null);
      setReplyText("");
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Gagal menyimpan tanggapan pengelola",
      });
    } finally {
      setIsReplying(false);
    }
  };

  const getStatusBadge = (status: ReviewStatus | string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">Disetujui (Tayang)</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold">Ditolak</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold">Menunggu Review</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#00677d] block mb-1">
            Ulasan Terverifikasi
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Moderasi Ulasan Peserta Trip
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tinjau, setujui, atau tolak ulasan yang dikirim oleh peserta terverifikasi, serta berikan balasan resmi.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => reloadReviews()}
          disabled={isLoading}
          className="font-bold text-xs gap-1.5 shrink-0 self-start sm:self-auto text-slate-700"
        >
          {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Filter className="h-3.5 w-3.5" />}
          Segarkan Data
        </Button>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs underline ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Ulasan Masuk
          </span>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-[#191c1e]">
            {stats.total}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Dari trip selesai</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 border border-amber-200/60 shadow-stitch-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
            Perlu Moderasi
          </span>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-amber-800">
            {stats.pending}
          </div>
          <span className="text-[11px] text-amber-600 mt-1 block">Menunggu keputusan admin</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/60 shadow-stitch-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
            Ulasan Disetujui
          </span>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-800">
            {stats.approved}
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">Tayang di halaman destinasi</span>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-sky-50/70 border border-sky-200/60 shadow-stitch-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 block mb-1">
            Rata-rata Rating
          </span>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-sky-900 flex items-center gap-1.5">
            <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
            <span>{stats.avgRating}</span>
          </div>
          <span className="text-[11px] text-sky-600 mt-1 block">Dari ulasan disetujui</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-100 shadow-stitch-card flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-[#00677d] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" && `Semua (${stats.total})`}
              {st === "PENDING" && `Menunggu (${stats.pending})`}
              {st === "APPROVED" && `Disetujui (${stats.approved})`}
              {st === "REJECTED" && `Ditolak (${stats.rejected})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari peserta, destinasi, ulasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-full border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* REVIEW CARDS LIST */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#00677d]" />
          <p className="text-xs font-medium">Memuat data ulasan...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-white border border-slate-100 shadow-stitch-card space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Star className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-extrabold text-base text-slate-800">
            Tidak ada ulasan ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "Tidak ada ulasan yang cocok dengan kata kunci pencarian Anda."
              : "Belum ada ulasan yang masuk pada kategori ini."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const customerName = rev.participant?.fullName || rev.participant?.full_name || "Peserta Anonim";
            const destTitle = rev.destination?.name || rev.destination?.title || "Destinasi Trip";
            const destSlug = rev.destination?.slug;
            const tripDate = rev.trip?.departure_date || rev.trip?.departureDate;

            return (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-100 shadow-stitch-card hover:border-slate-200 transition-all space-y-4"
              >
                {/* Header: Customer info + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#00677d] to-teal-400 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#191c1e] text-sm sm:text-base">
                          {customerName}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold gap-1"
                        >
                          <ShieldCheck className="h-3 w-3" />
                          Verified Guest
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="h-3 w-3 text-[#ff7f50]" />
                          {destSlug ? (
                            <Link
                              href={`/destinations/${destSlug}`}
                              target="_blank"
                              className="hover:underline flex items-center gap-1 text-[#00677d]"
                            >
                              <span>{destTitle}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          ) : (
                            destTitle
                          )}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Trip: {formatDate(tripDate || "")}
                        </span>
                        {rev.participant?.phone_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-slate-400">
                              {rev.participant.phone_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {getStatusBadge(rev.status)}
                    <span className="text-[11px] text-slate-400">
                      {formatDate(rev.submitted_at || rev.createdAt || "")}
                    </span>
                  </div>
                </div>

                {/* Rating & Comment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (rev.rating || 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200 fill-slate-100"
                        }`}
                      />
                    ))}
                    <span className="ml-1.5 font-bold text-xs text-slate-800">
                      {rev.rating}.0 / 5.0
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-2xl border border-slate-100">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>

                {/* Admin Reply Box if present */}
                {rev.admin_reply && (
                  <div className="ml-2 sm:ml-6 p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-teal-900 font-bold">
                      <span className="flex items-center gap-1.5">
                        <CornerDownRight className="h-3.5 w-3.5 text-teal-600" />
                        Balasan Resmi Java Shared Tour Jogja
                      </span>
                      <span className="text-[10px] text-teal-700 font-normal">
                        {formatDate(rev.admin_reply_at || "")}
                      </span>
                    </div>
                    <p className="text-teal-950 text-xs pl-5 leading-relaxed">
                      {rev.admin_reply}
                    </p>
                  </div>
                )}

                {/* Action Buttons Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyTarget(rev);
                        setReplyText(rev.admin_reply || "");
                      }}
                      className="h-8 text-xs font-semibold gap-1.5 text-teal-800 border-teal-200 hover:bg-teal-50"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                      <span>{rev.admin_reply ? "Edit Balasan" : "Balas Ulasan"}</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    {rev.status !== "APPROVED" && (
                      <Button
                        size="sm"
                        disabled={actionLoadingId === rev.id}
                        onClick={() => handleApprove(rev)}
                        className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {actionLoadingId === rev.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>Setujui (Terbitkan)</span>
                      </Button>
                    )}

                    {rev.status !== "REJECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRejectTarget(rev);
                          setRejectReason(rev.admin_notes || "");
                        }}
                        className="h-8 text-xs font-bold gap-1.5 text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        <XCircle className="h-3.5 w-3.5 text-rose-600" />
                        <span>Tolak Ulasan</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REJECT MODAL */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <XCircle className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
                  Tolak Publikasi Ulasan
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Ulasan yang ditolak tidak akan muncul di katalog publik destinasi.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {rejectTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-800">
                  {rejectTarget.participant?.fullName || rejectTarget.participant?.full_name || "Peserta"}
                </span>
                <p className="text-slate-600 italic line-clamp-2">
                  &ldquo;{rejectTarget.comment}&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Alasan Penolakan / Catatan Internal (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Mengandung kata-kata ofensif atau tidak relevan dengan pengalaman trip..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00677d]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectTarget(null)}
                  disabled={isRejecting}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirmReject}
                  disabled={isRejecting}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {isRejecting ? "Memproses..." : "Ya, Tolak Ulasan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADMIN REPLY MODAL */}
      <Dialog open={!!replyTarget} onOpenChange={(open) => !open && setReplyTarget(null)}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="font-heading font-extrabold text-lg text-slate-900">
                  Tanggapi Ulasan Wisatawan
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Balasan resmi dari Java Shared Tour Jogja akan ditampilkan tepat di bawah ulasan wisatawan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {replyTarget.participant?.fullName || replyTarget.participant?.full_name || "Peserta"}
                  </span>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${s <= replyTarget.rating ? "fill-amber-400" : "fill-slate-200 text-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 italic line-clamp-3">
                  &ldquo;{replyTarget.comment}&rdquo;
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Tulis Balasan Resmi Pengelola (1 Arah)
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Terima kasih Kak telah berlibur bersama Java Shared Tour Jogja! Senang sekali bisa menemani perjalanan Anda..."
                  className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00677d] leading-relaxed"
                />
                <p className="text-[11px] text-slate-400">
                  *Catatan: Komunikasi ini bersifat 1-arah. Wisatawan tidak dapat membalas kembali tanggapan ini.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyTarget(null)}
                  disabled={isReplying}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={isReplying || !replyText.trim()}
                  className="bg-[#00677d] hover:bg-[#005264] text-white font-bold gap-1.5"
                >
                  {isReplying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Balasan</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

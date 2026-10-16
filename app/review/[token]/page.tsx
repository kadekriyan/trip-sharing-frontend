"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  MapPin,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { reviewService } from "@/src/services/review.service";
import { formatDate } from "@/src/lib/utils";
import type { ReviewTokenVerification } from "@/src/types";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function SubmitReviewPage({ params }: PageProps) {
  const [token, setToken] = useState<string>("");
  const [tokenData, setTokenData] = useState<ReviewTokenVerification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    params.then((resolvedParams) => {
      if (isMounted) {
        setToken(resolvedParams.token);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const fetchVerification = async () => {
      try {
        setIsLoading(true);
        setFetchError(null);
        const data = await reviewService.verifyToken(token);
        if (isMounted) {
          setTokenData(data);
        }
      } catch (err: unknown) {
        const error = err as { message?: string };
        if (isMounted) {
          setFetchError(error.message || "Tautan ulasan tidak valid atau sudah kedaluwarsa");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const ratingDescriptions: Record<number, { text: string; color: string }> = {
    1: { text: "Sangat Kecewa", color: "text-rose-600" },
    2: { text: "Kurang Puas", color: "text-orange-500" },
    3: { text: "Cukup Baik", color: "text-amber-600" },
    4: { text: "Sangat Bagus", color: "text-emerald-600" },
    5: { text: "Luar Biasa & Sempurna", color: "text-[#00677d]" },
  };

  const activeRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (comment.trim().length < 3) {
      setSubmitError("Mohon tuliskan ulasan minimal 3 karakter");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await reviewService.submitReview(token, {
        rating,
        comment: comment.trim(),
      });
      setSubmitSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setSubmitError(error.message || "Gagal mengirimkan ulasan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="h-10 w-10 animate-spin text-[#00677d] mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Memverifikasi Tautan Ulasan...</h2>
          <p className="text-sm text-slate-500">
            Sistem sedang memeriksa data manifest tiket perjalanan Anda.
          </p>
        </div>
      </div>
    );
  }

  if (fetchError || !tokenData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
            <AlertCircle className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Tautan Ulasan Tidak Valid</h1>
            <p className="text-sm text-slate-600">
              {fetchError || "Tautan ulasan ini tidak ditemukan, sudah kedaluwarsa, atau nomor tiket tidak terdaftar pada manifest kami."}
            </p>
          </div>
          <div className="pt-2">
            <Link href="/destinations">
              <Button className="w-full bg-[#00677d] hover:bg-[#005364] font-semibold text-sm">
                Lihat Katalog Paket Tur
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted state
  if (tokenData.isSubmitted || submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-8 max-w-lg w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-11 w-11" />
          </div>

          <div className="space-y-2">
            <Badge variant="success" className="text-xs px-3 py-1 font-semibold">
              Ulasan Diterima
            </Badge>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Terima Kasih Banyak, Kak {tokenData.participantName}!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ulasan dan penilaian bintang Kakak untuk trip{" "}
              <strong className="text-slate-800">{tokenData.destinationTitle}</strong> telah
              berhasil dicatat. Masukan Kakak akan melalui moderasi tim pengelola sebelum
              tampil secara resmi pada halaman destinasi.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Destinasi:</span>
              <span className="font-semibold text-slate-800">{tokenData.destinationTitle}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tanggal Trip:</span>
              <span className="font-semibold text-slate-800">{formatDate(tokenData.departureDate)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Status Ulasan:</span>
              <span className="font-semibold text-amber-600">Menunggu Moderasi Admin</span>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/destinations">
              <Button className="w-full bg-[#00677d] hover:bg-[#005364] font-bold text-sm gap-2">
                Jelajahi Destinasi Lainnya <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Verifikasi Peserta Resmi Manifest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bagikan Pengalaman Perjalanan Anda
          </h1>
          <p className="text-sm text-slate-600">
            Penilaian jujur Anda membantu wisatawan lain dan meningkatkan kualitas layanan kami.
          </p>
        </div>

        {/* Trip Summary Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Paket Destinasi
              </p>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                <MapPin className="h-4 w-4 text-[#00677d] shrink-0" />
                <span>{tokenData.destinationTitle}</span>
              </h2>
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold border-slate-300">
              6-Pax Shared Tour
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Peserta: <strong className="text-slate-800">{tokenData.participantName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>
                Keberangkatan:{" "}
                <strong className="text-slate-800">{formatDate(tokenData.departureDate)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Form Review */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Star Rating Section */}
            <div className="space-y-3 text-center">
              <label className="block text-sm font-bold text-slate-800">
                Bagaimana penilaian keseluruhan perjalanan Anda?
              </label>

              <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= activeRating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                      aria-label={`Beri bintang ${starValue}`}
                    >
                      <Star
                        className={`h-9 w-9 sm:h-10 sm:w-10 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                            : "text-slate-300 hover:text-amber-200"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Description Label */}
              <div className="h-6">
                <p className={`text-sm font-bold tracking-wide ${ratingDescriptions[activeRating]?.color}`}>
                  {ratingDescriptions[activeRating]?.text}
                </p>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <label htmlFor="review-comment" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Ceritakan Pengalaman Anda (Ulasan Teks)
              </label>
              <textarea
                id="review-comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ceritakan keramahan supir, kenyamanan armada, keindahan objek wisata, atau tips berkesan bagi traveler berikutnya..."
                required
                maxLength={3000}
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:border-[#00677d] focus:ring-2 focus:ring-[#00677d]/20 transition-all resize-y placeholder:text-slate-400 leading-relaxed text-slate-800"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-1">
                <span>Minimal 3 karakter</span>
                <span>{comment.length} / 3000 karakter</span>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || comment.trim().length < 3}
              className="w-full h-12 bg-[#00677d] hover:bg-[#005364] text-white font-bold text-sm rounded-xl shadow-md transition-all gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirimkan Ulasan...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  <span>Kirim Ulasan Sekarang</span>
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-slate-400 leading-tight">
              Dengan mengirimkan ulasan, Anda menyetujui bahwa ulasan ini bersumber dari
              pengalaman nyata dan dapat ditampilkan pada platform Java Shared Tour setelah
              diverifikasi oleh tim kurasi kami.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

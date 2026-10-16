"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  ShieldCheck,
  CornerDownRight,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { reviewService, type DestinationReviewsData } from "@/src/services/review.service";
import { formatDate } from "@/src/lib/utils";

interface DestinationReviewsProps {
  destinationIdOrSlug: string;
  initialRating?: number;
  initialTotalReviews?: number;
}

export function DestinationReviews({
  destinationIdOrSlug,
  initialRating = 0,
  initialTotalReviews = 0,
}: DestinationReviewsProps) {
  const [data, setData] = useState<DestinationReviewsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const result = await reviewService.getApprovedReviewsByDestination(destinationIdOrSlug);
        if (isMounted) {
          setData(result);
        }
      } catch {
        // Fallback silently if network fails
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (destinationIdOrSlug) {
      fetchReviews();
    }

    return () => {
      isMounted = false;
    };
  }, [destinationIdOrSlug]);

  const rating = data?.destination?.rating ?? initialRating;
  const totalReviews = data?.reviews?.length ?? (data?.destination?.totalReviews ?? initialTotalReviews);
  const reviews = data?.reviews || [];

  return (
    <div id="destination-reviews-section" className="space-y-6 pt-10 border-t border-slate-200">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>100% Ulasan Terverifikasi Peserta Trip</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Ulasan & Pengalaman Traveler
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ulasan murni dari para tamu yang telah menyelesaikan perjalanan bersama kami.
          </p>
        </div>

        {/* Rating Summary Card */}
        {totalReviews > 0 ? (
          <div className="flex items-center gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm shrink-0">
            <div className="text-center pr-3 border-r border-slate-100">
              <span className="text-3xl font-black text-slate-900">
                {rating > 0 ? rating.toFixed(1) : "5.0"}
              </span>
              <span className="text-xs text-slate-400 block font-medium">/ 5.0</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(rating || 5)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-600">
                Berdasarkan {totalReviews} ulasan
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Reviews Content */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#00677d]" />
          <span className="text-xs font-medium">Memuat ulasan traveler...</span>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Ulasan Publik</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Paket tur ini siap dijelajahi. Setelah trip selesai, setiap peserta akan menerima
              undangan tautan resmi untuk berbagi cerita dan penilaian mereka di sini!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Header: Traveler Info & Stars */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {review.travelerName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 font-semibold border-emerald-200"
                      >
                        Verified
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(review.submittedAt)}
                    </p>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <Star
                        key={starVal}
                        className={`h-3.5 w-3.5 ${
                          starVal <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>

              {/* Official Admin Reply (if exists) */}
              {review.adminReply && (
                <div className="bg-[#00677d]/5 rounded-xl p-3 border-l-4 border-[#00677d] space-y-1.5 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#00677d]">
                    <CornerDownRight className="h-3.5 w-3.5" />
                    <span>Respon Java Shared Tour</span>
                    {review.repliedAt && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        • {formatDate(review.repliedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    {review.adminReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

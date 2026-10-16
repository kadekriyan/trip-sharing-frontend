import { apiClient } from "@/src/lib/api-client";
import type {
  Review,
  ReviewTokenVerification,
  SubmitReviewPayload,
  ModerateReviewPayload,
  AdminReplyPayload,
  SendReviewInvitesResponse,
  Trip,
} from "@/src/types";

export interface DestinationReviewsData {
  destination: {
    id: string;
    name: string;
    slug?: string;
    rating: number;
    totalReviews: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    travelerName: string;
    adminReply?: string | null;
    repliedAt?: string | null;
    submittedAt: string;
  }>;
}

export interface AdminReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const reviewService = {
  /**
   * Verifikasi token ulasan sebelum membuka form review
   */
  async verifyToken(token: string): Promise<ReviewTokenVerification> {
    const res = await apiClient.get<ReviewTokenVerification>(`/reviews/verify/${token}`);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Tautan ulasan tidak valid atau kedaluwarsa");
    }
    return res.data;
  },

  /**
   * Kirim ulasan oleh traveler terverifikasi
   */
  async submitReview(token: string, payload: SubmitReviewPayload): Promise<Review> {
    const res = await apiClient.post<Review>(`/reviews/submit/${token}`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal mengirimkan ulasan");
    }
    return res.data;
  },

  /**
   * Ambil daftar ulasan yang sudah disetujui (APPROVED) untuk halaman destinasi
   */
  async getApprovedReviewsByDestination(slugOrId: string): Promise<DestinationReviewsData> {
    const res = await apiClient.get<DestinationReviewsData>(`/reviews/destination/${slugOrId}`);
    if (res.success && res.data) {
      return res.data;
    }
    return {
      destination: { id: slugOrId, name: "", rating: 0, totalReviews: 0 },
      reviews: [],
    };
  },

  /**
   * Mengambil daftar ulasan untuk moderasi admin
   */
  async listAdminReviews(params?: {
    destinationId?: string;
    status?: string;
    tripId?: string;
    page?: number;
    limit?: number;
  }): Promise<AdminReviewsResponse> {
    const res = await apiClient.get<Review[]>("/admin/reviews", {
      params: {
        destination_id: params?.destinationId,
        status: params?.status,
        trip_id: params?.tripId,
        page: params?.page,
        limit: params?.limit,
      },
    });

    const reviews = res.data || [];
    const meta = res.meta || {
      total: reviews.length,
      page: params?.page || 1,
      limit: params?.limit || 20,
      totalPages: 1,
    };

    return {
      reviews,
      pagination: {
        total: Number(meta.total || 0),
        page: Number(meta.page || 1),
        limit: Number(meta.limit || 20),
        totalPages: Number(meta.totalPages || 1),
      },
    };
  },

  /**
   * Moderasi ulasan oleh admin (Approve / Reject)
   */
  async moderateReview(id: string, payload: ModerateReviewPayload): Promise<Review> {
    const res = await apiClient.patch<Review>(`/admin/reviews/${id}/moderate`, payload);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal memperbarui status ulasan");
    }
    return res.data;
  },

  /**
   * Kirim balasan resmi pengelola atas ulasan
   */
  async replyReview(id: string, payload: AdminReplyPayload): Promise<Review> {
    const replyContent = payload.adminReply || payload.reply || "";
    const body = {
      adminReply: replyContent,
      admin_reply: replyContent,
      reply: replyContent,
    };
    const res = await apiClient.post<Review>(`/admin/reviews/${id}/reply`, body);
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal menyimpan balasan pengelola");
    }
    return res.data;
  },

  /**
   * Broadcast undangan review ke nomor WhatsApp peserta manifest via Fonnte
   */
  async sendTripReviewInvites(tripId: string): Promise<SendReviewInvitesResponse> {
    const res = await apiClient.post<SendReviewInvitesResponse>(
      `/admin/trips/${tripId}/send-review-invites`,
      { baseUrl: typeof window !== "undefined" ? window.location.origin : undefined }
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal memproses pengiriman undangan ulasan");
    }
    return res.data;
  },

  /**
   * Mengambil tautan ulasan untuk semua peserta trip (untuk keperluan salin manual jika WhatsApp bermasalah)
   */
  async getTripReviewLinks(tripId: string): Promise<SendReviewInvitesResponse> {
    const origin = typeof window !== "undefined" ? window.location.origin : undefined;
    const res = await apiClient.get<SendReviewInvitesResponse>(
      `/admin/trips/${tripId}/review-links`,
      { params: { baseUrl: origin } }
    );
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal mengambil daftar tautan ulasan");
    }
    return res.data;
  },

  /**
   * Tandai status trip menjadi completed
   */
  async completeTrip(tripId: string): Promise<Trip> {
    const res = await apiClient.patch<Trip>(`/admin/trips/${tripId}/complete`, {});
    if (!res.success || !res.data) {
      throw new Error(res.message || "Gagal menyelesaikan status trip");
    }
    return res.data;
  },
};

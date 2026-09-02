import { apiClient } from "@/src/lib/api-client";
import type { Destination, BookingGroup } from "@/src/types";

export interface DestinationFilterParams {
  search?: string;
  location?: string;
  duration?: number;
  sortBy?: "popular" | "price_asc" | "price_desc" | "rating";
  page?: number;
  limit?: number;
}

export const destinationService = {
  async getAllDestinations(filters?: DestinationFilterParams): Promise<Destination[]> {
    try {
      const res = await apiClient.get<Destination[]>("/destinations", {
        params: {
          search: filters?.search,
          location: filters?.location,
          duration: filters?.duration,
          sortBy: filters?.sortBy,
          page: filters?.page,
          limit: filters?.limit,
        },
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Return empty array if backend is down or no data
    }
    return [];
  },

  async getDestinationBySlug(slug: string): Promise<Destination | null> {
    try {
      const res = await apiClient.get<Destination>(`/destinations/${slug}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Not found or network error
    }
    return null;
  },

  async getTripAvailability(tripId: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ tripId: string; departureDate: string; groups: BookingGroup[] }>(
        `/trips/${tripId}/availability`
      );
      if (res.success && res.data?.groups) {
        return res.data.groups;
      }
    } catch {
      // Empty groups
    }
    return [];
  },
};

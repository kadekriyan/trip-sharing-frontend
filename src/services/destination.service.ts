import { apiClient } from "@/src/lib/api-client";
import { normalizeTrip, normalizeBookingGroup } from "@/src/services/admin.service";
import type { Destination, BookingGroup, Trip } from "@/src/types";

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
      // Return empty array on network/server error
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

  async getTripsByDestination(destinationId: string): Promise<Trip[]> {
    try {
      const res = await apiClient.get<Record<string, unknown>[]>("/trips", {
        params: { destinationId },
      });
      if (res.success && Array.isArray(res.data)) {
        return res.data.map((raw) => normalizeTrip(raw));
      }
    } catch {
      // Fallback: Try /admin/trips
      try {
        const altRes = await apiClient.get<Record<string, unknown>[]>("/admin/trips", {
          params: { destinationId },
        });
        if (altRes.success && Array.isArray(altRes.data)) {
          return altRes.data.map((raw) => normalizeTrip(raw));
        }
      } catch {
        // Return empty array on error
      }
    }
    return [];
  },

  async getTripAvailability(tripId: string, departureDate?: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ tripId: string; departureDate: string; groups: Record<string, unknown>[] }>(
        `/trips/${tripId}/availability`,
        { params: { departureDate } }
      );
      if (res.success && res.data?.groups && Array.isArray(res.data.groups)) {
        return res.data.groups.map((g) => normalizeBookingGroup(g, tripId));
      }
    } catch {
      // Return empty groups on error
    }
    return [];
  },
};



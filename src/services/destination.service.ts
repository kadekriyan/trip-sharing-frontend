import { apiClient } from "@/src/lib/api-client";
import type { Destination, BookingGroup } from "@/src/types";
import { MOCK_DESTINATIONS, MOCK_TRIPS } from "./mockData";

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
      // Fallback to local mock data if backend not reachable yet
    }

    let results = [...MOCK_DESTINATIONS];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q)
      );
    }
    if (filters?.location) {
      results = results.filter((d) => d.location.toLowerCase().includes(filters.location!.toLowerCase()));
    }
    if (filters?.duration) {
      results = results.filter((d) => d.durationDays === Number(filters.duration));
    }
    if (filters?.sortBy === "price_asc") {
      results.sort((a, b) => a.pricePerPax - b.pricePerPax);
    } else if (filters?.sortBy === "price_desc") {
      results.sort((a, b) => b.pricePerPax - a.pricePerPax);
    } else if (filters?.sortBy === "rating") {
      results.sort((a, b) => b.rating - a.rating);
    }

    return results;
  },

  async getDestinationBySlug(slug: string): Promise<Destination | null> {
    try {
      const res = await apiClient.get<Destination>(`/destinations/${slug}`);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_DESTINATIONS.find((d) => d.slug === slug || d.id === slug) || null;
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
      // Fallback
    }
    const trip = MOCK_TRIPS.find((t) => t.id === tripId);
    return trip?.groups || [];
  },
};

import { apiClient } from "@/src/lib/api-client";
import type { Destination, BookingGroup, Trip } from "@/src/types";
import { MOCK_TRIPS, MOCK_DESTINATIONS } from "@/src/services/mockData";

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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch {
      // Fallback
    }
    return MOCK_DESTINATIONS;
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

    const found = MOCK_DESTINATIONS.find((d) => d.slug === slug || d.id === slug);
    return found || null;
  },

  async getTripsByDestination(destinationId: string): Promise<Trip[]> {
    let apiTrips: Trip[] = [];
    try {
      const res = await apiClient.get<Trip[]>("/trips", {
        params: { destinationId },
      });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        apiTrips = res.data;
      }
    } catch {
      // Fallback
    }

    const localMatched = MOCK_TRIPS.filter(
      (t) =>
        t.destinationId === destinationId ||
        t.destination?.slug === destinationId ||
        t.destination?.id === destinationId
    );

    if (apiTrips.length === 0) {
      return localMatched;
    }

    const apiTripIds = new Set(apiTrips.map((t) => t.id));
    const merged = [...apiTrips];
    for (const lt of localMatched) {
      if (!apiTripIds.has(lt.id)) {
        merged.unshift(lt);
      }
    }
    return merged;
  },

  async getTripAvailability(tripId: string, departureDate?: string): Promise<BookingGroup[]> {
    try {
      const res = await apiClient.get<{ tripId: string; departureDate: string; groups: BookingGroup[] }>(
        `/trips/${tripId}/availability`,
        { params: { departureDate } }
      );
      if (res.success && res.data?.groups) {
        return res.data.groups;
      }
    } catch {
      // Empty groups
    }

    const foundTrip = MOCK_TRIPS.find((t) => t.id === tripId);
    if (foundTrip && Array.isArray(foundTrip.groups)) {
      return foundTrip.groups;
    }

    return [];
  },
};


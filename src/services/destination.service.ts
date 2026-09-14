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
    let destinations: Destination[] = [];
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
        destinations = res.data;
      }
    } catch {
      // Return empty array on network/server error
    }

    if (destinations.length > 0) {
      try {
        let allTrips: Trip[] = [];
        const tripsRes = await apiClient.get<Record<string, unknown>[]>("/trips");
        if (tripsRes.success && Array.isArray(tripsRes.data)) {
          allTrips = tripsRes.data.map((raw) => normalizeTrip(raw));
        } else {
          const altTripsRes = await apiClient.get<Record<string, unknown>[]>("/admin/trips");
          if (altTripsRes.success && Array.isArray(altTripsRes.data)) {
            allTrips = altTripsRes.data.map((raw) => normalizeTrip(raw));
          }
        }

        if (allTrips.length > 0) {
          const tripsByDestId = new Map<string, Trip[]>();
          const tripsByDestSlug = new Map<string, Trip[]>();

          for (const t of allTrips) {
            const dId = t.destinationId || t.destination_id || t.destination?.id;
            const dSlug = t.destination?.slug;
            if (dId) {
              if (!tripsByDestId.has(dId)) tripsByDestId.set(dId, []);
              tripsByDestId.get(dId)!.push(t);
            }
            if (dSlug) {
              if (!tripsByDestSlug.has(dSlug)) tripsByDestSlug.set(dSlug, []);
              tripsByDestSlug.get(dSlug)!.push(t);
            }
          }

          destinations = destinations.map((dest) => {
            const matchedTrips =
              tripsByDestId.get(dest.id) ||
              (dest.slug ? tripsByDestSlug.get(dest.slug) : undefined) ||
              dest.trips ||
              dest.activeTrips ||
              [];
            return {
              ...dest,
              trips: matchedTrips,
              activeTrips: matchedTrips,
              tripsCount: matchedTrips.length,
              totalTrips: matchedTrips.length,
            };
          });
        }
      } catch {
        // Silently continue with raw destinations
      }
    }

    return destinations;
  },

  async getDestinationBySlug(slug: string): Promise<Destination | null> {
    try {
      const res = await apiClient.get<Destination>(`/destinations/${slug}`);
      if (res.success && res.data) {
        const dest = res.data;
        if (!dest.trips || dest.trips.length === 0) {
          try {
            const trips = await this.getTripsByDestination(dest.id);
            if (trips.length > 0) {
              dest.trips = trips;
              dest.activeTrips = trips;
              dest.tripsCount = trips.length;
              dest.totalTrips = trips.length;
            }
          } catch {
            // Ignore
          }
        }
        return dest;
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



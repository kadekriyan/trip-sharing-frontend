import { apiClient } from "@/src/lib/api-client";
import type { Destination, Trip } from "@/src/types";
import { MOCK_DESTINATIONS, MOCK_TRIPS } from "./mockData";

export const destinationService = {
  async getAllDestinations(): Promise<Destination[]> {
    try {
      const res = await apiClient.get<Destination[]>("/destinations");
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback to local mock data if backend not reachable yet
    }
    return MOCK_DESTINATIONS;
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

  async getTripsForDestination(destinationId: string): Promise<Trip[]> {
    try {
      const res = await apiClient.get<Trip[]>(`/destinations/${destinationId}/trips`);
      if (res.success && res.data) return res.data;
    } catch {
      // Fallback
    }
    return MOCK_TRIPS.filter((t) => t.destinationId === destinationId);
  },
};

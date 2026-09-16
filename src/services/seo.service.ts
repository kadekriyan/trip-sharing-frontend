import { apiClient } from "@/src/lib/api-client";
import type { GlobalSeoSettings } from "@/src/types";

export const DEFAULT_SEO_SETTINGS: GlobalSeoSettings = {
  siteTitleDefault: "Share Tour Jogja — Open Trip & Yogyakarta Sharing Tours",
  siteTitleTemplate: "%s | Share Tour Jogja",
  metaDescription:
    "Open trip and sharing tour platform in Yogyakarta & Indonesia. Join small-group travel tours, save up to 60% with cost-sharing, and make new friends.",
  keywords: [
    "Share Tour Jogja",
    "Open Trip Jogja",
    "Sharing Tour Yogyakarta",
    "Trip Sharing Jogja",
    "Yogyakarta Sharing Tours",
    "Bromo Sunrise Safari",
    "Komodo Phinisi",
    "Bali Nusa Penida",
    "Small Group Travel Indonesia",
    "Budget Travel Yogyakarta",
  ],
  defaultOgImage: "/images/hero-bromo.png",
  googleVerificationTag: null,
  organizationSchemaJson: null,
  robotsIndex: true,
};

export const seoService = {
  async getGlobalSeo(): Promise<GlobalSeoSettings> {
    try {
      const res = await apiClient.get<GlobalSeoSettings>("/settings/seo");
      if (res.success && res.data) {
        return {
          ...DEFAULT_SEO_SETTINGS,
          ...res.data,
          keywords:
            Array.isArray(res.data.keywords) && res.data.keywords.length > 0
              ? res.data.keywords
              : DEFAULT_SEO_SETTINGS.keywords,
        };
      }
    } catch {
      // Fallback gracefully
    }
    return DEFAULT_SEO_SETTINGS;
  },
};

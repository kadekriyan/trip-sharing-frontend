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

export const DEFAULT_PAGE_SEO: Record<string, { title: string; description: string; keywords?: string[] }> = {
  home: {
    title: "Share Tour Jogja — Open Trip & Yogyakarta Sharing Tours",
    description:
      "Open trip and sharing tour platform in Yogyakarta & Indonesia. Join small-group travel tours, save up to 60% with cost-sharing, and make new friends.",
    keywords: ["Share Tour Jogja", "Open Trip Jogja", "Sharing Tour Yogyakarta", "Trip Sharing Jogja"],
  },
  destinations: {
    title: "Explore Tour Packages & Yogyakarta Sharing Trips",
    description:
      "Discover popular Yogyakarta tour packages: Prambanan, Merapi Lava Tour, Timang Beach, and Borobudur. Join vehicle groups and save up to 60% with cost-sharing.",
    keywords: ["Yogyakarta Tour Packages", "Open Trip Jogja", "Prambanan Tour", "Merapi Lava Tour", "Timang Beach Tour"],
  },
  blog: {
    title: "Blog Wisata, Cerita Komunitas & Panduan Trip Sharing",
    description:
      "Kumpulan artikel, tips berhemat liburan, rute rekomendasi, dan edukasi seputar open trip cost-sharing maksimal 6 pax di Indonesia.",
    keywords: ["Blog Wisata Jogja", "Tips Liburan Jogja", "Panduan Open Trip", "Kuliner Jogja"],
  },
  bookings: {
    title: "My Bookings & Trip Ticket Status",
    description:
      "Check your active Yogyakarta tour booking, seat assignment, driver details, and download e-ticket vouchers.",
    keywords: ["Check Tour Booking", "E-Ticket Share Tour", "Yogyakarta Booking Status"],
  },
  login: {
    title: "Sign In to Your Account",
    description:
      "Sign in to your Share Tour Jogja traveler account to manage trips, check payment status, and access tickets.",
  },
  register: {
    title: "Create Traveler Account",
    description:
      "Register a new account on Share Tour Jogja to join small-group open trips and travel across Yogyakarta.",
  },
};

export const seoService = {
  async getGlobalSeo(): Promise<GlobalSeoSettings> {
    try {
      const res = await apiClient.get<GlobalSeoSettings>("/settings/seo", {
        cache: "no-store",
        next: { revalidate: 0 },
      });
      if (res.success && res.data) {
        return {
          ...DEFAULT_SEO_SETTINGS,
          ...res.data,
          keywords:
            Array.isArray(res.data.keywords) && res.data.keywords.length > 0
              ? res.data.keywords
              : DEFAULT_SEO_SETTINGS.keywords,
          pageSeoSettings: res.data.pageSeoSettings || res.data.page_seo_settings || {},
        };
      }
    } catch {
      // Fallback gracefully
    }
    return DEFAULT_SEO_SETTINGS;
  },

  async getPageSeo(pageKey: string) {
    const globalSeo = await this.getGlobalSeo();
    const pageOverrides = globalSeo.pageSeoSettings?.[pageKey];
    const defaultPage = DEFAULT_PAGE_SEO[pageKey] || {
      title: globalSeo.siteTitleDefault,
      description: globalSeo.metaDescription,
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";
    const title = pageOverrides?.title || defaultPage.title;
    const description = pageOverrides?.description || defaultPage.description;
    const keywords = pageOverrides?.keywords && pageOverrides.keywords.length > 0
      ? pageOverrides.keywords
      : defaultPage.keywords || globalSeo.keywords;
    const ogImage = pageOverrides?.ogImage || globalSeo.defaultOgImage;
    const fullOgImage = ogImage.startsWith("http")
      ? ogImage
      : `${siteUrl}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`;
    const noIndex = pageOverrides?.noIndex !== undefined ? pageOverrides.noIndex : !globalSeo.robotsIndex;

    return {
      title,
      description,
      keywords,
      ogImage: fullOgImage,
      noIndex,
      globalSeo,
    };
  },
};


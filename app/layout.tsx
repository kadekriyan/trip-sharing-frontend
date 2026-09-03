import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { AuthProvider } from "@/src/context/auth-context";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tripsharing.id";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00677d",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Trip Sharing Platform — Shared Journey, Shared Cost (Maks 6 Pax)",
    template: "%s | TripSharing Indonesia",
  },
  description:
    "Platform open trip cost-sharing wisata Indonesia. Gabung grup perjalanan eksklusif maksimal 6 orang per mobil, hemat biaya hingga 60%, dan temukan teman baru.",
  keywords: [
    "Trip Sharing",
    "Open Trip Indonesia",
    "Cost Sharing Wisata",
    "Bromo Sunrise Safari",
    "Komodo Phinisi",
    "Bali Nusa Penida",
    "Trip Mobil 6 Orang",
    "Wisata Hemat Indonesia",
  ],
  authors: [{ name: "TripSharing Team" }],
  creator: "TripSharing Indonesia",
  publisher: "TripSharing Indonesia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Trip Sharing Platform — Shared Journey, Shared Cost (Maks 6 Pax)",
    description:
      "Gabung grup perjalanan wisata eksklusif maksimal 6 orang per mobil. Hemat biaya hingga 60% dengan sistem pembagian otomatis dan driver terverifikasi.",
    url: siteUrl,
    siteName: "TripSharing Indonesia",
    images: [
      {
        url: "/images/hero-bromo.png",
        width: 1200,
        height: 630,
        alt: "Trip Sharing Indonesia — Eksplorasi Wisata Bersama Teman Baru",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trip Sharing Platform — Shared Journey, Shared Cost (Maks 6 Pax)",
    description:
      "Gabung grup perjalanan wisata eksklusif maksimal 6 orang per mobil. Hemat biaya hingga 60% dengan garansi berangkat 100%.",
    images: ["/images/hero-bromo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdOrg = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TripSharing Indonesia",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description: "Platform open trip pariwisata berbasis cost-sharing maksimal 6 peserta per mobil di Indonesia.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+6281234567890",
      contactType: "customer service",
      areaServed: "ID",
      availableLanguage: ["Indonesian", "English"],
    },
  };

  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#f7f9fb] text-[#191c1e] selection:bg-[#00a3c4]/20 selection:text-[#00677d]">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

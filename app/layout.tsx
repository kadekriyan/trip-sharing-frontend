import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";
import { AuthProvider } from "@/src/context/auth-context";

import { seoService } from "@/src/services/seo.service";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#00677d",
};

export async function generateMetadata(): Promise<Metadata> {
  const seo = await seoService.getGlobalSeo();
  const ogImage = seo.defaultOgImage.startsWith("http")
    ? seo.defaultOgImage
    : `${siteUrl}${seo.defaultOgImage.startsWith("/") ? "" : "/"}${seo.defaultOgImage}`;

  const meta: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
      default: seo.siteTitleDefault,
      template: seo.siteTitleTemplate,
    },
    description: seo.metaDescription,
    keywords: seo.keywords,
    authors: [{ name: "Java Shared Tour Team" }],
    creator: "Java Shared Tour",
    publisher: "Java Shared Tour",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      title: seo.siteTitleDefault,
      description: seo.metaDescription,
      url: siteUrl,
      siteName: "Java Shared Tour",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.siteTitleDefault,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteTitleDefault,
      description: seo.metaDescription,
      images: [ogImage],
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsIndex,
      googleBot: {
        index: seo.robotsIndex,
        follow: seo.robotsIndex,
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

  if (seo.googleVerificationTag) {
    meta.verification = {
      google: seo.googleVerificationTag,
    };
  }

  return meta;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await seoService.getGlobalSeo();

  let jsonLdOrg: Record<string, unknown>;
  if (seo.organizationSchemaJson) {
    try {
      jsonLdOrg = JSON.parse(seo.organizationSchemaJson);
    } catch {
      jsonLdOrg = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Java Shared Tour",
        url: siteUrl,
        logo: `${siteUrl}/images/logo.png`,
        description: seo.metaDescription,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+6281216916003",
          contactType: "customer service",
          areaServed: "ID",
          availableLanguage: ["English", "Indonesian"],
        },
      };
    }
  } else {
    jsonLdOrg = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Java Shared Tour",
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      description: seo.metaDescription,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+6281216916003",
        contactType: "customer service",
        areaServed: "ID",
        availableLanguage: ["English", "Indonesian"],
      },
    };
  }

  return (
    <html
      lang="en"
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

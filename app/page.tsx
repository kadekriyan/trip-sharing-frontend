import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  ArrowRight,
  Star,
  MapPin,
  ChevronRight,
  Clock,
} from "lucide-react";
import type { Metadata } from "next";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card, CardContent } from "@/src/components/ui/card";
import { destinationService } from "@/src/services/destination.service";
import { articleService } from "@/src/services/article.service";
import { seoService } from "@/src/services/seo.service";
import { DestinationFilterGrid } from "@/src/components/home/destination-filter-grid";
import { formatCurrency, formatDate } from "@/src/lib/utils";

export const revalidate = 60; // ISR revalidate every 60 seconds

export async function generateMetadata(): Promise<Metadata> {
  const pageSeo = await seoService.getPageSeo("home");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  return {
    title: {
      absolute: pageSeo.title,
    },
    description: pageSeo.description,
    keywords: pageSeo.keywords,
    robots: {
      index: !pageSeo.noIndex,
      follow: !pageSeo.noIndex,
    },
    openGraph: {
      title: pageSeo.title,
      description: pageSeo.description,
      url: siteUrl,
      siteName: "Java Shared Tour",
      images: [
        {
          url: pageSeo.ogImage,
          width: 1200,
          height: 630,
          alt: pageSeo.title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageSeo.title,
      description: pageSeo.description,
      images: [pageSeo.ogImage],
    },
  };
}


export default async function HomePage() {
  const [destinations, articles] = await Promise.all([
    destinationService.getAllDestinations().catch(() => []),
    articleService.getAllArticles().catch(() => []),
  ]);

  const featuredDest = destinations[0];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sharingtouryogyakarta.com";

  // Structured Data JSON-LD for rich snippets
  const jsonLdTrips = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Yogyakarta Open Trip & Sharing Tour Packages",
    itemListElement: destinations.slice(0, 6).map((dest, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristTrip",
        name: dest.title,
        description: dest.shortDescription || dest.description,
        image: dest.coverImage,
        touristType: "Open Trip Traveler",
        offers: {
          "@type": "Offer",
          price: dest.pricePerPax,
          priceCurrency: "IDR",
          availability: "https://schema.org/InStock",
          url: `${siteUrl}/destinations/${dest.slug}`,
        },
      },
    })),
  };

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdTrips) }}
      />

      {/* 1. HERO SECTION (High LCP Priority) */}
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-20 overflow-hidden bg-gradient-to-b from-[#e0f2fe]/40 via-[#f7f9fb] to-[#f7f9fb]">
        {/* Background Glow Blobs */}
        <div className="absolute top-0 right-0 w-[45vw] h-[45vw] bg-[#00a3c4]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/4 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-[#ff7f50]/10 rounded-full blur-3xl pointer-events-none -translate-x-1/4 translate-y-1/4" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
          {/* Left Column: Heading & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-[#00677d]">
                Open Trip & Sharing Tour Yogyakarta
              </span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#191c1e] leading-[1.12]">
              Explore Yogyakarta,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00677d] via-[#00a3c4] to-[#ff7f50]">
                Split the Cost
              </span>
              , Meet New Friends.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              The premier cost-sharing tour platform in Yogyakarta. Enjoy comfortable journeys in air-conditioned vehicles and save up to 60% with fellow travelers.
            </p>

            {/* Micro Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-2 max-w-lg mx-auto lg:mx-0">
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-[#00677d] text-lg sm:text-xl">Full AC</span>
                <span className="text-[11px] text-slate-600 font-medium">Comfortable Fleet</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-[#ff7f50] text-lg sm:text-xl">60%</span>
                <span className="text-[11px] text-slate-600 font-medium">More Cost-Efficient</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-100 shadow-sm flex flex-col items-center lg:items-start text-center lg:text-left">
                <span className="font-heading font-extrabold text-emerald-600 text-lg sm:text-xl">100%</span>
                <span className="text-[11px] text-slate-600 font-medium">Guaranteed Departure</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto text-sm font-bold shadow-stitch-button gap-2">
                <Link href="/destinations">
                  <Compass className="h-4 w-4" />
                  Explore Tour Packages
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-sm font-semibold gap-2 border-slate-300 hover:bg-slate-50">
                <Link href="/bookings">
                  Check My Booking
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center lg:justify-start gap-3 pt-4 border-t border-slate-200/60">
              <div className="flex -space-x-2 overflow-hidden">
                {["1534528741775-53994a69daeb", "1507003211169-0a1dd7228f2d", "1517841905240-472988babdf9", "1494790108377-be9c29b29330"].map((imgId, idx) => (
                  <div key={idx} className="relative h-8 w-8 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                    <Image
                      src={`https://images.unsplash.com/photo-${imgId}?w=100&auto=format&fit=crop&q=80`}
                      alt="Trip Sharing Traveler"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-slate-600">
                <div className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>4.9 / 5.0</span>
                </div>
                <span>from 1,200+ Happy Solo & Group Travelers</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card (High Priority LCP Image or Brand Promo Card) */}
          <div className="lg:col-span-5 relative">
            {featuredDest ? (
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-[4/5]">
                {featuredDest.coverImage ? (
                  <Image
                    src={featuredDest.coverImage}
                    alt={featuredDest.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00677d] to-[#003b47] flex items-center justify-center">
                    <Compass className="h-16 w-16 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Floating Badge on Image */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                  <Badge variant="coral" className="text-xs font-bold px-3 py-1 shadow-lg backdrop-blur-sm">
                    🔥 Most Popular Tour
                  </Badge>
                </div>

                {/* Card Bottom Meta */}
                <div className="absolute bottom-6 left-6 right-6 text-white space-y-3">
                  <div>
                    {featuredDest.location && (
                      <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {featuredDest.location}
                      </span>
                    )}
                    <h2 className="font-heading font-extrabold text-2xl text-white mt-1 line-clamp-2">
                      {featuredDest.title}
                    </h2>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <div>
                      <span className="text-[11px] text-slate-300 block">Rate per Person:</span>
                      <span className="font-heading font-extrabold text-xl text-white">
                        {formatCurrency(featuredDest.pricePerPax)}
                      </span>
                    </div>

                    <Button asChild size="sm" className="rounded-xl font-bold bg-[#ff7f50] hover:bg-[#ff7f50]/90 text-white shadow-lg">
                      <Link href={`/destinations/${featuredDest.slug}`}>
                        Join Trip
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-gradient-to-br from-[#00677d] via-[#004f60] to-[#08222a] aspect-[4/5] p-8 flex flex-col justify-between text-white">
                {/* Background decorative glow */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#00a3c4]/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#ff7f50]/20 rounded-full blur-2xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="coral" className="text-xs font-bold px-3 py-1 shadow-md">
                      Java Shared Tour
                    </Badge>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm">
                      Java Tours
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-xs font-bold tracking-wider uppercase text-[#ff7f50] block">
                      Java Sharing Tour Platform
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-white mt-1 leading-tight">
                      Great Adventures, Shared Savings.
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
                      Explore the best destinations in Yogyakarta with clean, air-conditioned vehicles and transparent cost-sharing.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 space-y-4 pt-4 border-t border-white/15">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                      <span className="text-[10px] text-slate-300 block">Clean Fleet</span>
                      <span className="font-bold text-white">Professional Drivers</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                      <span className="text-[10px] text-slate-300 block">Service Guarantee</span>
                      <span className="font-bold text-emerald-300">Comfortable AC Transport</span>
                    </div>
                  </div>

                  <Button asChild size="default" className="w-full rounded-xl font-bold bg-[#ff7f50] hover:bg-[#ff7f50]/90 text-white shadow-lg gap-2">
                    <Link href="/destinations">
                      <Compass className="h-4 w-4" />
                      Explore Tour Catalog
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS SECTION */}
      <section className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
            <Badge variant="azure" className="text-xs font-bold">
              How It Works
            </Badge>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
              How Does Sharing Tour Work?
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A smart, hassle-free way for solo travelers, couples, and friends to explore without paying for an entire private charter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="p-8 border-slate-100 shadow-stitch-card hover:shadow-stitch-card-hover transition-all text-center space-y-4 rounded-3xl bg-[#f7f9fb]/50">
              <div className="h-14 w-14 rounded-2xl bg-[#00677d]/10 text-[#00677d] flex items-center justify-center mx-auto font-heading font-extrabold text-xl">
                1
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                Select Tour & Date
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pick your preferred itinerary. Book just 1 seat or invite friends to join on your chosen departure date.
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="p-8 border-slate-100 shadow-stitch-card hover:shadow-stitch-card-hover transition-all text-center space-y-4 rounded-3xl bg-[#f7f9fb]/50">
              <div className="h-14 w-14 rounded-2xl bg-[#ff7f50]/10 text-[#ff7f50] flex items-center justify-center mx-auto font-heading font-extrabold text-xl">
                2
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                Automated Group Pairing
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Our system automatically groups you into a comfortable 6-seater car with fellow travelers sharing the same date.
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="p-8 border-slate-100 shadow-stitch-card hover:shadow-stitch-card-hover transition-all text-center space-y-4 rounded-3xl bg-[#f7f9fb]/50">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto font-heading font-extrabold text-xl">
                3
              </div>
              <h3 className="font-heading font-bold text-lg text-[#191c1e]">
                Enjoy & Save Together
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The driver picks you up at the meeting point, costs are split evenly, and you make new friends along the adventure!
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. FEATURED DESTINATIONS SECTION (Interactive Island) */}
      <section className="py-20 bg-[#f7f9fb]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <Badge variant="coral" className="text-xs font-bold mb-2">
                Popular Tours
              </Badge>
              <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
                Explore Popular Tour Packages
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                All packages include a 6-seater AC vehicle, fuel, admission tickets, and an experienced local driver.
              </p>
            </div>

            <Button asChild variant="outline" className="gap-2 border-slate-300 hover:bg-white text-xs font-bold self-start md:self-auto">
              <Link href="/destinations">
                View All ({destinations.length})
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Interactive Client Filter Island */}
          <DestinationFilterGrid initialDestinations={destinations} />
        </div>
      </section>

      {/* 4. ARTICLES & BLOG SECTION */}
      {articles.length > 0 && (
        <section className="py-20 bg-white border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <Badge variant="azure" className="text-xs font-bold mb-2">
                  Travel Inspiration
                </Badge>
                <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#191c1e]">
                  Travel Guides & Sharing Tour Tips
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Discover travel stories, packing guides, and recommended routes across Yogyakarta.
                </p>
              </div>

              <Button asChild variant="ghost" className="gap-2 text-[#00677d] hover:bg-[#00677d]/5 text-xs font-bold self-start md:self-auto">
                <Link href="/blog">
                  View All Articles
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.slice(0, 3).map((art) => (
                <Card
                  key={art.id}
                  className="group overflow-hidden rounded-3xl border-slate-100 shadow-stitch-card hover:shadow-stitch-card-hover transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <Image
                        src={art.coverImage || "/images/dest-bromo.jpg"}
                        alt={art.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <Badge variant="coral" className="absolute top-3.5 left-3.5 text-[10px] font-bold">
                        {art.category}
                      </Badge>
                    </div>

                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDate(art.publishedAt)}</span>
                        <span>•</span>
                        <span>{art.readTime || "5 Min Read"}</span>
                      </div>

                      <h3 className="font-heading font-bold text-base text-[#191c1e] group-hover:text-[#00677d] transition-colors line-clamp-2">
                        <Link href={`/blog/${art.slug}`}>{art.title}</Link>
                      </h3>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </CardContent>
                  </div>

                  <div className="p-6 pt-0">
                    <Button asChild size="sm" variant="outline" className="w-full justify-between text-xs font-bold rounded-xl group-hover:border-[#00677d] group-hover:text-[#00677d]">
                      <Link href={`/blog/${art.slug}`}>
                        Read Full Story
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

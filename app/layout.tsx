import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/src/components/layout/Navbar";
import { Footer } from "@/src/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "Trip Sharing Platform — Shared Journey, Shared Cost (Maks 6 Pax)",
  description:
    "Platform open trip cost-sharing wisata Indonesia. Gabung grup perjalanan eksklusif maksimal 6 orang per mobil, hemat biaya hingga 60%, dan temukan teman baru.",
  keywords: [
    "Trip Sharing",
    "Open Trip Indonesia",
    "Cost Sharing Wisata",
    "Bromo Sunrise Safari",
    "Komodo Phinisi",
    "Bali Nusa Penida",
  ],
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f9fb] text-[#191c1e] selection:bg-[#00a3c4]/20 selection:text-[#00677d]">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Shield, Users, HeartHandshake, MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Hide footer on admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-700">
      {/* Benefit Highlights */}
      <div className="border-b border-slate-100 bg-[#f7f9fb] py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-[#ff7f50]">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[#191c1e] text-base">Comfortable Small Groups (Max 6)</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Each vehicle is dedicated for optimal comfort with a maximum of 6 travelers per car.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-[#00677d]">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[#191c1e] text-base">Transparent Cost-Sharing</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Save on fleet rentals, fuel, and expert drivers with fair, clear, and split pricing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-[#00a3c4]">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[#191c1e] text-base">Instant & Secure Payments</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Protected by Midtrans Snap with QRIS, National Virtual Accounts, and Credit Cards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] p-1.5 shadow-sm">
                <Image
                  src="/images/logo.png"
                  alt="Share Tour Jogja Logo"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain brightness-110"
                />
              </div>
              <span className="font-heading text-lg font-bold text-[#00677d]">
                Share Tour Jogja
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The premier Yogyakarta sharing tour platform connecting travelers in comfortable, affordable, and friendly group adventures.
            </p>
          </div>

          {/* Destinasi Populer */}
          <div>
            <h4 className="font-heading font-bold text-[#191c1e] text-sm uppercase tracking-wider mb-4">
              Featured Tours
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/destinations" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Prambanan Temple & Ratu Boko
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Merapi Lava Tour VIP
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Sunset Parangtritis & Obelix Sea View
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Pindul Cave & Timang Beach Gondola
                </Link>
              </li>
            </ul>
          </div>

          {/* Informasi Platform */}
          <div>
            <h4 className="font-heading font-bold text-[#191c1e] text-sm uppercase tracking-wider mb-4">
              Explore & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/blog" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Travel Guides & Tips
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Check Booking Status
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-slate-600 hover:text-[#00677d] transition-colors">
                  Staff & Admin Portal
                </Link>
              </li>
              <li>
                <span className="text-slate-400 text-xs">Terms & Cancellation Policy</span>
              </li>
            </ul>
          </div>

          {/* Kontak & Alamat */}
          <div>
            <h4 className="font-heading font-bold text-[#191c1e] text-sm uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#00677d] shrink-0 mt-0.5" />
                <span>Tegallayang 9, RT 02, Caturharjo, Pandak Bantul, Yogyakarta, 55761</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#00677d] shrink-0" />
                <span>+62 812-1691-6003 (24/7 Support)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#00677d] shrink-0" />
                <span>dejaayajax@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Share Tour Jogja. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <span>Midtrans Verified Merchant</span>
            <span>•</span>
            <span>Google reCAPTCHA Protected</span>
            <span>•</span>
            <span>Premium AC Fleet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

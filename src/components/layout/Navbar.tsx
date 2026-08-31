"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Compass, CalendarCheck, ShieldCheck, Menu, X, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jangan render public navbar jika berada di area admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks = [
    { label: "Jelajah Destinasi", href: "/destinations", icon: Compass },
    { label: "Booking Saya", href: "/bookings", icon: CalendarCheck },
    { label: "Tips & Blog", href: "/blog", icon: BookOpen },
    { label: "Portal Admin", href: "/admin", icon: ShieldCheck, badge: "Staff" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100/80 glass-nav transition-all">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] p-1.5 shadow-md shadow-[#00677d]/15 transition-transform group-hover:scale-105">
            <Image
              src="/images/logo.png"
              alt="Trip Sharing Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain brightness-110"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-bold tracking-tight text-[#00677d] leading-tight flex items-center gap-1.5">
              TripSharing
              <span className="text-[#ff7f50] text-xs px-1.5 py-0.5 rounded-full bg-orange-100 font-semibold font-sans">
                Max 6 Pax
              </span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Shared Journey, Shared Cost
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#00677d]/10 text-[#00677d] font-semibold"
                    : "text-slate-600 hover:text-[#00677d] hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#00677d]" : "text-slate-400"}`} />
                {link.label}
                {link.badge && (
                  <Badge variant="azure" className="text-[10px] px-1.5 py-0 h-4">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Button asChild size="default" className="gap-2">
            <Link href="/destinations">
              <Sparkles className="h-4 w-4" />
              Pesan Trip Sekarang
            </Link>
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-[#00677d]/10 text-[#00677d] font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-[#00677d]" />
                  {link.label}
                </div>
                {link.badge && (
                  <Badge variant="azure" className="text-[10px]">
                    {link.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          <div className="pt-2">
            <Button asChild className="w-full justify-center">
              <Link href="/destinations" onClick={() => setMobileMenuOpen(false)}>
                Pesan Trip Sekarang
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}

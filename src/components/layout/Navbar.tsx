"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Compass,
  CalendarCheck,
  ShieldCheck,
  Menu,
  X,
  BookOpen,
  LogIn,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useAuth } from "@/src/context/auth-context";

interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isAdmin, isHydrated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jangan render public navbar jika berada di area admin
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const navLinks: NavLinkItem[] = [
    { label: "Jelajah Destinasi", href: "/destinations", icon: Compass },
    { label: "Booking Saya", href: "/bookings", icon: CalendarCheck },
    { label: "Tips & Blog", href: "/blog", icon: BookOpen },
  ];

  if (isHydrated && isAdmin) {
    navLinks.push({ label: "Portal Admin", href: "/admin", icon: ShieldCheck, badge: "Staff" });
  }

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
                {"badge" in link && link.badge && (
                  <Badge variant="azure" className="text-[10px] px-1.5 py-0 h-4">
                    {link.badge as string}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Auth / CTA Area */}
        <div className="hidden sm:flex items-center gap-3">
          {!isHydrated ? (
            <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <UserIcon className="h-4 w-4 text-[#00677d]" />
                <span className="font-bold text-slate-800 max-w-[120px] truncate">
                  {user?.fullName || user?.email}
                </span>
                {isAdmin && (
                  <Badge variant="coral" className="text-[9px] px-1 py-0 h-3.5">
                    Admin
                  </Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-slate-500 hover:text-rose-600 gap-1 text-xs"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold">
                <Link href="/login">
                  <LogIn className="h-3.5 w-3.5 text-[#00677d]" />
                  Masuk
                </Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 text-xs font-bold shadow-sm">
                <Link href="/register">
                  Daftar
                </Link>
              </Button>
            </div>
          )}
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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 px-4 py-5 backdrop-blur-lg space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-[#00677d]" />
                    <span>{link.label}</span>
                  </div>
                  {"badge" in link && link.badge && (
                    <Badge variant="azure" className="text-[10px]">
                      {link.badge as string}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 px-3">
                  Login sebagai: <strong>{user?.fullName || user?.email}</strong>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-rose-600 justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" size="sm" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/login" className="justify-center">Masuk</Link>
                </Button>
                <Button asChild size="sm" onClick={() => setMobileMenuOpen(false)}>
                  <Link href="/register" className="justify-center">Daftar</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

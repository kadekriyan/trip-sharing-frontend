"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Car,
  FileText,
  Calendar,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { AdminGuard } from "@/src/components/auth/admin-guard";
import { useAuth } from "@/src/context/auth-context";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigationItems = [
    { label: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Jadwal Trip", href: "/admin/trips", icon: Calendar },
    { label: "Manajemen Peserta", href: "/admin/participants", icon: Users },
    { label: "Katalog Destinasi", href: "/admin/destinations", icon: MapPin },
    { label: "Driver & Armada", href: "/admin/drivers", icon: Car },
    { label: "CMS Artikel Blog", href: "/admin/blogs", icon: FileText },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col md:flex-row">
        {/* Mobile Topbar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 rounded-lg bg-[#00677d] p-1">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="font-heading font-bold text-sm text-[#00677d]">Admin Portal</span>
          </Link>
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop Sidebar (Fixed Left) */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 flex flex-col justify-between ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Sidebar Top: Logo & Title */}
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] p-1.5 shadow-sm">
                <Image src="/images/logo.png" alt="Logo" fill className="object-contain brightness-110" />
              </div>
              <div>
                <span className="font-heading text-sm font-extrabold text-[#00677d] tracking-tight block">
                  TripSharing
                </span>
                <span className="text-[10px] font-bold text-[#ff7f50] uppercase tracking-wider">
                  Admin Panel HQ
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="p-4 space-y-1.5">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#00677d] text-white shadow-sm shadow-[#00677d]/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-[#00677d]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom: Staff Profile & Exit */}
          <div className="p-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="h-8 w-8 rounded-full bg-[#00677d] text-white flex items-center justify-center font-bold text-xs">
                {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-bold text-xs text-slate-800 block truncate">
                  {user?.fullName || "Admin Operator"}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  {user?.email || "admin@tripsharing.id"}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Logout dari Admin
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:pl-64 min-h-screen">
          {/* Top bar on desktop */}
          <div className="hidden md:flex h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Trip Sharing Operations Control</span>
              <span>/</span>
              <span className="text-[#00677d] font-bold capitalize">
                {pathname.replace("/admin", "").replace("/", "") || "Overview"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="azure" className="text-xs">
                Sistem Auto-Grouping Aktif
              </Badge>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}

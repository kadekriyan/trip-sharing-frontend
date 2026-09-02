"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/context/auth-context";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-[#00677d] animate-spin" />
        <span className="text-xs font-semibold text-slate-500">
          Memverifikasi hak akses portal admin...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-stitch-card space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <h2 className="font-heading font-extrabold text-xl text-[#191c1e]">
            Akses Ditolak (403 Forbidden)
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Akun Anda (<strong>{user?.email}</strong>) tidak memiliki izin administrator untuk membuka portal ini.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/">Kembali ke Beranda</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Ganti Akun Admin</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

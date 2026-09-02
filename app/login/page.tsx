"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { useAuth } from "@/src/context/auth-context";

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<"traveler" | "admin">("traveler");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan kata sandi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login({ email, password });
      if (loggedUser.role === "admin") {
        router.push(redirectPath.startsWith("/admin") ? redirectPath : "/admin");
      } else {
        router.push(redirectPath.startsWith("/admin") ? "/" : redirectPath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kredensial login tidak valid.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (type: "admin" | "traveler") => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const demoEmail = type === "admin" ? "admin@tripsharing.id" : "budi@example.com";
    const demoPass = "Password123!";

    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      const loggedUser = await login({ email: demoEmail, password: demoPass });
      if (loggedUser.role === "admin") {
        router.push("/admin");
      } else {
        router.push(redirectPath.startsWith("/admin") ? "/bookings" : redirectPath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal login demo.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 mx-auto group">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] p-2 shadow-md">
              <Image src="/images/logo.png" alt="Logo" fill className="object-contain brightness-110" />
            </div>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Selamat Datang Kembali
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Masuk ke akun Anda untuk mengelola perjalanan atau portal operasional.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100 shadow-stitch-card bg-white space-y-6">
          {/* Role Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab("traveler");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "traveler"
                  ? "bg-white text-[#00677d] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <User className="h-3.5 w-3.5" />
              Traveler Member
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "admin"
                  ? "bg-[#00677d] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Staff Admin
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Email Akun *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="email"
                  placeholder={activeTab === "admin" ? "admin@tripsharing.id" : "nama@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Kata Sandi *
                </label>
                <span className="text-[11px] text-[#00677d] hover:underline cursor-pointer">
                  Lupa password?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 bg-slate-50 border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center font-bold text-sm shadow-md mt-2"
            >
              {isSubmitting ? "Memverifikasi..." : `Masuk sebagai ${activeTab === "admin" ? "Staff Admin" : "Traveler"}`}
            </Button>
          </form>

          {/* Quick 1-Click Demo Section */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Akses Cepat Pengujian (1-Click Demo)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin("admin")}
                className="text-xs text-[#00677d] border-[#00677d]/30 hover:bg-[#00677d]/5 justify-center gap-1"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Demo Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickDemoLogin("traveler")}
                className="text-xs text-[#ff7f50] border-[#ff7f50]/30 hover:bg-[#ff7f50]/5 justify-center gap-1"
              >
                <User className="h-3.5 w-3.5" />
                Demo Traveler
              </Button>
            </div>
          </div>
        </Card>

        {/* Footer Link to Register */}
        <p className="text-center text-xs text-slate-500">
          Belum punya akun traveler?{" "}
          <Link href="/register" className="font-bold text-[#00677d] hover:underline">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <LoginFormContent />
    </Suspense>
  );
}

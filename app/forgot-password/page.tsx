"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { authService } from "@/src/services/auth.service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !email.includes("@")) {
      setErrorMsg("Mohon masukkan alamat email yang valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.forgotPassword(email);
      setSuccessMsg(
        res.message ||
          "Jika email terdaftar di sistem kami, tautan untuk mengatur ulang kata sandi telah dikirim ke kotak masuk Anda. Silakan periksa folder Spam/Inbox."
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal memproses permintaan lupa kata sandi. Silakan coba lagi.";
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
              <Image
                src="/images/logo.png"
                alt="Logo"
                fill
                className="object-contain brightness-110"
              />
            </div>
          </Link>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            Lupa Kata Sandi?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan tautan aman untuk mereset kata sandi.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100 shadow-stitch-card bg-white space-y-6">
          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#00677d] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-[#00677d]">Instruksi Terkirim!</p>
                  <p className="leading-relaxed">{successMsg}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-700">Tips penting:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
                  <li>Tautan berlaku selama <strong>1 jam</strong>.</li>
                  <li>Periksa juga folder <strong>Spam / Junk</strong> jika tidak ditemukan di Inbox.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setSuccessMsg(null);
                    setEmail("");
                  }}
                  variant="outline"
                  className="w-full text-xs font-semibold"
                >
                  Kirim Ulang ke Email Lain
                </Button>
                <Link href="/login" className="w-full">
                  <Button
                    className="w-full justify-center font-bold text-sm shadow-md bg-[#00677d] hover:bg-[#005264]"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Kembali ke Halaman Masuk
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Alamat Email Terdaftar *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-50 border-slate-200 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center font-bold text-sm shadow-md mt-2 bg-[#00677d] hover:bg-[#005264]"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {isSubmitting ? "Mengirim Tautan..." : "Kirim Tautan Reset"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-[#00677d] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                  Kembali ke Halaman Masuk
                </Link>
              </div>
            </form>
          )}
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

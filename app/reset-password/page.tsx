"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { authService } from "@/src/services/auth.service";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    token ? null : "Token pengaturan ulang kata sandi tidak ditemukan atau tautan rusak."
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let isMounted = true;
    const verify = async () => {
      try {
        const res = await authService.verifyResetToken(token);
        if (isMounted) {
          setTokenValid(res.valid);
          setUserEmail(res.email || null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setTokenValid(false);
          setErrorMsg(
            err instanceof Error
              ? err.message
              : "Tautan reset kata sandi tidak valid atau telah kedaluwarsa."
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    };

    verify();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authService.resetPassword(token, password);
      setSuccessMsg(
        res.message || "Kata sandi akun Anda berhasil diperbarui! Mengalihkan ke halaman masuk..."
      );
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Gagal mengatur ulang kata sandi. Silakan coba lagi.";
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
            Atur Kata Sandi Baru
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {userEmail ? (
              <span>
                Memperbarui kata sandi untuk akun <strong className="text-slate-800">{userEmail}</strong>
              </span>
            ) : (
              "Masukkan kata sandi baru yang aman untuk akun Anda."
            )}
          </p>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100 shadow-stitch-card bg-white space-y-6">
          {/* Loading State during Token Verification */}
          {isVerifying ? (
            <div className="py-12 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-[#00677d] animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Memverifikasi keamanan tautan...</p>
            </div>
          ) : !tokenValid ? (
            /* Invalid / Expired Token State */
            <div className="space-y-4 text-center py-4">
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900">Tautan Tidak Berlaku</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {errorMsg || "Tautan pengaturan ulang kata sandi sudah kedaluwarsa atau telah digunakan."}
                </p>
              </div>

              <div className="pt-3">
                <Link href="/forgot-password" className="w-full">
                  <Button className="w-full justify-center font-bold text-xs shadow-md bg-[#00677d] hover:bg-[#005264]">
                    Minta Tautan Reset Baru
                  </Button>
                </Link>
              </div>
            </div>
          ) : successMsg ? (
            /* Success Reset State */
            <div className="space-y-4 text-center py-4">
              <div className="h-12 w-12 rounded-full bg-teal-50 border border-teal-200 text-[#00677d] flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-bold text-base text-slate-900">Kata Sandi Berhasil Diubah!</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {successMsg}
                </p>
              </div>

              <div className="pt-3">
                <Link href="/login" className="w-full">
                  <Button className="w-full justify-center font-bold text-xs shadow-md bg-[#00677d] hover:bg-[#005264]">
                    Masuk Sekarang <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            /* Valid Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Kata Sandi Baru *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10 bg-slate-50 border-slate-200 text-sm"
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    required
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-10 bg-slate-50 border-slate-200 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full justify-center font-bold text-sm shadow-md mt-2 bg-[#00677d] hover:bg-[#005264]"
              >
                <ShieldCheck className="h-4 w-4 mr-2" />
                {isSubmitting ? "Menyimpan Perubahan..." : "Simpan Kata Sandi Baru"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}

"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import { authService } from "@/src/services/auth.service";
import { useAuth } from "@/src/context/auth-context";

export default function AdminChangePasswordPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Validation rules
  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isNotSame = newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword;
  const canSubmit = currentPassword.length > 0 && isMinLength && isMatch && isNotSame && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentPassword) {
      setFeedback({ type: "error", message: "Masukkan kata sandi saat ini." });
      return;
    }

    if (!isMinLength) {
      setFeedback({ type: "error", message: "Kata sandi baru minimal harus 6 karakter." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "Konfirmasi kata sandi baru tidak cocok." });
      return;
    }

    if (currentPassword === newPassword) {
      setFeedback({ type: "error", message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setFeedback({
        type: "success",
        message: res.message || "Kata sandi akun admin Anda berhasil diperbarui.",
      });

      // Clear fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui kata sandi. Silakan coba lagi.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00677d]">
              Pengaturan Akun
            </span>
            <Badge variant="azure" className="text-[10px]">
              Keamanan HQ
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading flex items-center gap-2.5">
            <KeyRound className="h-6 w-6 text-[#00677d]" />
            Ganti Kata Sandi Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Perbarui kata sandi akun operator admin Anda secara berkala untuk menjaga keamanan sistem trip sharing.
          </p>
        </div>
      </div>

      {/* Profile info card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00677d] to-[#00a3c4] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            {user?.fullName?.slice(0, 2).toUpperCase() || "AD"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{user?.fullName || "Admin Operator"}</span>
              <Badge variant="coral" className="text-[10px] uppercase">
                {user?.role || "admin"}
              </Badge>
            </div>
            <span className="text-xs text-slate-500 font-mono block mt-0.5">
              {user?.email || "admin@sharingtouryogyakarta.com"}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 font-medium">
          <ShieldCheck className="h-4 w-4" />
          <span>Sesi Login Terverifikasi</span>
        </div>
      </div>

      {/* Feedback alerts */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 text-rose-600 flex-shrink-0" />
          )}
          <div className="flex-1 font-medium">{feedback.message}</div>
        </div>
      )}

      {/* Password Change Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    placeholder="Masukkan kata sandi lama Anda"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Toggle visibility"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Verifikasi keamanan untuk memastikan Anda adalah pemilik akun.
                </p>
              </div>

              <hr className="border-slate-100" />

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Toggle visibility"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Ketik ulang kata sandi baru Anda"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10 text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label="Toggle visibility"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#00677d] hover:bg-[#005566] text-white font-bold text-xs rounded-xl shadow-sm gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memproses Pembaruan...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Simpan Kata Sandi Baru
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Security Checklist Card */}
        <div className="space-y-4">
          <Card className="p-5 bg-slate-50 border-slate-200/80 rounded-2xl space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00677d]" />
              Ketentuan Kata Sandi
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isMinLength ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
                <span className={isMinLength ? "text-slate-800 font-semibold" : "text-slate-500"}>
                  Minimal 6 karakter
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isMatch ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
                <span className={isMatch ? "text-slate-800 font-semibold" : "text-slate-500"}>
                  Konfirmasi password cocok
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isNotSame ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isNotSame ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </div>
                <span className={isNotSame ? "text-slate-800 font-semibold" : "text-slate-500"}>
                  Berbeda dari kata sandi lama
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
              Disarankan menggunakan kombinasi huruf besar, angka, dan simbol untuk keamanan maksimal pada akun admin.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { CountryCombobox } from "@/src/components/ui/country-combobox";
import { useAuth } from "@/src/context/auth-context";
import { sanitizePhoneNumber } from "@/src/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationality, setNationality] = useState("Indonesia");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName || !email || !password || !phoneNumber) {
      setErrorMsg("Please complete all required fields (*).");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        fullName,
        email,
        password,
        phoneNumber: sanitizePhoneNumber(phoneNumber),
        nationality,
      });
      router.push("/bookings");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
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
            Create Traveler Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Join our trip cost-sharing community and enjoy affordable, reliable travel.
          </p>
        </div>

        <Card className="p-6 sm:p-8 border border-slate-100 shadow-stitch-card bg-white space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                WhatsApp / Phone *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="tel"
                  placeholder="+6281234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  required
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Nationality
              </label>
              <CountryCombobox
                value={nationality}
                onChange={setNationality}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full justify-center font-bold text-sm shadow-md mt-2"
            >
              {isSubmitting ? "Registering..." : "Create Account"}
            </Button>
          </form>
        </Card>

        {/* Footer Link to Login */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#00677d] hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

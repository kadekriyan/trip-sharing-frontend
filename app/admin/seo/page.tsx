"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Globe,
  Save,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileCode2,
  Share2,
  Bot,
  Search,
  Plus,
  X,
  Code,
  Eye,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { adminService } from "@/src/services/admin.service";
import { DEFAULT_SEO_SETTINGS } from "@/src/services/seo.service";
import type { GlobalSeoSettings, UpdateSeoSettingsPayload } from "@/src/types";

export default function AdminSeoSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "social" | "webmaster" | "schema">("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [siteTitleDefault, setSiteTitleDefault] = useState("");
  const [siteTitleTemplate, setSiteTitleTemplate] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [defaultOgImage, setDefaultOgImage] = useState("");
  const [googleVerificationTag, setGoogleVerificationTag] = useState("");
  const [organizationSchemaJson, setOrganizationSchemaJson] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);

  // JSON Validation State
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await adminService.getAdminSeoSettings();
        if (isMounted && data) {
          populateForm(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat pengaturan SEO.";
        if (isMounted) {
          populateForm(DEFAULT_SEO_SETTINGS);
          setFeedback({ type: "error", message: msg });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const populateForm = (settings: GlobalSeoSettings) => {
    setSiteTitleDefault(settings.siteTitleDefault || DEFAULT_SEO_SETTINGS.siteTitleDefault);
    setSiteTitleTemplate(settings.siteTitleTemplate || DEFAULT_SEO_SETTINGS.siteTitleTemplate);
    setMetaDescription(settings.metaDescription || DEFAULT_SEO_SETTINGS.metaDescription);
    setKeywords(Array.isArray(settings.keywords) ? settings.keywords : DEFAULT_SEO_SETTINGS.keywords);
    setDefaultOgImage(settings.defaultOgImage || DEFAULT_SEO_SETTINGS.defaultOgImage);
    setGoogleVerificationTag(settings.googleVerificationTag || "");
    setRobotsIndex(settings.robotsIndex !== undefined ? settings.robotsIndex : true);

    // Schema JSON
    if (settings.organizationSchemaJson) {
      try {
        const parsed = JSON.parse(settings.organizationSchemaJson);
        setOrganizationSchemaJson(JSON.stringify(parsed, null, 2));
      } catch {
        setOrganizationSchemaJson(settings.organizationSchemaJson);
      }
    } else {
      const defaultOrg = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Share Tour Jogja",
        url: "https://sharingtouryogyakarta.com",
        logo: "https://sharingtouryogyakarta.com/images/logo.png",
        description: settings.metaDescription || DEFAULT_SEO_SETTINGS.metaDescription,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+6281216916003",
          contactType: "customer service",
          areaServed: "ID",
          availableLanguage: ["English", "Indonesian"],
        },
      };
      setOrganizationSchemaJson(JSON.stringify(defaultOrg, null, 2));
    }
  };

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== kwToRemove));
  };

  const handleSchemaChange = (value: string) => {
    setOrganizationSchemaJson(value);
    if (!value.trim()) {
      setJsonValidationError(null);
      return;
    }
    try {
      JSON.parse(value);
      setJsonValidationError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sintaks JSON tidak valid.";
      setJsonValidationError(msg);
    }
  };

  const handleFormatJson = () => {
    if (!organizationSchemaJson.trim()) return;
    try {
      const parsed = JSON.parse(organizationSchemaJson);
      setOrganizationSchemaJson(JSON.stringify(parsed, null, 2));
      setJsonValidationError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tidak dapat memformat: Sintaks JSON salah.";
      setJsonValidationError(msg);
    }
  };

  const handleResetToDefault = () => {
    if (confirm("Kembalikan semua pengaturan SEO ke nilai default bawaan sistem?")) {
      populateForm(DEFAULT_SEO_SETTINGS);
      setFeedback({ type: "success", message: "Form dikembalikan ke default. Klik 'Simpan Perubahan' untuk menerapkan." });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validate JSON if filled
    if (organizationSchemaJson.trim()) {
      try {
        JSON.parse(organizationSchemaJson);
      } catch {
        setFeedback({ type: "error", message: "Sintaks Organization Schema JSON-LD tidak valid. Harap perbaiki sebelum menyimpan." });
        setActiveTab("schema");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: UpdateSeoSettingsPayload = {
        siteTitleDefault: siteTitleDefault.trim(),
        siteTitleTemplate: siteTitleTemplate.trim(),
        metaDescription: metaDescription.trim(),
        keywords,
        defaultOgImage: defaultOgImage.trim(),
        googleVerificationTag: googleVerificationTag.trim() || null,
        organizationSchemaJson: organizationSchemaJson.trim() || null,
        robotsIndex,
      };

      await adminService.updateAdminSeoSettings(payload);
      setFeedback({ type: "success", message: "Pengaturan SEO & Schema berhasil diperbarui!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan SEO.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#00677d]" />
        <p className="text-xs font-semibold text-slate-500">Memuat konfigurasi SEO...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#00677d]">
              SEO &amp; Schema Management
            </h1>
            <Badge variant="coral" className="text-[10px] uppercase font-bold">
              Dynamic Metadata
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Kelola meta tags, target kata kunci, kartu media sosial, dan Structured Data (Schema.org) untuk optimasi mesin pencari Google.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            className="text-xs font-bold text-slate-600 border-slate-300 hover:bg-slate-100"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Default
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs font-bold bg-[#00677d] hover:bg-[#005264] text-white shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "general"
              ? "bg-[#00677d] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          General Metadata
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "social"
              ? "bg-[#00677d] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Share2 className="h-3.5 w-3.5" />
          OpenGraph &amp; Social Share
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "schema"
              ? "bg-[#00677d] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileCode2 className="h-3.5 w-3.5" />
          Schema.org JSON-LD
          {jsonValidationError && (
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("webmaster")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "webmaster"
              ? "bg-[#00677d] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Bot className="h-3.5 w-3.5" />
          Webmaster &amp; Crawlers
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: GENERAL METADATA */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#00677d]" />
                    Informasi Judul &amp; Deskripsi Dasar
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi meta tag utama yang terbaca oleh perayap mesin pencari.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Default Site Title *
                  </label>
                  <Input
                    required
                    value={siteTitleDefault}
                    onChange={(e) => setSiteTitleDefault(e.target.value)}
                    placeholder="Contoh: Share Tour Jogja — Open Trip & Yogyakarta Sharing Tours"
                  />
                  <p className="text-[10px] text-slate-400">
                    Judul default untuk halaman beranda (Homepage).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Title Template *
                  </label>
                  <Input
                    required
                    value={siteTitleTemplate}
                    onChange={(e) => setSiteTitleTemplate(e.target.value)}
                    placeholder="%s | Share Tour Jogja"
                  />
                  <p className="text-[10px] text-slate-400">
                    Gunakan token <code className="bg-slate-100 px-1 py-0.5 rounded text-[#00677d] font-bold">%s</code> untuk disubstitusi dengan judul subhalaman (misal: Detail Destinasi).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Meta Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00677d]/20 focus:border-[#00677d]"
                    placeholder="Tuliskan deskripsi singkat mengenai layanan open trip dan cost sharing..."
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Rekomendasi panjang: 120 – 160 karakter.</span>
                    <span className={metaDescription.length > 160 ? "text-amber-600 font-bold" : ""}>
                      {metaDescription.length} karakter
                    </span>
                  </div>
                </div>
              </Card>

              {/* Keywords Tag Manager */}
              <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Search className="h-4 w-4 text-[#00677d]" />
                    Target Kata Kunci (Keywords)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Daftar kata kunci pencarian utama yang ditargetkan di meta keywords.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={handleAddKeyword}
                    placeholder="Ketik kata kunci lalu tekan Enter..."
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    onClick={handleAddKeyword}
                    size="sm"
                    className="bg-[#00677d] text-white shrink-0 font-bold text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {keywords.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Belum ada kata kunci ditambahkan.</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5 space-y-5">
              <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Eye className="h-4 w-4 text-[#00677d]" />
                  Preview Hasil Pencarian Google (SERP)
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span>https://sharingtouryogyakarta.com</span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {siteTitleDefault || "Share Tour Jogja — Open Trip & Yogyakarta Sharing Tours"}
                  </h4>
                  <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {metaDescription || "Open trip and sharing tour platform in Yogyakarta & Indonesia..."}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: SOCIAL & OPENGRAPH */}
        {activeTab === "social" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-[#00677d]" />
                    Pratinjau Berbagi Media Sosial (OpenGraph &amp; Twitter Cards)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Gambar dan judul yang tampil saat tautan website dibagikan di WhatsApp, Facebook, Telegram, dan Twitter/X.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                    Default OG Cover Image URL *
                  </label>
                  <Input
                    required
                    value={defaultOgImage}
                    onChange={(e) => setDefaultOgImage(e.target.value)}
                    placeholder="https://... atau /images/hero-bromo.png"
                  />
                  <p className="text-[10px] text-slate-400">
                    Rekomendasi resolusi: <code className="font-bold">1200 x 630 px</code> format PNG atau JPG.
                  </p>
                </div>
              </Card>
            </div>

            {/* Social Share Card Preview */}
            <div className="lg:col-span-5 space-y-5">
              <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Eye className="h-4 w-4 text-[#00677d]" />
                  Preview Kartu Media Sosial (Facebook / WhatsApp)
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
                  <div className="relative h-44 w-full bg-slate-800">
                    <Image
                      src={defaultOgImage.startsWith("http") ? defaultOgImage : defaultOgImage || "/images/hero-bromo.png"}
                      alt="OG Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-4 space-y-1 bg-slate-50/70 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      sharingtouryogyakarta.com
                    </span>
                    <h5 className="font-heading font-bold text-xs text-slate-800 line-clamp-1">
                      {siteTitleDefault || "Share Tour Jogja — Open Trip & Yogyakarta Sharing Tours"}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {metaDescription || "Open trip and sharing tour platform in Yogyakarta & Indonesia..."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: SCHEMA.ORG JSON-LD */}
        {activeTab === "schema" && (
          <div className="space-y-5">
            <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                    <FileCode2 className="h-4 w-4 text-[#00677d]" />
                    Organization Structured Data (JSON-LD)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Schema.org/Organization yang disuntikkan secara dinamis pada root header website untuk Google Knowledge Graph.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFormatJson}
                    className="text-xs font-bold gap-1 text-[#00677d] border-[#00677d]/30 hover:bg-[#00677d]/5"
                  >
                    <Code className="h-3.5 w-3.5" />
                    Format JSON
                  </Button>
                </div>
              </div>

              {jsonValidationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{jsonValidationError}</span>
                </div>
              )}

              <div className="space-y-2">
                <textarea
                  rows={14}
                  value={organizationSchemaJson}
                  onChange={(e) => handleSchemaChange(e.target.value)}
                  className={`w-full font-mono text-xs p-4 rounded-xl border ${
                    jsonValidationError
                      ? "border-rose-400 bg-rose-50/30 text-rose-900"
                      : "border-slate-200 bg-slate-900 text-emerald-400"
                  } focus:outline-none focus:ring-2 focus:ring-[#00677d]/30`}
                  placeholder='{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  ...\n}'
                />
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Pastikan sintaks JSON valid. Jika dikosongkan, sistem otomatis membentuk Organization schema bawaan.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: WEBMASTER & CRAWLERS */}
        {activeTab === "webmaster" && (
          <div className="space-y-5 max-w-3xl">
            <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#00677d]" />
                  Verifikasi Mesin Pencari &amp; Robot Crawler
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pengaturan kode verifikasi kepemilikan Google Search Console dan kontrol perayapan bot.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Google Search Console Verification Tag
                </label>
                <Input
                  value={googleVerificationTag}
                  onChange={(e) => setGoogleVerificationTag(e.target.value)}
                  placeholder="Contoh: google-site-verification=XXXXXXXXXXXXXXXXXXXXX"
                />
                <p className="text-[10px] text-slate-400">
                  Masukkan nilai meta tag atau kode hash verifikasi Google Search Console.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">
                      Search Engine Indexing Status
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Izinkan Google, Bing, dan bot crawler mengindeks halaman publik website ini.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={robotsIndex}
                      onChange={(e) => setRobotsIndex(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00677d]"></div>
                  </label>
                </div>
                {!robotsIndex && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-2 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Peringatan: Mode NoIndex aktif. Situs akan memblokir pengindeksan mesin pencari (Disallow/NoIndex).
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}
      </form>
    </div>
  );
}

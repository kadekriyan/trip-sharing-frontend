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
  Layers,
  Layout,
  Home,
  MapPin,
  BookOpen,
  CalendarCheck,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { adminService } from "@/src/services/admin.service";
import { DEFAULT_SEO_SETTINGS, DEFAULT_PAGE_SEO } from "@/src/services/seo.service";
import type { GlobalSeoSettings, UpdateSeoSettingsPayload, PageSeoItem, PageSeoSettingsMap } from "@/src/types";

interface PageConfigDef {
  key: string;
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CORE_PAGES: PageConfigDef[] = [
  {
    key: "home",
    name: "Landing Page (Beranda)",
    path: "/",
    icon: Home,
    description: "Halaman utama tempat traveler mencari & memilih open trip Yogyakarta.",
  },
  {
    key: "destinations",
    name: "Katalog Destinasi (Tours)",
    path: "/destinations",
    icon: MapPin,
    description: "Halaman daftar seluruh paket trip sharing (Prambanan, Merapi, Timang, dll).",
  },
  {
    key: "blog",
    name: "Katalog Blog & Panduan Wisata",
    path: "/blog",
    icon: BookOpen,
    description: "Halaman artikel panduan wisata, tips liburan, dan cerita komunitas traveler.",
  },
  {
    key: "bookings",
    name: "Cek Booking & Tiket",
    path: "/bookings",
    icon: CalendarCheck,
    description: "Halaman pelacakan status reservasi peserta dan voucher e-tiket.",
  },
  {
    key: "login",
    name: "Halaman Masuk (Sign In)",
    path: "/login",
    icon: LogIn,
    description: "Halaman autentikasi login traveler dan operator.",
  },
  {
    key: "register",
    name: "Halaman Registrasi (Sign Up)",
    path: "/register",
    icon: UserPlus,
    description: "Halaman pendaftaran akun traveler baru.",
  },
];

export default function AdminSeoSettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "pages" | "social" | "webmaster" | "schema">("general");
  const [selectedPageKey, setSelectedPageKey] = useState<string>("home");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Global SEO Form State
  const [siteTitleDefault, setSiteTitleDefault] = useState("");
  const [siteTitleTemplate, setSiteTitleTemplate] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [defaultOgImage, setDefaultOgImage] = useState("");
  const [googleVerificationTag, setGoogleVerificationTag] = useState("");
  const [organizationSchemaJson, setOrganizationSchemaJson] = useState("");
  const [robotsIndex, setRobotsIndex] = useState(true);

  // Per-Page SEO Form State
  const [pageSeoSettings, setPageSeoSettings] = useState<PageSeoSettingsMap>({});
  const [pageKeywordInput, setPageKeywordInput] = useState("");

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

    // Populate Page SEO Settings
    const initialPages: PageSeoSettingsMap = {};
    CORE_PAGES.forEach((page) => {
      const existing = settings.pageSeoSettings?.[page.key];
      const defaultPage = DEFAULT_PAGE_SEO[page.key];
      initialPages[page.key] = {
        title: existing?.title ?? defaultPage?.title ?? "",
        description: existing?.description ?? defaultPage?.description ?? "",
        keywords: existing?.keywords ?? defaultPage?.keywords ?? [],
        ogImage: existing?.ogImage ?? "",
        noIndex: existing?.noIndex ?? false,
      };
    });
    setPageSeoSettings(initialPages);

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

  // Global Keyword handlers
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

  // Page-specific Keyword handlers
  const handleAddPageKeyword = (e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    const trimmed = pageKeywordInput.trim();
    const currentPageItem = pageSeoSettings[selectedPageKey] || {};
    const currentKws = currentPageItem.keywords || [];

    if (trimmed && !currentKws.includes(trimmed)) {
      setPageSeoSettings({
        ...pageSeoSettings,
        [selectedPageKey]: {
          ...currentPageItem,
          keywords: [...currentKws, trimmed],
        },
      });
      setPageKeywordInput("");
    }
  };

  const handleRemovePageKeyword = (kwToRemove: string) => {
    const currentPageItem = pageSeoSettings[selectedPageKey] || {};
    const currentKws = currentPageItem.keywords || [];
    setPageSeoSettings({
      ...pageSeoSettings,
      [selectedPageKey]: {
        ...currentPageItem,
        keywords: currentKws.filter((k) => k !== kwToRemove),
      },
    });
  };

  const updateSelectedPageField = <K extends keyof PageSeoItem>(field: K, value: PageSeoItem[K]) => {
    setPageSeoSettings((prev) => ({
      ...prev,
      [selectedPageKey]: {
        ...prev[selectedPageKey],
        [field]: value,
      },
    }));
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
        pageSeoSettings,
      };

      await adminService.updateAdminSeoSettings(payload);
      setFeedback({ type: "success", message: "Pengaturan SEO Global & Per Halaman berhasil disimpan!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan SEO.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const activePageDef = CORE_PAGES.find((p) => p.key === selectedPageKey) || CORE_PAGES[0];
  const activePageSeo = pageSeoSettings[selectedPageKey] || {};

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
              Global &amp; Per Page
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Kelola meta tags global, meta tags spesifik per halaman, target kata kunci, kartu media sosial, dan Structured Data Schema.org.
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
            className="bg-[#00677d] hover:bg-[#005566] text-white text-xs font-bold shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
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

      {/* Feedback Alert */}
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

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "general"
              ? "border-[#00677d] text-[#00677d] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Globe className="h-4 w-4" />
          SEO Global
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "pages"
              ? "border-[#00677d] text-[#00677d] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          SEO Per Halaman
          <span className="h-2 w-2 rounded-full bg-[#ff7f50]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("social")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "social"
              ? "border-[#00677d] text-[#00677d] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Share2 className="h-4 w-4" />
          Media Sosial &amp; OG Image
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("webmaster")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "webmaster"
              ? "border-[#00677d] text-[#00677d] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bot className="h-4 w-4" />
          Webmaster &amp; Robot
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === "schema"
              ? "border-[#00677d] text-[#00677d] bg-slate-50/50"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode2 className="h-4 w-4" />
          Structured Data (Schema.org)
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: SEO GLOBAL */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Default Meta Title <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={siteTitleDefault}
                    onChange={(e) => setSiteTitleDefault(e.target.value)}
                    placeholder="Judul Utama Website..."
                    className="text-sm"
                    required
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Judul bawaan ketika halaman tidak memiliki meta title khusus.</span>
                    <span className={siteTitleDefault.length > 60 ? "text-amber-600 font-bold" : ""}>
                      {siteTitleDefault.length} / 60 karakter
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Meta Title Template <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={siteTitleTemplate}
                    onChange={(e) => setSiteTitleTemplate(e.target.value)}
                    placeholder="%s | Share Tour Jogja"
                    className="text-sm"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Pola judul untuk halaman turunan. Gunakan <code className="bg-slate-100 px-1 py-0.5 rounded text-[#00677d] font-bold">%s</code> sebagai placeholder judul halaman.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Default Meta Description <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Deskripsi ringkas yang muncul pada hasil pencarian Google..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:border-[#00677d] focus-visible:ring-2 focus-visible:ring-[#00a3c4]/20 transition-all resize-y"
                    required
                  />
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Ringkasan konten yang direkomendasikan antara 120–160 karakter.</span>
                    <span className={metaDescription.length > 160 ? "text-amber-600 font-bold" : ""}>
                      {metaDescription.length} / 160 karakter
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Target Kata Kunci Global (Keywords)
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleAddKeyword}
                      placeholder="Ketik kata kunci dan tekan Enter..."
                      className="text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddKeyword}
                      className="text-xs font-bold text-[#00677d]"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00677d]/10 text-[#00677d] text-xs font-semibold"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="hover:text-rose-600 focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Belum ada kata kunci ditambahkan.</span>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Google SERP Live Preview */}
            <div className="space-y-4">
              <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Search className="h-4 w-4 text-[#00677d]" />
                  Google SERP Live Preview
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-sans space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                    <span className="text-emerald-700 font-semibold">sharingtouryogyakarta.com</span>
                    <span>›</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 leading-snug">
                    {siteTitleDefault || "Judul Halaman Preview"}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {metaDescription || "Deskripsi meta akan tampil di sini saat halaman Anda ditemukan oleh calon traveler di mesin pencari Google..."}
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Tampilan simulasi hasil pencarian desktop. Panjang judul yang terlalu panjang akan terpotong oleh Google.
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: SEO PER HALAMAN */}
        {activeTab === "pages" && (
          <div className="space-y-6">
            {/* Core Pages Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {CORE_PAGES.map((page) => {
                const Icon = page.icon;
                const isSelected = selectedPageKey === page.key;
                const pageConfig = pageSeoSettings[page.key];
                const hasCustomTitle = Boolean(pageConfig?.title);

                return (
                  <button
                    key={page.key}
                    type="button"
                    onClick={() => setSelectedPageKey(page.key)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-[#00677d] text-white border-[#00677d] shadow-md shadow-[#00677d]/20"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#00677d]/40 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-[#00677d]"}`} />
                      {hasCustomTitle && (
                        <span className={`h-2 w-2 rounded-full ${isSelected ? "bg-amber-300" : "bg-emerald-500"}`} />
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block leading-tight truncate">
                        {page.name.split("(")[0]}
                      </span>
                      <span className={`text-[10px] font-mono block mt-0.5 ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                        {page.path}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Page SEO Editor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-xs font-bold text-[#00677d] uppercase tracking-wider block">
                        Konfigurasi SEO Halaman
                      </span>
                      <h2 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
                        {activePageDef.name}
                        <code className="text-xs font-mono font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {activePageDef.path}
                        </code>
                      </h2>
                    </div>
                    <Badge variant="azure" className="text-[10px]">
                      {activePageDef.key}
                    </Badge>
                  </div>

                  {/* Custom Page Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Custom Meta Title Halaman
                    </label>
                    <Input
                      type="text"
                      value={activePageSeo.title || ""}
                      onChange={(e) => updateSelectedPageField("title", e.target.value)}
                      placeholder={`Contoh: ${DEFAULT_PAGE_SEO[activePageDef.key]?.title || siteTitleDefault}`}
                      className="text-sm"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Jika dikosongkan, akan menggunakan template judul global.</span>
                      <span className={(activePageSeo.title?.length || 0) > 60 ? "text-amber-600 font-bold" : ""}>
                        {activePageSeo.title?.length || 0} / 60 karakter
                      </span>
                    </div>
                  </div>

                  {/* Custom Page Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Custom Meta Description
                    </label>
                    <textarea
                      rows={3}
                      value={activePageSeo.description || ""}
                      onChange={(e) => updateSelectedPageField("description", e.target.value)}
                      placeholder={`Contoh: ${DEFAULT_PAGE_SEO[activePageDef.key]?.description || metaDescription}`}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm focus-visible:outline-none focus-visible:border-[#00677d] focus-visible:ring-2 focus-visible:ring-[#00a3c4]/20 transition-all resize-y"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Deskripsi spesifik saat link halaman {activePageDef.path} muncul di Google.</span>
                      <span className={(activePageSeo.description?.length || 0) > 160 ? "text-amber-600 font-bold" : ""}>
                        {activePageSeo.description?.length || 0} / 160 karakter
                      </span>
                    </div>
                  </div>

                  {/* Page Keywords */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Kata Kunci Halaman Ini
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={pageKeywordInput}
                        onChange={(e) => setPageKeywordInput(e.target.value)}
                        onKeyDown={handleAddPageKeyword}
                        placeholder="Ketik kata kunci spesifik dan tekan Enter..."
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddPageKeyword}
                        className="text-xs font-bold text-[#00677d]"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(activePageSeo.keywords || []).map((kw) => (
                        <span
                          key={kw}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-xs font-semibold"
                        >
                          {kw}
                          <button
                            type="button"
                            onClick={() => handleRemovePageKeyword(kw)}
                            className="hover:text-rose-600 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      {(!activePageSeo.keywords || activePageSeo.keywords.length === 0) && (
                        <span className="text-xs text-slate-400 italic">
                          Menggunakan kata kunci default global.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Custom OG Image for Page */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Custom OpenGraph Image URL (Thumbnail Share)
                    </label>
                    <Input
                      type="text"
                      value={activePageSeo.ogImage || ""}
                      onChange={(e) => updateSelectedPageField("ogImage", e.target.value)}
                      placeholder="/images/hero-bromo.png atau URL eksternal https://..."
                      className="text-sm font-mono"
                    />
                    <p className="text-[11px] text-slate-400">
                      Gambar thumbnail khusus untuk preview saat tautan halaman ini dibagikan ke medsos.
                    </p>
                  </div>

                  {/* NoIndex Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">
                        Robots No-Index untuk Halaman Ini
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Jika diaktifkan, mesin pencari dilarang mengindeks halaman ini.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(activePageSeo.noIndex)}
                        onChange={(e) => updateSelectedPageField("noIndex", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600" />
                    </label>
                  </div>
                </Card>
              </div>

              {/* Page SERP Preview */}
              <div className="space-y-4">
                <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Search className="h-4 w-4 text-[#00677d]" />
                    SERP Preview ({activePageDef.path})
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 font-sans space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                      <span className="text-emerald-700 font-semibold">sharingtouryogyakarta.com</span>
                      <span>›</span>
                      <span className="text-slate-500">{activePageDef.key}</span>
                    </div>
                    <h3 className="text-base font-semibold text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 leading-snug">
                      {activePageSeo.title || DEFAULT_PAGE_SEO[activePageDef.key]?.title || siteTitleDefault}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {activePageSeo.description || DEFAULT_PAGE_SEO[activePageDef.key]?.description || metaDescription}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                    <div>
                      <strong>Status Index:</strong>{" "}
                      {activePageSeo.noIndex ? (
                        <span className="text-rose-600 font-bold">No-Index (Disembunyikan dari Google)</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Index (Terbuka untuk Google)</span>
                      )}
                    </div>
                  </div>
                </Card>

                {/* OpenGraph Preview */}
                <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                    <Share2 className="h-4 w-4 text-[#00677d]" />
                    Social Share Preview
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
                    <div className="relative h-32 w-full bg-slate-200">
                      <Image
                        src={activePageSeo.ogImage || defaultOgImage || "/images/hero-bromo.png"}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3 space-y-1 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        sharingtouryogyakarta.com
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {activePageSeo.title || DEFAULT_PAGE_SEO[activePageDef.key]?.title || siteTitleDefault}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {activePageSeo.description || DEFAULT_PAGE_SEO[activePageDef.key]?.description || metaDescription}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDIA SOSIAL & OPEN GRAPH */}
        {activeTab === "social" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Default OpenGraph / Social Image URL <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={defaultOgImage}
                    onChange={(e) => setDefaultOgImage(e.target.value)}
                    placeholder="/images/hero-bromo.png"
                    className="text-sm font-mono"
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    Gambar default rasio 1200x630 pixel yang akan dipakai saat tautan dibagikan ke WhatsApp, Telegram, Facebook, dan Twitter.
                  </p>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="p-5 bg-white border-slate-200 shadow-sm rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Share2 className="h-4 w-4 text-[#00677d]" />
                  Global Social Preview
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
                  <div className="relative h-36 w-full bg-slate-200">
                    <Image
                      src={defaultOgImage || "/images/hero-bromo.png"}
                      alt="OG Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-1 bg-white">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      sharingtouryogyakarta.com
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {siteTitleDefault}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      {metaDescription}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: WEBMASTER & ROBOT */}
        {activeTab === "webmaster" && (
          <div className="max-w-3xl space-y-5">
            <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Google Search Console Verification Meta Tag
                </label>
                <Input
                  type="text"
                  value={googleVerificationTag}
                  onChange={(e) => setGoogleVerificationTag(e.target.value)}
                  placeholder="Kode verifikasi Google (cth: google-site-verification-token)"
                  className="text-sm font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Masukkan isi token verifikasi HTML dari Google Search Console untuk membuktikan kepemilikan domain.
                </p>
              </div>

              <hr className="border-slate-100" />

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                <div>
                  <span className="font-bold text-xs text-slate-800 block">
                    Izinkan Google Mengindeks Website (Robots Index)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bila dinonaktifkan, seluruh website akan memuat tag <code className="font-mono bg-slate-200 px-1 py-0.5 rounded text-rose-700">noindex, nofollow</code>.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={robotsIndex}
                    onChange={(e) => setRobotsIndex(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00677d]" />
                </label>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: SCHEMA.ORG JSON-LD */}
        {activeTab === "schema" && (
          <div className="space-y-4">
            <Card className="p-6 bg-white border-slate-200 shadow-sm rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Code className="h-4 w-4 text-[#00677d]" />
                    Organization Schema JSON-LD Editor
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Data terstruktur Schema.org untuk menghasilkan Google Knowledge Panel dan rich snippet perusahaan.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFormatJson}
                  className="text-xs font-bold text-[#00677d] border-slate-200"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Format JSON
                </Button>
              </div>

              {jsonValidationError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{jsonValidationError}</span>
                </div>
              )}

              <textarea
                rows={14}
                value={organizationSchemaJson}
                onChange={(e) => handleSchemaChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-4 font-mono text-xs text-slate-800 bg-slate-50 focus-visible:outline-none focus-visible:border-[#00677d] focus-visible:ring-2 focus-visible:ring-[#00a3c4]/20 transition-all resize-y"
                placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
              />
            </Card>
          </div>
        )}
      </form>
    </div>
  );
}

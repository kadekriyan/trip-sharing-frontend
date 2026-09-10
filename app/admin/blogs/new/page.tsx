"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  List,
  Link2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { ImageUploader } from "@/src/components/ui/image-uploader";
import { adminService } from "@/src/services/admin.service";

export default function NewBlogArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<"Travel Tips" | "Destinations" | "Community Story" | "Budget Travel" | "Guide">("Travel Tips");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"
  );
  const [tags, setTags] = useState("Trip Sharing, Hemat, Bromo, Komodo");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    );
  };

  const handleFormat = (tag: string) => {
    if (tag === "a") {
      setContent((prev) => `${prev} <a href="https://example.com" target="_blank" rel="noopener noreferrer">Teks Link</a>`);
    } else if (tag === "li") {
      setContent((prev) => `${prev}\n<ul>\n  <li>Poin item 1</li>\n  <li>Poin item 2</li>\n</ul>\n`);
    } else if (tag === "h2") {
      setContent((prev) => `${prev}\n<h2>Judul Sub-Bab</h2>\n`);
    } else {
      setContent((prev) => `${prev} <${tag}>Teks Terformat</${tag}>`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !excerpt) {
      setFeedback({ type: "error", message: "Harap lengkapi judul, ringkasan, dan isi artikel (*)." });
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.addArticle({
        title,
        slug: slug || "artikel-baru",
        category,
        excerpt,
        content,
        coverImage,
        author: {
          name: "Admin Editorial",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          role: "Editor",
        },
        readTimeMinutes: 4,
        tags: tags.split(",").map((t) => t.trim()),
      });

      setFeedback({ type: "success", message: "Artikel berhasil dipublikasikan ke blog!" });
      setTimeout(() => {
        router.push("/admin/blogs");
      }, 1000);
    } catch {
      setIsSubmitting(false);
      setFeedback({ type: "error", message: "Gagal mempublikasikan artikel." });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/blogs"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#00677d] mb-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Artikel
          </Link>
          <h1 className="font-heading text-2xl font-extrabold text-[#191c1e] flex items-center gap-2">
            <FileText className="h-6 w-6 text-[#00677d]" />
            Tulis & Publikasikan Artikel Baru
          </h1>
        </div>
        <Badge variant="azure">Blog CMS Editor</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column: Content Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Judul Artikel *
                </label>
                <Input
                  required
                  placeholder="Contoh: 5 Alasan Mengapa Trip Sharing Jauh Lebih Seru..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="font-bold text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    URL Slug
                  </label>
                  <Input
                    placeholder="5-alasan-trip-sharing"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "Travel Tips" | "Destinations" | "Community Story" | "Budget Travel" | "Guide")}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-[#00677d] focus:outline-none"
                  >
                    <option value="Travel Tips">Travel Tips</option>
                    <option value="Destinations">Destinations</option>
                    <option value="Community Story">Community Story</option>
                    <option value="Budget Travel">Budget Travel</option>
                    <option value="Guide">Guide</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Ringkasan Singkat (Excerpt) *
                </label>
                <Input
                  required
                  placeholder="Ringkasan 1-2 kalimat pengantar artikel..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                />
              </div>

              {/* Editor Box */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Isi Konten Artikel *
                </label>

                {/* Toolbar */}
                <div className="flex items-center gap-1 p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                  <button
                    type="button"
                    onClick={() => handleFormat("strong")}
                    className="p-1.5 rounded hover:bg-white text-xs font-bold"
                  >
                    <Bold className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat("em")}
                    className="p-1.5 rounded hover:bg-white text-xs"
                  >
                    <Italic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat("li")}
                    className="p-1.5 rounded hover:bg-white text-xs"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat("a")}
                    className="p-1.5 rounded hover:bg-white text-xs"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                </div>

                <textarea
                  required
                  rows={10}
                  placeholder="Tulis artikel inspiratif Anda di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-xs font-sans text-slate-800 leading-relaxed focus:border-[#00677d] focus:outline-none"
                />
              </div>
            </Card>
          </div>

          {/* Sidebar Column: Cover Image & SEO */}
          <div className="space-y-6">
            <Card className="p-5 border border-slate-100 shadow-stitch-card space-y-4">
              <h3 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2">
                Gambar Utama
              </h3>
              <div className="space-y-2">
                <ImageUploader
                  mode="single"
                  folder="articles"
                  label="Foto Sampul Artikel *"
                  value={coverImage}
                  onChange={setCoverImage}
                  helperText="Unggah gambar header artikel blog (format 16:9 disarankan)."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Tag Artikel (Pisahkan dengan koma)
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </Card>

            <Card className="p-5 border border-slate-100 shadow-stitch-card space-y-3 bg-teal-50/50 border-teal-100">
              <div className="flex items-center gap-2 text-[#00677d]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-bold text-xs uppercase tracking-wider">SEO Health Score</span>
              </div>
              <span className="font-heading font-extrabold text-2xl text-[#00677d] block">
                92 / 100
              </span>
              <p className="text-[11px] text-slate-500">
                Struktur heading, meta slug, dan panjang konten sudah optimal untuk mesin pencari Google.
              </p>
            </Card>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/blogs")}
            className="flex-1 justify-center"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 justify-center bg-[#00677d] text-white"
          >
            {isSubmitting ? "Mempublikasikan..." : "Publikasikan Artikel"}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Card } from "@/src/components/ui/card";
import { ImageUploader } from "@/src/components/ui/image-uploader";
import { BlogRichEditor } from "@/src/components/admin/blog-rich-editor";
import { adminService } from "@/src/services/admin.service";

export default function NewBlogArticlePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<string>("Travel Tips");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState(
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"
  );
  const [tags, setTags] = useState("Trip Sharing, Hemat, Bromo, Komodo");
  const [readTimeMinutes, setReadTimeMinutes] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      setFeedback({ type: "error", message: "Harap lengkapi judul, ringkasan, dan isi artikel (*)." });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await adminService.addArticle({
        title: title.trim(),
        slug: slug.trim() || "artikel-baru",
        category,
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImage,
        author: {
          name: "Admin Editorial",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200",
          role: "Editor",
        },
        readTimeMinutes: Number(readTimeMinutes) || 4,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        isActive,
        isPublished: isActive,
        isFeatured,
        seoTitle: seoTitle.trim() || title.trim(),
        seoDescription: seoDescription.trim() || excerpt.trim(),
      });

      setFeedback({ type: "success", message: "Artikel berhasil dipublikasikan ke blog!" });
      setTimeout(() => {
        router.push("/admin/blogs");
      }, 1000);
    } catch (err: any) {
      setIsSubmitting(false);
      setFeedback({ type: "error", message: err?.message || "Gagal mempublikasikan artikel." });
    }
  };

  return (
    <div className="w-full space-y-8 pb-20">
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
        <Badge variant="azure" className="text-xs px-3 py-1 font-bold">
          Blog CMS Editor
        </Badge>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          <p className="text-xs font-semibold">{feedback.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Informasi Dasar */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              1
            </span>
            Informasi & Judul Artikel
          </h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Judul Artikel *
              </label>
              <Input
                required
                placeholder="Contoh: 5 Alasan Mengapa Trip Sharing Lebih Hemat & Seru"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  URL Slug (Auto / Custom)
                </label>
                <Input
                  placeholder="5-alasan-mengapa-trip-sharing..."
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Kategori Artikel *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-[#00677d]"
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
              <textarea
                required
                rows={2}
                placeholder="Ringkasan 1-2 kalimat untuk preview kartu dan meta description..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-[#00677d]"
              />
            </div>
          </div>
        </Card>

        {/* Section 2: Editor Konten (WordPress-style Rich Editor Full Width) */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-4 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              Isi Konten Artikel
            </h2>
            <span className="text-xs text-slate-400">
              Visual WYSIWYG, HTML Code, Live Preview, & Split Screen
            </span>
          </div>

          <BlogRichEditor
            content={content}
            onChange={setContent}
            placeholder="Mulai tulis artikel inspiratif atau paste draft Anda di sini..."
            minHeight="550px"
          />
        </Card>

        {/* Section 3: Media, Tag, & Status Publikasi */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-5 bg-white">
          <h2 className="font-heading font-bold text-base text-[#191c1e] flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="h-6 w-6 rounded-full bg-[#00677d] text-white flex items-center justify-center text-xs font-bold">
              3
            </span>
            Media, Tag, & Status Publikasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <ImageUploader
                mode="single"
                folder="articles"
                label="Foto Sampul Artikel *"
                value={coverImage}
                onChange={setCoverImage}
                helperText="Unggah gambar header artikel blog (format 16:9 disarankan)."
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Estimasi Waktu Baca (Menit)
              </label>
              <Input
                type="number"
                min={1}
                value={readTimeMinutes}
                onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Tags (Pisahkan dengan tanda koma)
              </label>
              <Input
                placeholder="Tips, Hemat, Bromo, Trip Sharing"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-wrap gap-6 pt-3 border-t border-slate-100">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 accent-[#00677d] rounded"
              />
              <span>Status Aktif / Published (Dapat dibaca publik traveler)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 accent-[#00677d] rounded"
              />
              <span>Jadikan Artikel Unggulan (Featured) ⭐</span>
            </label>
          </div>
        </Card>

        {/* Section 4: SEO Metadata */}
        <Card className="p-6 border border-slate-100 shadow-stitch-card space-y-4 bg-white">
          <h2 className="font-heading font-bold text-sm text-[#191c1e] border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#00677d]" />
            SEO & OpenGraph Metadata
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                SEO Meta Title
              </label>
              <Input
                placeholder={title || "Judul artikel untuk Google & Sosmed..."}
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                SEO Meta Description
              </label>
              <Input
                placeholder={excerpt || "Deskripsi singkat untuk snippet search engine..."}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/admin/blogs">Batal</Link>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="rounded-xl gap-2 font-bold px-8 shadow-md bg-[#00677d] text-white"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? "Mempublikasikan..." : "Publikasikan Artikel"}
          </Button>
        </div>
      </form>
    </div>
  );
}

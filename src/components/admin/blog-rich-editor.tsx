"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Image as ImageIcon,
  Video,
  Table as TableIcon,
  Eye,
  Code2,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { uploadService } from "@/src/services/upload.service";
import { getImageUrl } from "@/src/lib/utils";

interface BlogRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function BlogRichEditor({
  content,
  onChange,
  placeholder = "Tulis isi artikel menarik Anda di sini...",
  className = "",
  minHeight = "450px",
}: BlogRichEditorProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
  const [isSplitScreen, setIsSplitScreen] = useState(false);
  const [htmlCode, setHtmlCode] = useState(content || "");

  // Media Modals State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(true);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageAlign, setImageAlign] = useState<"center" | "left" | "right" | "full">("center");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");

  const visualEditorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync internal HTML code when prop content changes externally
  useEffect(() => {
    if (content !== htmlCode) {
      setHtmlCode(content || "");
      if (visualEditorRef.current && visualEditorRef.current.innerHTML !== content) {
        visualEditorRef.current.innerHTML = content || "";
      }
    }
  }, [content]);

  // Save current text selection range before opening dialogs
  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  };

  // Restore text selection range
  const restoreSelection = () => {
    if (typeof window !== "undefined" && savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  // Execute standard formatting command
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (activeTab !== "visual") {
      setActiveTab("visual");
    }
    visualEditorRef.current?.focus();
    document.execCommand(command, false, value);
    handleVisualInput();
  };

  // Handle visual editor input
  const handleVisualInput = useCallback(() => {
    if (visualEditorRef.current) {
      const newHtml = visualEditorRef.current.innerHTML;
      setHtmlCode(newHtml);
      onChange(newHtml);
    }
  }, [onChange]);

  // Handle raw HTML code input
  const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setHtmlCode(val);
    onChange(val);
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = val;
    }
  };

  // Switch tabs cleanly with sync
  const handleTabSwitch = (tab: "visual" | "html" | "preview") => {
    if (tab === "visual" && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = htmlCode;
    }
    setActiveTab(tab);
  };

  // Insert Custom HTML at cursor or append
  const insertHtmlAtCursor = (htmlToInsert: string) => {
    if (activeTab === "html") {
      const textarea = document.getElementById("blog-raw-html-editor") as HTMLTextAreaElement | null;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = htmlCode.substring(0, start);
        const after = htmlCode.substring(end);
        const updated = before + htmlToInsert + after;
        setHtmlCode(updated);
        onChange(updated);
        return;
      }
    }

    // Visual Mode insertion
    visualEditorRef.current?.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const el = document.createElement("div");
      el.innerHTML = htmlToInsert;
      const frag = document.createDocumentFragment();
      let node: Node | null;
      let lastNode: Node | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);

      if (lastNode) {
        const newRange = document.createRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML += htmlToInsert;
    }

    handleVisualInput();
  };

  // LINK INSERTION HANDLER
  const handleOpenLinkModal = () => {
    saveSelection();
    const sel = window.getSelection();
    const selectedText = sel ? sel.toString() : "";
    setLinkText(selectedText);
    setLinkUrl("");
    setLinkOpenNewTab(true);
    setIsLinkModalOpen(true);
  };

  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let href = linkUrl.trim();
    if (!/^https?:\/\//i.test(href) && !href.startsWith("#") && !href.startsWith("/")) {
      href = `https://${href}`;
    }

    const textToDisplay = linkText.trim() || href;
    const targetAttr = linkOpenNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    const linkHtml = `<a href="${href}"${targetAttr} class="text-[#00677d] font-semibold underline hover:text-[#005264] transition-colors">${textToDisplay}</a>&nbsp;`;

    insertHtmlAtCursor(linkHtml);
    setIsLinkModalOpen(false);
  };

  // IMAGE INSERTION HANDLER
  const handleOpenImageModal = () => {
    saveSelection();
    setImageUrl("");
    setImageAlt("");
    setImageCaption("");
    setImageAlign("center");
    setIsImageModalOpen(true);
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const res = await uploadService.uploadImage(file, "articles");
      setImageUrl(res.url);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah gambar.";
      alert(msg);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    const fullSrc = getImageUrl(imageUrl.trim());
    const altText = imageAlt.trim() || "Gambar Artikel Share Trip Jogja";

    let alignClass = "mx-auto my-6 text-center max-w-2xl";
    if (imageAlign === "left") alignClass = "float-left mr-6 mb-4 max-w-sm";
    if (imageAlign === "right") alignClass = "float-right ml-6 mb-4 max-w-sm";
    if (imageAlign === "full") alignClass = "w-full my-6";

    let figureHtml = `<figure class="${alignClass} not-prose my-6">
  <img src="${fullSrc}" alt="${altText}" class="w-full h-auto rounded-2xl shadow-md object-cover border border-slate-100" loading="lazy" />`;

    if (imageCaption.trim()) {
      figureHtml += `\n  <figcaption class="text-xs text-slate-500 text-center mt-2 italic">${imageCaption.trim()}</figcaption>`;
    }
    figureHtml += `\n</figure>\n<p></p>`;

    insertHtmlAtCursor(figureHtml);
    setIsImageModalOpen(false);
  };

  // VIDEO EMBED HANDLER (YOUTUBE / VIMEO)
  const handleOpenVideoModal = () => {
    saveSelection();
    setVideoUrl("");
    setVideoCaption("");
    setIsVideoModalOpen(true);
  };

  const parseEmbedVideoUrl = (rawUrl: string): string | null => {
    const trimmed = rawUrl.trim();
    // YouTube formats: watch?v=ID, youtu.be/ID, embed/ID, shorts/ID
    const ytMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
    }

    // Vimeo format: vimeo.com/ID
    const vimeoMatch = trimmed.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // If already an embed URL or valid iframe src
    if (trimmed.startsWith("http")) {
      return trimmed;
    }

    return null;
  };

  const handleInsertVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;

    const embedSrc = parseEmbedVideoUrl(videoUrl);
    if (!embedSrc) {
      alert("Format URL video tidak valid. Masukkan URL YouTube (contoh: https://www.youtube.com/watch?v=...) atau Vimeo.");
      return;
    }

    let videoHtml = `<div class="my-6 not-prose">
  <div class="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900">
    <iframe src="${embedSrc}" title="Video Konten" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute inset-0 w-full h-full"></iframe>
  </div>`;

    if (videoCaption.trim()) {
      videoHtml += `\n  <p class="text-xs text-slate-500 text-center mt-2 italic">${videoCaption.trim()}</p>`;
    }
    videoHtml += `\n</div>\n<p></p>`;

    insertHtmlAtCursor(videoHtml);
    setIsVideoModalOpen(false);
  };

  // CALLOUT BOXES INSERTION
  const handleInsertCallout = (type: "tip" | "info" | "warning") => {
    let iconSvg = "";
    let bgClass = "";
    let borderClass = "";
    let titleText = "";
    let defaultBody = "";

    if (type === "tip") {
      bgClass = "bg-emerald-50 text-emerald-900 border-emerald-200";
      titleText = "💡 Tips Wisata Hemat";
      defaultBody = "Gunakan fitur Share Trip untuk menghemat biaya transport hingga 60% bersama traveler lain.";
    } else if (type === "warning") {
      bgClass = "bg-amber-50 text-amber-900 border-amber-200";
      titleText = "⚠️ Informasi Penting";
      defaultBody = "Pastikan membawa jaket hangat dan masker saat berkunjung ke kawasan Bromo di pagi hari.";
    } else {
      bgClass = "bg-sky-50 text-sky-900 border-sky-200";
      titleText = "ℹ️ Catatan Tambahan";
      defaultBody = "Paket wisata All-In sudah mencakup tiket retribusi resmi dan pemandu lokal berlisensi.";
    }

    const calloutHtml = `<div class="my-6 p-4 rounded-2xl border ${bgClass} shadow-sm not-prose">
  <div class="font-heading font-bold text-sm mb-1">${titleText}</div>
  <p class="text-xs leading-relaxed opacity-90">${defaultBody}</p>
</div>\n<p></p>`;

    insertHtmlAtCursor(calloutHtml);
  };

  // TABLE INSERTION
  const handleInsertTable = () => {
    const tableHtml = `<div class="my-6 overflow-x-auto not-prose">
  <table class="w-full text-left text-xs border-collapse rounded-xl overflow-hidden border border-slate-200 shadow-sm">
    <thead class="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider">
      <tr>
        <th class="p-3 border-b border-slate-200">Hari / Waktu</th>
        <th class="p-3 border-b border-slate-200">Destinasi & Aktivitas</th>
        <th class="p-3 border-b border-slate-200">Fasilitas / Catatan</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-200 bg-white">
      <tr class="hover:bg-slate-50/80">
        <td class="p-3 font-semibold text-slate-700">03:30 - 06:00</td>
        <td class="p-3 text-slate-600">Sunrise Point Penanjakan Bromo</td>
        <td class="p-3 text-slate-500">Jeep 4x4 & Guide Termasuk</td>
      </tr>
      <tr class="hover:bg-slate-50/80">
        <td class="p-3 font-semibold text-slate-700">06:30 - 08:30</td>
        <td class="p-3 text-slate-600">Kawah Bromo & Pasir Berbisik</td>
        <td class="p-3 text-slate-500">Free time & Spot Foto</td>
      </tr>
    </tbody>
  </table>
</div>\n<p></p>`;

    insertHtmlAtCursor(tableHtml);
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* TOP HEADER: MODE TABS & SPLIT VIEW TOGGLE */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 bg-slate-50/90 border-b border-slate-200">
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => handleTabSwitch("visual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "visual"
                ? "bg-white text-[#00677d] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00677d]" />
            Visual (WYSIWYG)
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("html")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "html"
                ? "bg-white text-[#00677d] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="h-3.5 w-3.5 text-indigo-600" />
            HTML / Source Code
          </button>

          <button
            type="button"
            onClick={() => handleTabSwitch("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "preview"
                ? "bg-white text-[#00677d] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-emerald-600" />
            Live Preview
          </button>
        </div>

        {/* Split Screen Toggle (Desktop Only) */}
        <div className="hidden lg:flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSplitScreen(!isSplitScreen)}
            className={`h-8 text-xs font-semibold gap-1.5 ${
              isSplitScreen ? "bg-[#00677d]/10 text-[#00677d] border-[#00677d]/30" : "text-slate-600"
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            {isSplitScreen ? "Tutup Split Preview" : "Split Live Preview"}
          </Button>
        </div>
      </div>

      {/* RICH TOOLBAR (Active in Visual or Split Mode) */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-white border-b border-slate-100 text-slate-700">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Undo (Ctrl+Z)"
            onClick={() => execCmd("undo")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Redo (Ctrl+Y)"
            onClick={() => execCmd("redo")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
          >
            <Redo className="h-4 w-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Heading 2"
            onClick={() => execCmd("formatBlock", "<h2>")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
          >
            H2
          </button>
          <button
            type="button"
            title="Heading 3"
            onClick={() => execCmd("formatBlock", "<h3>")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
          >
            H3
          </button>
          <button
            type="button"
            title="Heading 4"
            onClick={() => execCmd("formatBlock", "<h4>")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
          >
            H4
          </button>
          <button
            type="button"
            title="Paragraph"
            onClick={() => execCmd("formatBlock", "<p>")}
            className="px-2 py-1 rounded-lg hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors"
          >
            P
          </button>
        </div>

        {/* Formatting: Bold, Italic, Underline, Strikethrough, Code */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Tebal (Bold)"
            onClick={() => execCmd("bold")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Miring (Italic)"
            onClick={() => execCmd("italic")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Garis Bawah (Underline)"
            onClick={() => execCmd("underline")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Coret (Strikethrough)"
            onClick={() => execCmd("strikeThrough")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Kode Inline"
            onClick={() => {
              const sel = window.getSelection();
              const text = sel ? sel.toString() : "kode";
              insertHtmlAtCursor(`<code class="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded font-mono text-xs">${text}</code>&nbsp;`);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Rata Kiri"
            onClick={() => execCmd("justifyLeft")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Tengah"
            onClick={() => execCmd("justifyCenter")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Kanan"
            onClick={() => execCmd("justifyRight")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Rata Kanan-Kiri (Justify)"
            onClick={() => execCmd("justifyFull")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Bullet List"
            onClick={() => execCmd("insertUnorderedList")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Numbered List"
            onClick={() => execCmd("insertOrderedList")}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Kutipan (Blockquote)"
            onClick={() => {
              insertHtmlAtCursor('<blockquote class="border-l-4 border-[#00677d] pl-4 py-1 my-4 italic text-slate-700 bg-slate-50/80 rounded-r-xl">Kutipan inspiratif atau kutipan traveler...</blockquote><p></p>');
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Garis Pemisah (Horizontal Rule)"
            onClick={() => insertHtmlAtCursor('<hr class="my-6 border-slate-200" /><p></p>')}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Media: Link, Image, Video, Table */}
        <div className="flex items-center gap-1 border-r border-slate-200 pr-1.5 mr-1">
          <button
            type="button"
            title="Sisipkan Tautan (Link)"
            onClick={handleOpenLinkModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-bold transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            Link
          </button>

          <button
            type="button"
            title="Sisipkan Foto / Gambar"
            onClick={handleOpenImageModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Foto
          </button>

          <button
            type="button"
            title="Sisipkan Video (YouTube / Vimeo)"
            onClick={handleOpenVideoModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold transition-colors"
          >
            <Video className="h-3.5 w-3.5" />
            Video
          </button>

          <button
            type="button"
            title="Sisipkan Tabel"
            onClick={handleInsertTable}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors"
          >
            <TableIcon className="h-3.5 w-3.5" />
            Tabel
          </button>
        </div>

        {/* Callout Elements */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Sisipkan Box Tips"
            onClick={() => handleInsertCallout("tip")}
            className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"
          >
            + Tips
          </button>
          <button
            type="button"
            title="Sisipkan Box Info"
            onClick={() => handleInsertCallout("info")}
            className="px-2 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold"
          >
            + Info
          </button>
          <button
            type="button"
            title="Sisipkan Box Peringatan"
            onClick={() => handleInsertCallout("warning")}
            className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold"
          >
            + Warning
          </button>
        </div>
      </div>

      {/* EDITOR & PREVIEW WORKSPACE */}
      <div className={`w-full flex-1 grid ${isSplitScreen ? "grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200" : "grid-cols-1"}`}>
        {/* PRIMARY EDITOR PANE */}
        <div className={`p-4 flex flex-col ${activeTab === "preview" && !isSplitScreen ? "hidden" : "block"}`}>
          {activeTab === "visual" || isSplitScreen ? (
            <div
              ref={visualEditorRef}
              contentEditable
              onInput={handleVisualInput}
              onBlur={handleVisualInput}
              style={{ minHeight }}
              data-placeholder={placeholder}
              className="w-full h-full p-4 rounded-xl border border-slate-100 bg-white text-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#00677d]/20 overflow-y-auto prose prose-slate max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
            />
          ) : (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>HTML Code Editor (WordPress Text Mode)</span>
                <span>{htmlCode.length} karakter</span>
              </div>
              <textarea
                id="blog-raw-html-editor"
                value={htmlCode}
                onChange={handleHtmlChange}
                style={{ minHeight }}
                placeholder="<p>Tulis kode HTML langsung di sini...</p>"
                className="w-full h-full p-4 rounded-xl border border-slate-200 bg-slate-900 text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none focus:border-[#00677d] resize-y"
              />
            </div>
          )}
        </div>

        {/* LIVE PREVIEW PANE (Split Screen or Preview Tab) */}
        {(isSplitScreen || activeTab === "preview") && (
          <div className="p-4 bg-[#f8fafc] overflow-y-auto flex flex-col" style={{ minHeight }}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold uppercase">
                  Live Preview
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  Tampilan persis di halaman publik pembaca
                </span>
              </div>
            </div>

            {/* Rendered HTML inside Tailwind Prose container */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex-1">
              {htmlCode.trim() ? (
                <div
                  className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700 space-y-4 [&_a]:text-[#00677d] [&_a]:font-semibold [&_a]:underline [&_a]:hover:text-[#004e5f] [&_strong]:font-bold [&_strong]:text-slate-900 [&_b]:font-bold [&_b]:text-slate-900 [&_em]:italic [&_i]:italic [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-1.5 [&_h2]:font-heading [&_h2]:font-extrabold [&_h2]:text-xl [&_h2]:text-[#191c1e] [&_h3]:font-heading [&_h3]:font-bold [&_h3]:text-lg [&_h3]:text-[#191c1e] [&_p]:leading-relaxed [&_img]:rounded-2xl [&_img]:shadow-md"
                  dangerouslySetInnerHTML={{ __html: htmlCode }}
                />
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-center text-slate-400">
                  <Eye className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">Belum ada konten untuk ditampilkan dalam pratinjau.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER BAR: STATUS & QUICK HELP */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>Mode: <strong className="text-slate-700">{activeTab === "visual" ? "Visual WYSIWYG" : activeTab === "html" ? "HTML Source Code" : "Live Preview"}</strong></span>
          <span>•</span>
          <span>Dukungan: <strong>YouTube, Vimeo, Supabase Image, HTML5 Table, Callout Box</strong></span>
        </div>
        <div className="text-slate-400">
          Tip: Gunakan split preview untuk melihat hasil langsung saat mengetik
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL INSERT LINK                                                      */}
      {/* ========================================================================= */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#00677d]" />
              Sisipkan Tautan (Hyperlink)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInsertLink} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                URL Tautan *
              </label>
              <Input
                required
                placeholder="https://example.com atau /destinations/bromo"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Teks Tautan (Opsional)
              </label>
              <Input
                placeholder="Teks yang akan diklik pembaca..."
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="link-open-new-tab"
                checked={linkOpenNewTab}
                onChange={(e) => setLinkOpenNewTab(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#00677d] focus:ring-[#00677d]"
              />
              <label htmlFor="link-open-new-tab" className="text-xs font-medium text-slate-700 cursor-pointer">
                Buka tautan di tab baru (target=&ldquo;_blank&rdquo;)
              </label>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLinkModalOpen(false)}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold bg-[#00677d] hover:bg-[#005264] text-white"
              >
                Sisipkan Tautan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. MODAL INSERT FOTO / GAMBAR                                            */}
      {/* ========================================================================= */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-lg p-6 bg-white rounded-3xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              Sisipkan Foto / Gambar ke Artikel
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInsertImage} className="space-y-4 pt-2">
            {/* Upload File or URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Pilih File Gambar atau Masukkan URL *
              </label>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://images.unsplash.com/... atau upload di samping"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="text-xs flex-1"
                />
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 border border-slate-200 transition-colors shrink-0">
                  <UploadCloud className="h-4 w-4 text-[#00677d]" />
                  <span>{isUploadingImage ? "Mengunggah..." : "Upload"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              {imageUrl && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mt-2">
                  <img
                    src={getImageUrl(imageUrl)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Alt Text (SEO Image)
                </label>
                <Input
                  placeholder="Deskripsi foto untuk Google SEO..."
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  Perataan Gambar (Alignment)
                </label>
                <select
                  value={imageAlign}
                  onChange={(e) => setImageAlign(e.target.value as "center" | "left" | "right" | "full")}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-800 focus:border-[#00677d] focus:outline-none"
                >
                  <option value="center">Tengah (Center)</option>
                  <option value="full">Lebar Penuh (Full Width)</option>
                  <option value="left">Kiri (Float Left)</option>
                  <option value="right">Kanan (Float Right)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Keterangan Foto / Caption (Opsional)
              </label>
              <Input
                placeholder="Contoh: Suasana sunrise di Penanjakan Bromo (Foto: Dok. Share Trip)"
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsImageModalOpen(false)}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!imageUrl.trim() || isUploadingImage}
                size="sm"
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Sisipkan Gambar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. MODAL INSERT VIDEO (YOUTUBE / VIMEO)                                  */}
      {/* ========================================================================= */}
      <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-3xl border border-slate-100 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
              <Video className="h-4 w-4 text-red-600" />
              Sematkan Video (YouTube / Vimeo)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInsertVideo} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                URL Video YouTube / Vimeo *
              </label>
              <Input
                required
                placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Mendukung link video reguler, link pendek youtu.be, Shorts, dan Vimeo.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Keterangan Video / Caption (Opsional)
              </label>
              <Input
                placeholder="Contoh: Video Dokumentasi Trip Yogyakarta"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-xs font-bold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!videoUrl.trim()}
                size="sm"
                className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Sematkan Video
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

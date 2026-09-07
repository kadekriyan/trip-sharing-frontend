"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link2,
  Plus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { uploadService, type UploadFolder } from "@/src/services/upload.service";
import { getImageUrl } from "@/src/lib/utils";

interface SingleImageUploaderProps {
  mode?: "single";
  value: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  label?: string;
  helperText?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "wide";
}

interface MultipleImageUploaderProps {
  mode: "multiple";
  values: string[];
  onChangeMultiple: (urls: string[]) => void;
  folder?: UploadFolder;
  label?: string;
  helperText?: string;
  className?: string;
  maxFiles?: number;
}

export type ImageUploaderProps = SingleImageUploaderProps | MultipleImageUploaderProps;

export function ImageUploader(props: ImageUploaderProps) {
  const { folder = "general", label, helperText, className } = props;
  const isMultiple = props.mode === "multiple";

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [manualUrl, setManualUrl] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle single file upload
  const handleSingleUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    try {
      const result = await uploadService.uploadImage(file, folder);
      if (props.mode !== "multiple") {
        props.onChange(result.url);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle multiple file upload
  const handleMultipleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const maxFiles = (props as MultipleImageUploaderProps).maxFiles || 10;
    const currentValues = (props as MultipleImageUploaderProps).values || [];

    if (currentValues.length + fileArray.length > maxFiles) {
      setErrorMessage(`Maksimal ${maxFiles} foto galeri.`);
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const results = await uploadService.uploadMultipleImages(fileArray, folder);
      const newUrls = results.map((r) => r.url);
      if (props.mode === "multiple") {
        props.onChangeMultiple([...currentValues, ...newUrls]);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal mengunggah berkas");
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (isMultiple) {
      handleMultipleUpload(e.target.files);
    } else {
      handleSingleUpload(e.target.files[0]);
    }
    // reset input
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    if (isMultiple) {
      handleMultipleUpload(e.dataTransfer.files);
    } else {
      handleSingleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrl.trim()) return;
    if (isMultiple) {
      const current = (props as MultipleImageUploaderProps).values || [];
      props.onChangeMultiple([...current, manualUrl.trim()]);
    } else {
      props.onChange(manualUrl.trim());
    }
    setManualUrl("");
  };

  const handleRemoveSingle = () => {
    if (props.mode !== "multiple") {
      props.onChange("");
    }
  };

  const handleRemoveMultiple = (indexToRemove: number) => {
    if (props.mode === "multiple") {
      const updated = props.values.filter((_, idx) => idx !== indexToRemove);
      props.onChangeMultiple(updated);
    }
  };

  return (
    <div className={`space-y-3 ${className || ""}`}>
      {/* Label and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        {label && (
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            {label}
          </label>
        )}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("upload")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "upload"
                ? "bg-white text-[#00677d] shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Unggah Berkas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              activeTab === "url"
                ? "bg-white text-[#00677d] shadow-sm font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Input URL
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Upload Dropzone */}
      {activeTab === "upload" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={isMultiple}
            onChange={onFileChange}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-all flex flex-col items-center justify-center gap-2.5 ${
              isDragOver
                ? "border-[#00677d] bg-sky-50/50 scale-[1.01]"
                : "border-slate-200 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-[#00677d]">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">
                {isUploading
                  ? "Sedang mengunggah berkas..."
                  : isMultiple
                  ? "Klik atau seret foto galeri ke sini"
                  : "Klik atau seret gambar ke sini"}
              </p>
              <p className="text-[11px] text-slate-400">
                Format: JPG, PNG, WEBP, GIF (Maks. 10 MB per berkas)
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              className="mt-1 text-xs h-7 gap-1.5 pointer-events-none"
            >
              <ImageIcon className="h-3.5 w-3.5 text-[#00677d]" />
              Pilih dari Komputer
            </Button>
          </div>
        </div>
      )}

      {/* Tab 2: Manual URL input */}
      {activeTab === "url" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
            <Input
              type="url"
              placeholder="https://images.unsplash.com/... atau /uploads/..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              className="pl-9 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddManualUrl();
                }
              }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddManualUrl}
            disabled={!manualUrl.trim()}
            className="text-xs font-bold shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Gunakan
          </Button>
        </div>
      )}

      {/* Helper text */}
      {helperText && <p className="text-[11px] text-slate-400">{helperText}</p>}

      {/* PREVIEWS */}
      {/* 1. Single Mode Preview */}
      {!isMultiple && props.value && (
        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 mt-2 max-w-sm">
          <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
            <Image
              src={getImageUrl(props.value)}
              alt="Preview"
              fill
              unoptimized
              className="object-cover transition-transform group-hover:scale-105 duration-300"
            />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleRemoveSingle}
              className="h-8 text-xs font-bold gap-1 shadow-md"
            >
              <X className="h-3.5 w-3.5" />
              Hapus Gambar
            </Button>
          </div>
          <div className="p-2 bg-white/90 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span className="truncate max-w-[200px] font-mono">{props.value}</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Terpilih
            </span>
          </div>
        </div>
      )}

      {/* 2. Multiple Mode Previews (Gallery) */}
      {isMultiple && props.values && props.values.length > 0 && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Foto Galeri Terunggah ({props.values.length})</span>
            <button
              type="button"
              onClick={() => props.onChangeMultiple([])}
              className="text-rose-600 hover:underline text-[11px]"
            >
              Hapus Semua
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {props.values.map((imgUrl, index) => (
              <div
                key={`${imgUrl}-${index}`}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-sm"
              >
                <Image
                  src={getImageUrl(imgUrl)}
                  alt={`Galeri ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMultiple(index)}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all shadow-md"
                  title="Hapus foto ini"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

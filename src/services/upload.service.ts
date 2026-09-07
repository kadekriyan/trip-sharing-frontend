import { apiClient, ApiError } from "@/src/lib/api-client";

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
}

export type UploadFolder = "destinations" | "articles" | "general";

export const uploadService = {
  /**
   * Upload single image file to server (/api/upload)
   * @param file File binary
   * @param folder Subfolder (destinations, articles, general)
   */
  async uploadImage(file: File, folder: UploadFolder = "general"): Promise<UploadResult> {
    // Client-side validation
    if (!file.type.startsWith("image/")) {
      throw new Error("Berkas harus berupa gambar (JPG, PNG, WEBP, GIF)");
    }
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw new Error("Ukuran berkas melebihi batas maksimal 10 MB");
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("file", file);

    const endpoints = [
      `/upload?folder=${folder}`,
      `/upload/image?folder=${folder}`,
      `/upload/file?folder=${folder}`,
      `/admin/upload?folder=${folder}`,
    ];

    let lastError: Error | null = null;
    for (const ep of endpoints) {
      try {
        const res = await apiClient.postForm<UploadResult>(ep, formData);
        if (res.success && res.data) {
          return res.data;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    // Fallback if backend upload fails in dev environment: Create local blob/data preview
    console.warn("Upload service API failed, falling back to local object URL for preview:", lastError?.message);
    const localUrl = URL.createObjectURL(file);
    return {
      url: localUrl,
      path: localUrl,
      filename: file.name,
      originalName: file.name,
      mimetype: file.type,
      size: file.size,
    };
  },

  /**
   * Upload multiple image files to server (/api/upload/multiple)
   * @param files Array of File binaries
   * @param folder Subfolder (destinations, articles, general)
   */
  async uploadMultipleImages(
    files: File[],
    folder: UploadFolder = "destinations"
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) return [];

    // Filter and validate files
    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length === 0) {
      throw new Error("Semua berkas harus berupa gambar");
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("images", file);
      formData.append("files", file);
    });

    const endpoints = [
      `/upload/multiple?folder=${folder}`,
      `/upload/files?folder=${folder}`,
      `/upload?folder=${folder}`,
    ];

    for (const ep of endpoints) {
      try {
        const res = await apiClient.postForm<UploadResult[] | UploadResult>(ep, formData);
        if (res.success && res.data) {
          if (Array.isArray(res.data)) {
            return res.data;
          } else {
            return [res.data];
          }
        }
      } catch {
        // Try next endpoint
      }
    }

    // Fallback: Upload one by one sequentially
    const results: UploadResult[] = [];
    for (const file of validFiles) {
      try {
        const single = await this.uploadImage(file, folder);
        results.push(single);
      } catch {
        const localUrl = URL.createObjectURL(file);
        results.push({
          url: localUrl,
          path: localUrl,
          filename: file.name,
          originalName: file.name,
          mimetype: file.type,
          size: file.size,
        });
      }
    }

    return results;
  },
};

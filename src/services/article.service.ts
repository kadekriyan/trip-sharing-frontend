import { apiClient } from "@/src/lib/api-client";
import type { Article } from "@/src/types";

export const articleService = {
  async getAllArticles(params?: { category?: string; search?: string }): Promise<Article[]> {
    try {
      const res = await apiClient.get<Article[]>("/blogs", { params });
      if (res.success && Array.isArray(res.data)) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return [];
  },

  async getArticleBySlug(slug: string): Promise<Article | null> {
    try {
      const res = await apiClient.get<Article>(`/blogs/${slug}`);
      if (res.success && res.data) {
        return res.data;
      }
    } catch {
      // Empty
    }
    return null;
  },
};

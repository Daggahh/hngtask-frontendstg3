interface SummarizeOptions {
  type: string;
  format: string;
  length: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ApiService {
  detectLanguage: (text: string) => Promise<ApiResponse<{ language: string }>>;
  summarize: (
    text: string,
    options: SummarizeOptions
  ) => Promise<ApiResponse<{ summary: string }>>;
  translate: (
    text: string,
    targetLang: string
  ) => Promise<ApiResponse<{ translated_text: string }>>;
}

export const apiService = {
  async detectLanguage(text: string) {
    try {
      const res = await fetch("/api/detect-language", {
        method: "POST",
        body: JSON.stringify({ text }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to detect language");
      const data = await res.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: { language: "" },
        error: "Language detection failed",
      };
    }
  },

  async translate(text: string, targetLang: string) {
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        body: JSON.stringify({ text, targetLang }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to translate text");
      const data = await res.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: { translated_text: "" },
        error: "Translation failed",
      };
    }
  },

  async summarize(text: string, options: SummarizeOptions) {
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ text, ...options }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Failed to summarize text");
      const data = await res.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: { summary: "" },
        error: "Summarization failed",
      };
    }
  },
};
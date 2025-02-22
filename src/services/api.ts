import {
  ApiService,
  SummarizeOptions,
  SummarizerOptions,
} from "../types/api.types";

const ORIGIN_TRIAL_TOKENS = {
  summarizer:
    "Akj+SKMDlCkv3iYN0LcW5Z1czZP/ayo+d9vpNtEhIlY9+g/vcss0ckxnAAJbxjJWoBpy+F33p8axl5yfKXWZ4AYAAABteyJvcmlnaW4iOiJodHRwczovL2FpLWZsb3ctdGV4dC1wcm9jZXNzb3IudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiQUlTdW1tYXJpemF0aW9uQVBJIiwiZXhwaXJ5IjoxNzUzMTQyNDAwfQ==",
  translator:
    "AscCGFi7cVSD5sr72dN/qXDRKnkEgu4kdS8YG2VbgFq52nBggYboAnhHKvWWUE/A8afi2Y84w74o5StTfpZa9AAAAABpeyJvcmlnaW4iOiJodHRwczovL2FpLWZsb3ctdGV4dC1wcm9jZXNzb3IudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiVHJhbnNsYXRpb25BUEkiLCJleHBpcnkiOjE3NTMxNDI0MDB9",
  languageDetector:
    "AvvRvanEiDsksAc5bZd21auc1wmQ6pJj4BQ/SaMXp9WXYyc0poO+5pYH4zS7PlBcl9yZK5zHysxqU2LT6nU2oQ4AAABveyJvcmlnaW4iOiJodHRwczovL2FpLWZsb3ctdGV4dC1wcm9jZXNzb3IudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiTGFuZ3VhZ2VEZXRlY3Rpb25BUEkiLCJleHBpcnkiOjE3NDk1OTk5OTl9",
};

const DOWNLOADED_MODELS = {
  summarizer: false,
  translator: false,
  languageDetector: false,
};

declare global {
  interface Window {
    ai: any;
  }
}

// Add tokens programmatically
const injectOriginTrialToken = (token: string) => {
  const otMeta = document.createElement("meta");
  otMeta.httpEquiv = "origin-trial";
  otMeta.content = token;
  document.head.append(otMeta);
};

// Modified summarizer helper
const createSummarizer = async (options: SummarizerOptions) => {
  try {
    // Inject token if not in Chrome Canary/experimental
    if (!window.ai?.summarizer) {
      injectOriginTrialToken(ORIGIN_TRIAL_TOKENS.summarizer);
    }

    if (!DOWNLOADED_MODELS.summarizer) {
      const summarizer = await self.ai.summarizer.create({
        ...options,
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: ProgressEvent) => {
            const progress = Math.round((e.loaded / e.total) * 100);
            if (progress === 100) {
              DOWNLOADED_MODELS.summarizer = true;
            }
          });
        },
      });
      await summarizer.ready;
      return summarizer;
    }

    // Skip download progress if already downloaded
    return await self.ai.summarizer.create(options);
  } catch (error) {
    console.error("Failed to create summarizer:", error);
    throw error;
  }
};

// Add language detector helper
const createLanguageDetector = async () => {
  try {
    if (!DOWNLOADED_MODELS.languageDetector) {
      const detector = await self.ai.languageDetector.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: ProgressEvent) => {
            const progress = Math.round((e.loaded / e.total) * 100);
            if (progress === 100) {
              DOWNLOADED_MODELS.languageDetector = true;
            }
          });
        },
      });
      await detector.ready;
      return detector;
    }

    // Skip download progress if already downloaded
    return await self.ai.languageDetector.create();
  } catch (error) {
    console.error("Failed to create language detector:", error);
    throw error;
  }
};

// Add translator helper
const createTranslator = async (
  sourceLanguage: string,
  targetLanguage: string
) => {
  try {
    if (!DOWNLOADED_MODELS.translator) {
      const translator = await self.ai.translator.create({
        sourceLanguage,
        targetLanguage,
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: ProgressEvent) => {
            const progress = Math.round((e.loaded / e.total) * 100);
            if (progress === 100) {
              DOWNLOADED_MODELS.translator = true;
            }
          });
        },
      });
      await translator.ready;
      return translator;
    }

    // Skip download progress if already downloaded
    return await self.ai.translator.create({ sourceLanguage, targetLanguage });
  } catch (error) {
    console.error("Failed to create translator:", error);
    throw error;
  }
};

export const apiService: ApiService = {
  async detectLanguage(text: string) {
    try {
      // Inject token if needed
      if (!window.ai?.languageDetector) {
        injectOriginTrialToken(ORIGIN_TRIAL_TOKENS.languageDetector);
      }

      // Try using Chrome's API
      if (window.ai?.languageDetector) {
        const detector = await createLanguageDetector();
        const results = await detector.detect(text);
        const topResult = results[0];

        return {
          success: true,
          data: {
            detectedLanguage: topResult.detectedLanguage,
            confidence: topResult.confidence,
          },
        };
      }

      // Fallback to simple detection
      const hasNonLatin = /[^\u0000-\u007F]/.test(text);
      return {
        success: true,
        data: {
          detectedLanguage: hasNonLatin ? "unknown" : "en",
          confidence: 0.5,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: { detectedLanguage: "", confidence: 0 },
        error:
          error instanceof Error ? error.message : "Language detection failed",
      };
    }
  },

  async summarize(text: string, options: SummarizeOptions) {
    try {
      // Try Chrome's built-in API first
      if (window.ai?.summarizer) {
        const summarizer = await createSummarizer(options);
        const summary = await summarizer.summarize(text, {
          context: options.context,
        });

        return {
          success: true,
          data: { summary },
        };
      }

      // Fallback to simple summarization
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
      const summary = sentences.slice(0, 3).join(". ") + ".";

      return {
        success: true,
        data: { summary },
      };
    } catch (error) {
      return {
        success: false,
        data: { summary: "" },
        error: error instanceof Error ? error.message : "Summarization failed",
      };
    }
  },

  async translate(text: string, targetLang: string) {
    try {
      // Inject token if needed
      if (!window.ai?.translator) {
        injectOriginTrialToken(ORIGIN_TRIAL_TOKENS.translator);
      }

      // Try using Chrome's API
      if (window.ai?.translator) {
        const capabilities = await self.ai.translator.capabilities();
        const sourceLangResponse = await this.detectLanguage(text);

        if (!sourceLangResponse.success) {
          throw new Error("Could not detect source language");
        }

        const sourceLang = sourceLangResponse.data.detectedLanguage;
        const isAvailable = await capabilities.languagePairAvailable(
          sourceLang,
          targetLang
        );

        if (!isAvailable) {
          throw new Error(
            `Translation from ${sourceLang} to ${targetLang} is not available`
          );
        }

        const translator = await createTranslator(sourceLang, targetLang);
        const translatedText = await translator.translate(text);

        return {
          success: true,
          data: {
            translated_text: translatedText,
            source_lang: sourceLang,
            target_lang: targetLang,
          },
        };
      }

      // Fallback message
      return {
        success: true,
        data: {
          translated_text:
            "Translation requires Chrome with experimental features enabled",
          source_lang: "auto",
          target_lang: targetLang,
        },
      };
    } catch (error) {
      return {
        success: false,
        data: {
          translated_text: "",
          source_lang: "",
          target_lang: targetLang,
        },
        error: error instanceof Error ? error.message : "Translation failed",
      };
    }
  },
};

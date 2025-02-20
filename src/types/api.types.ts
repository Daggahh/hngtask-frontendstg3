export interface SummarizerCapabilities {
  available: "no" | "readily" | "after-download";
}

export interface SummarizerOptions {
  sharedContext?: string;
  type: "key-points" | "tl;dr" | "teaser" | "headline";
  format: "markdown" | "plain-text";
  length: "short" | "medium" | "long";
}

export interface SummarizeOptions extends SummarizerOptions {
  context?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface LanguageDetectorCapabilities {
  capabilities: "no" | "readily" | "after-download";
}

export interface DetectionResult {
  detectedLanguage: string;
  confidence: number;
}

export interface LanguageDetectorOptions {
  monitor?: (m: any) => void;
}

export type TranslationAvailability = "no" | "readily" | "after-download";

export interface TranslatorCapabilities {
  languagePairAvailable: (
    source: string,
    target: string
  ) => TranslationAvailability;
}

export interface TranslatorOptions {
  sourceLanguage: string;
  targetLanguage: string;
  monitor?: (m: any) => void;
}

export interface TranslateResponse {
  translated_text: string;
  source_lang: string;
  target_lang: string;
}

export interface ApiService {
  detectLanguage: (text: string) => Promise<ApiResponse<DetectionResult>>;
  summarize: (
    text: string,
    options: SummarizeOptions
  ) => Promise<ApiResponse<{ summary: string }>>;
  translate: (
    text: string,
    targetLang: string
  ) => Promise<ApiResponse<TranslateResponse>>;
}

// lib/api.js
const API_BASE = "chrome://ai"; // Base URL for Chrome AI APIs

// 1. Language Detection API
export async function detectLanguage(text: string) {
    try {
        const response = await fetch(`${API_BASE}/language_detection`, {
            method: "POST",
            body: JSON.stringify({ text }),
            headers: { "Content-Type": "application/json" },
        });
        return await response.json();
    } catch (error) {
        console.error("Language detection failed:", error);
        return { error: "Failed to detect language" };
    }
}

// 2. Summarization API
export async function summarizeText(text: string) {
    try {
        const response = await fetch(`${API_BASE}/summarizer`, {
            method: "POST",
            body: JSON.stringify({ text }),
            headers: { "Content-Type": "application/json" },
        });
        return await response.json();
    } catch (error) {
        console.error("Summarization failed:", error);
        return { error: "Failed to summarize text" };
    }
}

// 3. Translation API
export async function translateText(text: string, targetLang: string) {
    try {
        const response = await fetch(`${API_BASE}/translator`, {
            method: "POST",
            body: JSON.stringify({ text, target_lang: targetLang }),
            headers: { "Content-Type": "application/json" },
        });
        return await response.json();
    } catch (error) {
        console.error("Translation failed:", error);
        return { error: "Failed to translate text" };
    }
}

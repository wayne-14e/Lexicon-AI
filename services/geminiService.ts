import { VocabEntry } from "../types";

/** Priority fallback list for general generation tasks (most stable first). */
const DEFAULT_MODEL_LIST = ["gemini-2.5-flash", "gemini-3.1-flash-lite-preview", "gemini-3.5-flash"];

function getBrowserApiKeys(): string[] {
  try {
    // Injected at build time by vite.config.ts `define`. Vite reads env files
    // only when the dev server / build starts — a stale (empty) value here
    // means `npm run dev` wasn't restarted after editing `.env.local`.
    const env = typeof process !== 'undefined' ? (process as any)?.env : undefined;
    return [env?.GEMINI_API_KEY, env?.GEMINI_API_KEY_2, env?.GEMINI_API_KEY_3]
      .filter((k: unknown): k is string => typeof k === 'string' && k.length > 0);
  } catch {
    return [];
  }
}

/**
 * Direct browser call to Gemini, used when the `/api/gemini` proxy is
 * unreachable (e.g. `npm run dev` / Vite has no API routes, or the Vercel
 * rewrite served index.html instead of the Edge Function). Tries each model
 * in order and throws the last error.
 */
async function callGeminiDirect(models: string[], params: any): Promise<any> {
  const keys = getBrowserApiKeys();
  if (keys.length === 0) {
    throw new Error(
      'BROWSER_KEY_MISSING: AI proxy unreachable and no API key was bundled into this build. ' +
      'Set GEMINI_API_KEY in .env.local and fully restart `npm run dev` (Vite reads env files only at startup).'
    );
  }
  // Lazy import keeps the ~270KB @google/genai SDK out of the initial
  // bundle — it only loads when the proxy is unreachable.
  const { GoogleGenAI } = await import("@google/genai");
  let lastError: unknown = null;
  for (const apiKey of keys) {
    const ai = new GoogleGenAI({ apiKey });
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({ model, ...params });
        return { text: response.text, candidates: response.candidates };
      } catch (e) {
        lastError = e;
      }
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError ?? 'Unknown AI error');
  throw new Error(`AI request failed: ${msg}`);
}

function isProxyInfrastructureError(status: number, raw: string): boolean {
  // Empty body ("Unexpected end of JSON input"), HTML fallback page
  // ("Unexpected token '<'"), or an explicit 404 from a dev server without
  // API routes — all mean the proxy itself never ran.
  if (!raw || raw.trim().length === 0) return true;
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('<')) return true;
  if (status === 404) return true;
  return false;
}

async function callGeminiApi(models: string | string[], params: any): Promise<any> {
  const modelList = Array.isArray(models) ? models : [models];

  let response: Response;
  try {
    response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ models: modelList, params })
    });
  } catch (e) {
    // Network-level failure (offline, DNS, CORS) — try direct SDK call.
    console.warn('Gemini proxy fetch failed, falling back to direct browser call:', e);
    return callGeminiDirect(modelList, params);
  }

  // Read as text first so empty/HTML bodies produce a clear error instead
  // of the cryptic "Unexpected end of JSON input".
  let raw = '';
  try {
    raw = await response.text();
  } catch (e) {
    console.warn('Failed to read Gemini proxy response, falling back to direct call:', e);
    return callGeminiDirect(modelList, params);
  }

  if (isProxyInfrastructureError(response.status, raw)) {
    console.warn(`Gemini proxy unreachable (status ${response.status}), falling back to direct browser call.`);
    return callGeminiDirect(modelList, params);
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      'AI service returned an unreadable response. Please try again in a moment.'
    );
  }
  if (!response.ok) {
    throw new Error(data.error || 'Gemini API Error');
  }
  return data;
}

// PCM Decoding Helpers as per API requirements
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const geminiService = {
  generateText: async (prompt: string): Promise<string> => {
    try {
      const result = await callGeminiApi(DEFAULT_MODEL_LIST, {
        contents: prompt
      });
      return result.text || "I apologize, but I am unable to provide a response at this moment.";
    } catch (error) {
      console.error("Failed to generate text:", error);
      throw error;
    }
  },

  extractWordsFromFile: async (base64Data: string, mimeType: string): Promise<string[]> => {
    try {
      const result = await callGeminiApi(DEFAULT_MODEL_LIST, {
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: "Extract ONLY the words or vocabulary terms from this document that are meant to be learned or reviewed. Ignore standard boilerplate text, instructions, and numbers. Return them as a JSON array of strings." }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" }
          }
        }
      });
      return JSON.parse(result.text || '[]');
    } catch (e) {
      console.error("Failed to parse AI response for document extraction", e);
      return [];
    }
  },

  generateVocabEntries: async (wordList: string[]): Promise<Partial<VocabEntry>[]> => {
    const result = await callGeminiApi(DEFAULT_MODEL_LIST, {
      contents: `For the following list of words: [${wordList.join(', ')}] provide:
      1. A simple, easy-to-understand definition.
      2. Common, everyday synonyms.
      3. Common, everyday antonyms (if a word has no clear antonym, provide a near-antonym or a contrasting concept).
      4. A highly memorable, perhaps slightly quirky or funny example sentence that makes the meaning stick. 
      Avoid overly academic or stuffy language. Keep it clear and engaging.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              word: { type: "STRING" },
              partOfSpeech: { type: "STRING" },
              meaning: { type: "STRING" },
              synonyms: { type: "STRING" },
              antonyms: { type: "STRING" },
              sentence: { type: "STRING" }
            },
            required: ["word", "partOfSpeech", "meaning", "synonyms", "antonyms", "sentence"]
          }
        }
      }
    });
    // NOTE: intentionally no try/catch here — callers must see failures.
    // Returning [] on error used to make TableCreator save empty collections.
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.text || '[]');
    } catch (e) {
      console.error("Failed to parse AI response", e, result?.text);
      throw new Error('AI returned an unreadable response. Please try again.');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      console.error("AI returned empty/invalid vocab entries", result?.text);
      throw new Error('AI returned no entries. Please try again.');
    }
    return parsed as Partial<VocabEntry>[];
  },

  generateContextPassage: async (words: string[], collectionTitle: string): Promise<{ title: string, text: string }> => {
    try {
      const result = await callGeminiApi(DEFAULT_MODEL_LIST, {
        contents: `Create an engaging passage that naturally incorporates ALL of these vocabulary words: ${words.join(', ')}.
      
      Requirements:
      1. The theme should match the vocabulary. If the words are academic/scientific, write a short article. If they are descriptive/whimsical, write a story or tale.
      2. The passage must be titled appropriately.
      3. Length should be proportional to the word count (approx 15-20 words per vocabulary item).
      4. DO NOT define the words. Use them in context so their meaning is clear.
      5. The output MUST be in JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              text: { type: "STRING", description: "The full text of the story/article." }
            },
            required: ["title", "text"]
          }
        }
      });
      return JSON.parse(result.text || '{"title": "Untitled", "text": ""}');
    } catch (e) {
      console.error("Failed to generate context passage", e);
      return { title: "Error", text: "Failed to generate context. Please try again." };
    }
  },

  generateAntonyms: async (words: string[]): Promise<Record<string, string>> => {
    try {
      const result = await callGeminiApi(DEFAULT_MODEL_LIST, {
        contents: `For the following words: ${words.join(', ')}, provide 1-2 common antonyms for each.
      
      IMPORTANT:
      1. Return a JSON object with a single property "antonyms".
      2. The "antonyms" property must be a map where the KEYS are the exact words from the input list, and VALUES are the antonyms.
      3. If a word has no clear antonym, provide a near-antonym or a contrasting concept.
      4. Example output format: { "antonyms": { "Good": "Bad", "Fast": "Slow" } }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              antonyms: {
                type: "OBJECT",
                description: "Map of input word to antonyms",
                nullable: true
              }
            }
          }
        }
      });
      const parsed = JSON.parse(result.text || '{}');
      return parsed.antonyms || {};
    } catch (e) {
      console.error("Failed to generate antonyms", e);
      return {};
    }
  },

  textToSpeech: async (text: string): Promise<void> => {
    try {
      const result = await callGeminiApi("gemini-2.5-flash-preview-tts", {
        contents: [{ parts: [{ text: `Pronounce clearly: ${text}` }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        }
      });

      const base64Audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio data received");

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        audioCtx,
        24000,
        1
      );

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    } catch (error) {
      console.error("TTS failed:", error);
    }
  }
};
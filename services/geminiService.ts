import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VocabEntry } from "../types";

// --- API Key Rotation Pool ---
// Collect all defined keys from the environment (GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3, …)
const API_KEYS: string[] = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((k): k is string => Boolean(k));

console.log('Loaded API keys:', {
  total: API_KEYS.length,
  hasKey1: !!process.env.GEMINI_API_KEY,
  hasKey2: !!process.env.GEMINI_API_KEY_2,
  hasKey3: !!process.env.GEMINI_API_KEY_3,
  key1Prefix: process.env.GEMINI_API_KEY?.substring(0, 8) + '...',
  key2Prefix: process.env.GEMINI_API_KEY_2?.substring(0, 8) + '...',
  key3Prefix: process.env.GEMINI_API_KEY_3?.substring(0, 8) + '...'
});

if (API_KEYS.length === 0) {
  console.error(
    "No Gemini API keys found. Add GEMINI_API_KEY (and optionally GEMINI_API_KEY_2, GEMINI_API_KEY_3) to .env.local and restart the dev server."
  );
}

// Track which key is currently active
let currentKeyIndex = 0;

/** Returns a GoogleGenAI client for the currently active key. */
function getAI(): GoogleGenAI {
  if (API_KEYS.length === 0) {
    throw new Error(
      "Missing GEMINI_API_KEY. Create a .env.local file in the project root with GEMINI_API_KEY=... and restart the dev server."
    );
  }
  return new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });
}

/** Returns true when the error is a quota / rate-limit / usage-limit error. */
function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  
  // Handle different error structures from the API
  const errorObj = error as any;
  const msg = String(errorObj?.message ?? errorObj?.error?.message ?? error).toLowerCase();
  const status = errorObj?.status ?? errorObj?.statusCode ?? errorObj?.error?.status ?? 0;
  
  console.log('Quota error check:', { msg, status, errorObj });
  
  return (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests") ||
    msg.includes("usage limit") ||
    msg.includes("exceeded your current quota")
  );
}

/** Returns true when the error indicates the model is unavailable (e.g. 503). */
function isUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as any)?.message ?? error).toLowerCase();
  const status = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.error?.status;
  const code = (error as any)?.code ?? (error as any)?.error?.code;
  
  return (
    status === 503 ||
    status === "UNAVAILABLE" ||
    code === 503 ||
    msg.includes("high demand") ||
    msg.includes("unavailable") ||
    msg.includes("503")
  );
}

/**
 * Wraps an API call with automatic key rotation and model fallback.
 * On a 503 Unavailable error, it falls back to gemini-2.5-flash.
 * On a quota/rate-limit error it cycles to the next available key and retries,
 * continuing until all keys have been tried once.
 */
async function withKeyRotation<T>(fn: (ai: GoogleGenAI, modelName: string) => Promise<T>, defaultModel = "gemini-3-flash-preview"): Promise<T> {
  const totalKeys = API_KEYS.length;
  let attempts = 0;
  let currentModel = defaultModel;

  console.log('Starting withKeyRotation:', { totalKeys, currentKeyIndex, currentModel });

  while (attempts < totalKeys) {
    try {
      console.log(`Attempting with key #${currentKeyIndex + 1}, model: ${currentModel}`);
      return await fn(getAI(), currentModel);
    } catch (error) {
      console.log('Caught error:', error);
      
      if (isUnavailableError(error) && currentModel === "gemini-3-flash-preview") {
        console.warn(`Gemini 3 Flash is unavailable (503). Falling back to gemini-2.5-flash...`);
        currentModel = "gemini-2.5-flash";
        // Do not increment key attempts since this is a model availability issue.
        continue;
      }

      if (isQuotaError(error) && totalKeys > 1) {
        const failedKeyIndex = currentKeyIndex;
        currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
        console.warn(
          `Gemini key #${failedKeyIndex + 1} hit a usage/quota limit. Switching to key #${currentKeyIndex + 1}…`
        );
        attempts++;
      } else {
        console.log('Non-quota error, throwing:', error);
        throw error; // non-quota errors bubble up immediately
      }
    }
  }

  throw new Error("All Gemini API keys have exceeded their usage limits. Please try again later.");
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
      const response = await withKeyRotation((ai, modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
        })
      );
      return response.text || "I apologize, but I am unable to provide a response at this moment.";
    } catch (error) {
      console.error("Failed to generate text:", error);
      throw error;
    }
  },

  generateVocabEntries: async (wordList: string[]): Promise<Partial<VocabEntry>[]> => {
    const response = await withKeyRotation((ai, modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: `For the following list of words: ${wordList.join(', ')}, provide:
      1. A simple, easy-to-understand definition.
      2. Common, everyday synonyms.
      3. Common, everyday antonyms (if a word has no clear antonym, provide a near-antonym or a contrasting concept).
      4. A highly memorable, perhaps slightly quirky or funny example sentence that makes the meaning stick. 
      Avoid overly academic or stuffy language. Keep it clear and engaging.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                partOfSpeech: { type: Type.STRING },
                meaning: { type: Type.STRING },
                synonyms: { type: Type.STRING },
                antonyms: { type: Type.STRING },
                sentence: { type: Type.STRING }
              },
              required: ["word", "partOfSpeech", "meaning", "synonyms", "antonyms", "sentence"]
            }
          }
        }
      })
    );

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return [];
    }
  },

  generateContextPassage: async (words: string[], collectionTitle: string): Promise<{ title: string, text: string }> => {
    const response = await withKeyRotation((ai, modelName) =>
      ai.models.generateContent({
        model: modelName,
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
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              text: { type: Type.STRING, description: "The full text of the story/article." }
            },
            required: ["title", "text"]
          }
        }
      })
    );

    try {
      return JSON.parse(response.text || '{"title": "Untitled", "text": ""}');
    } catch (e) {
      console.error("Failed to generate context passage", e);
      return { title: "Error", text: "Failed to generate context. Please try again." };
    }
  },

  generateAntonyms: async (words: string[]): Promise<Record<string, string>> => {
    const response = await withKeyRotation((ai, modelName) =>
      ai.models.generateContent({
        model: modelName,
        contents: `For the following words: ${words.join(', ')}, provide 1-2 common antonyms for each.
      
      IMPORTANT:
      1. Return a JSON object with a single property "antonyms".
      2. The "antonyms" property must be a map where the KEYS are the exact words from the input list, and VALUES are the antonyms.
      3. If a word has no clear antonym, provide a near-antonym or a contrasting concept.
      4. Example output format: { "antonyms": { "Good": "Bad", "Fast": "Slow" } }`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              antonyms: {
                type: Type.OBJECT,
                description: "Map of input word to antonyms",
                nullable: true
              }
            }
          }
        }
      })
    );

    try {
      const result = JSON.parse(response.text || '{}');
      return result.antonyms || {}; 
    } catch (e) {
      console.error("Failed to generate antonyms", e);
      return {};
    }
  },

  textToSpeech: async (text: string): Promise<void> => {
    try {
      const response = await withKeyRotation((ai) =>
        ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Pronounce clearly: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        })
      );

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
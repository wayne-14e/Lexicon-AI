import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export const config = { runtime: 'edge' };

// --- API Key Rotation Pool ---
const API_KEYS: string[] = [
  process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "",
  process.env.GEMINI_API_KEY_2 || process.env.VITE_GEMINI_API_KEY_2 || "",
  process.env.GEMINI_API_KEY_3 || process.env.VITE_GEMINI_API_KEY_3 || "",
].filter(Boolean);

let currentKeyIndex = 0;

function getAI(): GoogleGenAI {
  if (API_KEYS.length === 0) {
    throw new Error("Missing GEMINI_API_KEY in environment variables.");
  }
  return new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });
}

function isQuotaError(error: unknown): boolean {
  if (!error) return false;
  const msg = String((error as any)?.message ?? error).toLowerCase();
  const status = (error as any)?.status ?? (error as any)?.statusCode ?? (error as any)?.error?.status;
  const code = (error as any)?.code ?? (error as any)?.error?.code;

  return (
    status === 429 ||
    status === "RESOURCE_EXHAUSTED" ||
    code === 429 ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("exceeded your current quota")
  );
}

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
    msg.includes("503")
  );
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const models: string[] = Array.isArray(body.models) ? body.models : [body.model || "gemini-2.5-flash"];
    const params = body.params;

    if (!params) {
      return new Response(JSON.stringify({ error: 'Missing params in request' }), { status: 400 });
    }

    const totalKeys = API_KEYS.length;
    let keyAttempts = 0;
    let modelIndex = 0;

    let finalError: any = null;

    while (keyAttempts < Math.max(1, totalKeys)) {
      try {
        const currentModel = models[modelIndex];
        const ai = getAI();
        const response = await ai.models.generateContent({
          model: currentModel,
          ...params
        });

        // Convert the response to an object that can be serialized.
        // GoogleGenAI SDK returns a class instance. We can send text and candidates.
        const output = {
          text: response.text,
          candidates: response.candidates,
        };

        return new Response(JSON.stringify(output), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        finalError = error;

        // 1. Handle Model Availability (503)
        if (isUnavailableError(error) && modelIndex < models.length - 1) {
          modelIndex++;
          console.warn(`Gemini model hit 503. Falling back to "${models[modelIndex]}"...`);
          continue;
        }

        // 2. Handle Quota (429) via Key Rotation
        if (isQuotaError(error) && totalKeys > 1) {
          currentKeyIndex = (currentKeyIndex + 1) % totalKeys;
          keyAttempts++;
          modelIndex = 0; // Reset to primary model for new key
          console.warn(`Gemini key quota hit. Rotating keys...`);
          continue;
        }

        throw error;
      }
    }
    
    throw finalError || new Error("All API keys and fallback models exhausted.");

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Internal Server Error" }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

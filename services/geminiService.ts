import { VocabEntry } from "../types";

/** Priority fallback list for general generation tasks. */
const DEFAULT_MODEL_LIST = ["gemini-3.1-flash-lite-preview", "gemini-3.5-flash", "gemini-2.5-flash"];

async function callGeminiApi(models: string | string[], params: any): Promise<any> {
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      models: Array.isArray(models) ? models : [models],
      params
    })
  });

  const data = await response.json();
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
    try {
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
      return JSON.parse(result.text || '[]');
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return [];
    }
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
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VocabEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  generateVocabEntries: async (wordList: string[]): Promise<Partial<VocabEntry>[]> => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `For the following list of words: ${wordList.join(', ')}, provide:
      1. A simple, easy-to-understand definition.
      2. Common, everyday synonyms.
      3. A highly memorable, perhaps slightly quirky or funny example sentence that makes the meaning stick. 
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
              sentence: { type: Type.STRING }
            },
            required: ["word", "partOfSpeech", "meaning", "synonyms", "sentence"]
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || '[]');
    } catch (e) {
      console.error("Failed to parse AI response", e);
      return [];
    }
  },

  generateContextPassage: async (words: string[], collectionTitle: string): Promise<{ title: string, text: string }> => {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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
    });

    try {
      return JSON.parse(response.text || '{"title": "Untitled", "text": ""}');
    } catch (e) {
      console.error("Failed to generate context passage", e);
      return { title: "Error", text: "Failed to generate context. Please try again." };
    }
  },

  textToSpeech: async (text: string): Promise<void> => {
    try {
      const response = await ai.models.generateContent({
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
      });

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

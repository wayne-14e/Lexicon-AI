
import { GoogleGenAI, Type } from "@google/genai";
import { VocabEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  }
};

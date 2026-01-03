
import { GoogleGenAI } from "@google/genai";

export const getGeminiResponse = async (prompt: string, history: { role: string, parts: { text: string }[] }[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({
            role: h.role,
            parts: [{ text: h.parts[0].text }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to fetch response from Gemini. Please check your API key and connection.";
  }
};

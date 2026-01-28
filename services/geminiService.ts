
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini client using the environment variable directly as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const organizeBrainDump = async (content: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Organize the following raw thoughts into potential tasks and categories.
      Input: ${content}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["text", "category"]
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["tasks", "summary"]
        },
        systemInstruction: "You are an ADHD productivity assistant. Your goal is to take messy 'brain dump' text and extract clear, actionable tasks. Keep it simple and minimalist."
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

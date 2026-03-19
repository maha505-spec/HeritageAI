import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ManuscriptAnalysis {
  rawText: string;
  cleanedText: string;
  summary: string;
  translatedText: string;
  entities: {
    kings: string[];
    places: string[];
    temples: string[];
    events: string[];
    dynasties: string[];
  };
  historicalInsight: string;
  language: string;
  confidence: number;
}

export async function analyzeManuscript(base64Image: string, mimeType: string): Promise<ManuscriptAnalysis> {
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this ancient manuscript image. 
            1. Perform OCR to extract the raw text.
            2. Clean the text (remove noise, normalize ancient words).
            3. Summarize the content.
            4. Translate it to modern English.
            5. Extract historical entities (Kings, Places, Temples, Events, Dynasties).
            6. Provide a historical insight/explanation for researchers.
            7. Detect the language and estimate confidence.
            
            Return the result in JSON format.`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rawText: { type: Type.STRING },
          cleanedText: { type: Type.STRING },
          summary: { type: Type.STRING },
          translatedText: { type: Type.STRING },
          entities: {
            type: Type.OBJECT,
            properties: {
              kings: { type: Type.ARRAY, items: { type: Type.STRING } },
              places: { type: Type.ARRAY, items: { type: Type.STRING } },
              temples: { type: Type.ARRAY, items: { type: Type.STRING } },
              events: { type: Type.ARRAY, items: { type: Type.STRING } },
              dynasties: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
          historicalInsight: { type: Type.STRING },
          language: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["rawText", "cleanedText", "summary", "translatedText", "entities", "historicalInsight", "language", "confidence"],
      },
    },
  });

  const result = await model;
  return JSON.parse(result.text);
}

export async function searchManuscripts(query: string, manuscripts: any[]) {
  // Simple semantic search simulation using Gemini to rank
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Given the query "${query}", rank these manuscripts by relevance. Return a JSON array of indices.
    Manuscripts: ${JSON.stringify(manuscripts.map(m => ({ summary: m.summary, insight: m.historicalInsight })))}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.INTEGER }
      }
    }
  });
  
  const indices = JSON.parse(response.text);
  return indices.map((idx: number) => manuscripts[idx]);
}

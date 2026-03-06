import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-2.5-flash";

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey });
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function formatError(error) {
  const raw = error instanceof Error ? error.message : "Failed to get enhancement suggestions.";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.error?.message === "string") {
      return parsed.error.message;
    }
  } catch {
  }
  return raw;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { idea } = parseBody(req);
    if (!idea || typeof idea !== "string" || !idea.trim()) {
      res.status(400).json({ error: "idea is required" });
      return;
    }

    const prompt = `
Analyze the following prompt idea and provide 4-5 specific, short suggestions to improve it.
Each suggestion should be a short phrase (3-7 words) that adds a specific detail, style, or constraint.
Return the result as a JSON array of strings.

User's idea: "${idea}"
`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
      },
    });

    const text = response.text;
    let data = [];
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = [];
      }
    }

    if (!Array.isArray(data)) {
      data = [];
    }

    res.status(200).json({ data });
  } catch (error) {
    const message = formatError(error);
    res.status(500).json({ error: message });
  }
}

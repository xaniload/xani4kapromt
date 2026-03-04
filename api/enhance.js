import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-flash-latest";

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
  const raw = error instanceof Error ? error.message : "Failed to enhance idea.";
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.error?.message === "string") {
      return parsed.error.message;
    }
  } catch {
    // ignore
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
You are an AI assistant that helps users articulate their ideas better.
The user has provided a rough idea for a prompt.
Your task is to fix any typos, improve the clarity, and add useful details to make it a solid foundation for a prompt.
Do NOT write the final prompt itself. Just rewrite the user's idea to be more descriptive, clear, and comprehensive.
Keep it in the same language the user wrote it in.
Return ONLY the improved text, nothing else.

User's rough idea: "${idea}"
`;

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    res.status(200).json({ data: response.text?.trim() || idea });
  } catch (error) {
    const message = formatError(error);
    res.status(500).json({ error: message });
  }
}

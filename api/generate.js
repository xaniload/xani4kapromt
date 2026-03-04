import { GoogleGenAI, Type } from "@google/genai";

const MODEL = "gemini-flash-latest";
const MAX_RETRIES = 3;

const RETRYABLE_MARKERS = [
  "high demand",
  "rate limit",
  "resource exhausted",
  "temporarily unavailable",
  "unavailable",
  "internal",
];

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
  const raw = error instanceof Error ? error.message : "Failed to generate prompts.";
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

function shouldRetry(error) {
  const message = formatError(error).toLowerCase();
  return RETRYABLE_MARKERS.some((marker) => message.includes(marker));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateWithRetry(ai, request) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      lastError = error;
      if (!shouldRetry(error) || attempt === MAX_RETRIES) {
        throw error;
      }
      await sleep(1000 * attempt);
    }
  }
  throw lastError;
}

function buildPrompt(params) {
  const responseStyle = params.responseStyle === "Simple" ? "Simple" : "Serious";
  const noExtraText = params.noExtraText === true;
  const noFormatting = params.noFormatting === true;

  return `
You are an expert prompt engineer. Your task is to create highly effective, optimized prompts based on the user's idea.

User's Idea: "${params.idea}"

Settings:
- Target AI Model: ${params.targetModel}
- Output Language: ${params.language} (Translate the final prompt to this language, regardless of the input language)
- Number of variants: ${params.variantsCount}
- Structure/Format: ${params.structure}
- Include Negative Prompt: ${params.includeNegative ? "Yes" : "No"}
- Include Role Prefix: ${params.includeRole ? 'Yes (Start with "Act as a [Role]...")' : 'No (Do not include "Act as a..." or role definitions)'}
- Tone/Style: ${params.tone}
- Response Style: ${responseStyle}
- Target AI Constraints:
  ${noExtraText ? "- Instruct the target AI to provide only the core output with no conversational filler." : "- Default text policy."}
  ${noFormatting ? "- Instruct the target AI to output raw text without markdown formatting." : "- Default formatting policy."}

Instructions:
1. Analyze the user's idea and expand it into a detailed, optimized prompt for the target AI model.
2. If the target model is an image generator (like Midjourney or Stable Diffusion), use comma-separated keywords, lighting, camera angles, and style descriptors.
3. If the target model is an LLM (like ChatGPT or Claude), use clear instructions, context, constraints, and expected output format.
4. Strictly follow the requested structure/format. For example, if "Single line" is requested, do not use line breaks in the prompt. If "Raw text only" is requested, do not add any conversational filler, just the prompt itself.
5. If "Include Negative Prompt" is Yes, provide a suitable negative prompt (especially useful for image generators, but can be "Do not..." instructions for LLMs).
6. If "Include Role Prefix" is Yes, begin the prompt by assigning a persona/role (e.g., "Act as an expert..."). If No, start directly with the task/instructions without any persona assignment.
7. Match the requested response style: "Serious" means highly technical/professional wording; "Simple" means plain, easy-to-understand wording.
8. Return the result as a JSON array of objects. Each object must have a 'prompt' field. It can optionally have a 'negativePrompt' field and an 'explanation' field (briefly explaining why this prompt is effective).
9. Generate exactly ${params.variantsCount} variant(s).
`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const params = parseBody(req);
    if (!params.idea || typeof params.idea !== "string" || !params.idea.trim()) {
      res.status(400).json({ error: "idea is required" });
      return;
    }

    const ai = getAiClient();
    const response = await generateWithRetry(ai, {
      model: MODEL,
      contents: buildPrompt(params),
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING, description: "The generated prompt text" },
              negativePrompt: { type: Type.STRING, description: "The negative prompt, if requested" },
              explanation: { type: Type.STRING, description: "Brief explanation of the prompt's focus" },
            },
            required: ["prompt"],
          },
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

    res.status(200).json({ data });
  } catch (error) {
    const message = formatError(error);
    res.status(500).json({ error: message });
  }
}

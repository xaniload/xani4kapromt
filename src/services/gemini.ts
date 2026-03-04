export interface GeneratePromptParams {
  idea: string;
  targetModel: string;
  language: string;
  variantsCount: number;
  structure: string;
  includeNegative: boolean;
  includeRole: boolean;
  tone: string;
}

export interface GeneratedPrompt {
  prompt: string;
  negativePrompt?: string;
  explanation?: string;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body?.error === "string" ? body.error : "Request failed. Please try again.";
    throw new Error(message);
  }

  return body as T;
}

export async function generatePrompts(params: GeneratePromptParams): Promise<GeneratedPrompt[]> {
  const body = await postJson<{ data?: GeneratedPrompt[] }>("/api/generate", params);
  return Array.isArray(body.data) ? body.data : [];
}

export async function enhanceIdea(idea: string): Promise<string> {
  const body = await postJson<{ data?: string }>("/api/enhance", { idea });
  return typeof body.data === "string" && body.data.trim() ? body.data.trim() : idea;
}

import OpenAI from "openai";

let cached: OpenAI | null = null;

export function openaiClient(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY must be set");
  cached = new OpenAI({ apiKey });
  return cached;
}

export function openaiModel(): string {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY must be set");
  cached = new Anthropic({ apiKey });
  return cached;
}

// Independent judge for the eval grader (scripts/eval) — deliberately a
// different provider from OPENAI_MODEL to avoid self-grading bias.
export function anthropicGraderModel(): string {
  return process.env.ANTHROPIC_GRADER_MODEL || "claude-haiku-4-5";
}

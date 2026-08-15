import { anthropicClient, anthropicGraderModel } from "../../lib/anthropic/client";
import type { DecisionPointConfig, Dimension, GradeResult, TestCase } from "./types";

function formatRubric(dimensions: Dimension[]): string {
  return dimensions
    .map((d) => {
      const lines = [`DIMENSION: ${d.id} (${d.name} — ${d.hhh})`, `Question: ${d.question}`];
      if (d.low) lines.push(`LOW (0-40): ${d.low}`);
      if (d.medium) lines.push(`MEDIUM (41-74): ${d.medium}`);
      if (d.high) lines.push(`HIGH (75-100): ${d.high}`);
      return lines.join("\n");
    })
    .join("\n\n");
}

function formatAnchor(testCase: TestCase): string {
  return [
    `--- CALIBRATION EXAMPLE: ${testCase.label} OUTPUT (~${testCase.score}/100) ---`,
    testCase.input_description ? `Context: ${testCase.input_description}` : "",
    `Input given to the app:\n${JSON.stringify(testCase.candidate_input, null, 2)}`,
    `Output the app produced:\n${JSON.stringify(testCase.candidate_output, null, 2)}`,
    testCase.evals
      ? `Per-dimension judgment:\n${Object.entries(testCase.evals)
          .map(([id, text]) => `  ${id}: ${text}`)
          .join("\n")}`
      : "",
    `Expected total score: ${testCase.score}`,
    "--- END ---",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildGraderPrompt(config: DecisionPointConfig): string {
  const anchors = config.test_cases.map(formatAnchor).join("\n\n");
  return `You are an independent quality judge for an AI feature called "${config.decision_point}" in ${config.product_name}.

${config.product_description}

Your job is to find the weaknesses, not praise the strengths. A correct score is more valuable than a kind one. Score strictly against the rubric below — do not let a well-written "why"/summary sentence alone earn a high score if the actual classification/content is wrong.

RUBRIC — score each dimension 0-100 independently:

${formatRubric(config.dimensions)}

CALIBRATION ANCHORS — three worked examples showing how scores map to real quality:

${anchors}

You will now be given a new input/output pair from this same feature. Score it against the rubric above, using the calibration anchors to judge where it falls. Do not assume it matches any anchor — grade what's actually there.`;
}

function buildOutputSchema(dimensions: Dimension[]) {
  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];
  for (const d of dimensions) {
    const key = `${d.id}_score`;
    properties[key] = { type: "number", description: `0-100 score for ${d.name}` };
    required.push(key);
  }
  properties.total_score = { type: "number", description: "Overall 0-100 score" };
  properties.reasoning = { type: "string", description: "One paragraph explaining the scores, weaknesses first" };
  required.push("total_score", "reasoning");
  return { properties, required };
}

export async function grade(
  config: DecisionPointConfig,
  candidateInput: unknown,
  candidateOutput: unknown
): Promise<GradeResult> {
  const client = anthropicClient();
  const { properties, required } = buildOutputSchema(config.dimensions);

  const userPrompt = `Input given to the app:\n${JSON.stringify(candidateInput, null, 2)}\n\nOutput the app produced:\n${JSON.stringify(
    candidateOutput,
    null,
    2
  )}`;

  const response = await client.messages.create({
    model: anthropicGraderModel(),
    max_tokens: 1024,
    system: buildGraderPrompt(config),
    messages: [{ role: "user", content: userPrompt }],
    tools: [
      {
        name: "submit_grades",
        description: "Submit per-dimension scores and overall reasoning for the graded output.",
        input_schema: {
          type: "object",
          properties,
          required,
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "submit_grades" },
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`Grader did not return a submit_grades tool call for ${config.decision_point}`);
  }

  const input = toolUse.input as Record<string, number | string>;
  const dimensionScores: Record<string, number> = {};
  for (const d of config.dimensions) {
    const key = `${d.id}_score`;
    const value = input[key];
    if (typeof value !== "number") throw new Error(`Grader response missing numeric ${key}`);
    dimensionScores[d.id] = value;
  }

  if (typeof input.total_score !== "number") throw new Error("Grader response missing numeric total_score");
  if (typeof input.reasoning !== "string") throw new Error("Grader response missing reasoning");

  return {
    dimensionScores,
    totalScore: input.total_score,
    reasoning: input.reasoning,
  };
}

import fs from "node:fs";
import path from "node:path";
import { grade } from "./grade";
import type { DecisionPointConfig } from "./types";

const CONFIGS_DIR = path.join(__dirname, "configs");
const RESULTS_DIR = path.join(__dirname, "results");

function loadConfigs(): DecisionPointConfig[] {
  return fs
    .readdirSync(CONFIGS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, f), "utf-8")) as DecisionPointConfig);
}

async function main() {
  const configs = loadConfigs();
  fs.mkdirSync(RESULTS_DIR, { recursive: true });

  const decisionPoints = [];
  let flagged = 0;

  for (const config of configs) {
    console.log(`\n=== ${config.decision_point} ===`);
    const testCaseResults = [];

    for (let i = 0; i < config.test_cases.length; i++) {
      const tc = config.test_cases[i];
      const result = await grade(config, tc.candidate_input, tc.candidate_output);
      const diff = Math.abs(result.totalScore - tc.score);
      const flag = diff > 15 ? "FLAG" : "PASS";
      if (flag === "FLAG") flagged++;

      console.log(
        `  TC-${String(i + 1).padStart(2, "0")} [${tc.label}] expected=${tc.score} actual=${result.totalScore} ${flag}`
      );

      testCaseResults.push({
        id: `TC-${String(i + 1).padStart(2, "0")}`,
        label: tc.label,
        input_type: tc.input_type ?? "",
        input_description: tc.input_description ?? "",
        ground_truth: tc.ground_truth ?? "",
        candidate_input: tc.candidate_input,
        candidate_output: tc.candidate_output,
        expected_score: tc.score,
        actual_score: result.totalScore,
        dimension_scores: result.dimensionScores,
        reasoning: result.reasoning,
        human_score: null,
        human_notes: "",
      });
    }

    decisionPoints.push({
      id: config.decision_point,
      name: config.product_name,
      description: config.product_description,
      app_model: config.app_model,
      grader_model: config.grader_model,
      dimensions: config.dimensions,
      test_cases: testCaseResults,
    });
  }

  const results = {
    project: "FollowUp OS",
    generated_at: new Date().toISOString(),
    decision_points: decisionPoints,
  };

  const outPath = path.join(RESULTS_DIR, "followup-os-eval-results.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote ${outPath}`);

  if (flagged > 0) {
    console.log(`\n${flagged} test case(s) flagged (actual score >15 off expected) — grader may need rubric tightening.`);
    process.exitCode = 1;
  } else {
    console.log(`\nAll ${decisionPoints.reduce((n, d) => n + d.test_cases.length, 0)} golden test cases within tolerance.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

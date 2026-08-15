import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CONFIGS_DIR = path.join(__dirname, "configs");
const RESULTS_DIR = path.join(__dirname, "results");
const SCRIPT = path.join(__dirname, "generate_golden_dataset.py");

fs.mkdirSync(RESULTS_DIR, { recursive: true });

const configFiles = fs.readdirSync(CONFIGS_DIR).filter((f) => f.endsWith(".json"));

for (const file of configFiles) {
  const configPath = path.join(CONFIGS_DIR, file);
  const outPath = path.join(RESULTS_DIR, file.replace(/\.json$/, ".xlsx"));
  console.log(`Generating ${outPath}...`);
  const result = spawnSync("python", [SCRIPT, "--config", configPath, "--output", outPath], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    console.error(`Failed to generate ${outPath}`);
    process.exitCode = 1;
  }
}

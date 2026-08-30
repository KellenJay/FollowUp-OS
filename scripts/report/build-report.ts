import fs from "node:fs";
import path from "node:path";
import { supabaseServer } from "../../lib/supabase/server";

// Pulls the 5 metrics discussed as the actual success-measurement gap:
// classification quality (golden eval), real user feedback (thumbs/tags —
// already collected, never reported on), AI-call cost, failure/fallback
// rate, and time-to-resolution. Single-user app, so no owner_id scoping —
// this reports across the whole database.

// gpt-4o-mini rates as of Aug 2026 (openai.com/pricing) — ai_call_logs only
// ever contains gpt-4o-mini calls (the Claude grader logs separately, only
// during eval runs, not production scans).
const PRICE_PER_1M_INPUT = 0.15;
const PRICE_PER_1M_OUTPUT = 0.6;

const RESULTS_DIR = path.join(__dirname, "results");
const GOLDEN_RESULTS_PATH = path.join(__dirname, "..", "eval", "results", "followup-os-eval-results.json");

function fmtUsd(n: number): string {
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(2)}`;
}

async function aiCallMetrics() {
  const supabase = supabaseServer();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("ai_call_logs")
    .select("decision_point, model, latency_ms, prompt_tokens, completion_tokens, total_tokens")
    .gte("created_at", since);

  if (error) {
    console.log(`  Could not read ai_call_logs: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    console.log("  No ai_call_logs rows in the last 7 days — nothing has been logged yet, or no scans have run since the table was created.");
    return;
  }

  const byPoint = new Map<string, { count: number; latencyMs: number; promptTok: number; completionTok: number }>();
  for (const row of data) {
    const bucket = byPoint.get(row.decision_point) ?? { count: 0, latencyMs: 0, promptTok: 0, completionTok: 0 };
    bucket.count += 1;
    bucket.latencyMs += row.latency_ms ?? 0;
    bucket.promptTok += row.prompt_tokens ?? 0;
    bucket.completionTok += row.completion_tokens ?? 0;
    byPoint.set(row.decision_point, bucket);
  }

  let totalCost = 0;
  for (const [point, b] of byPoint) {
    const cost = (b.promptTok / 1_000_000) * PRICE_PER_1M_INPUT + (b.completionTok / 1_000_000) * PRICE_PER_1M_OUTPUT;
    totalCost += cost;
    console.log(
      `  ${point.padEnd(24)} calls=${b.count.toString().padEnd(5)} avg_latency=${Math.round(b.latencyMs / b.count)}ms  cost=${fmtUsd(cost)}`
    );
  }
  console.log(`  TOTAL (last 7 days): ${fmtUsd(totalCost)} across ${data.length} calls`);
}

async function failureRate() {
  const supabase = supabaseServer();

  const [{ count: badThreads }, { count: totalThreadDecisions }] = await Promise.all([
    supabase.from("threads").select("*", { count: "exact", head: true }).ilike("why", "Classification failed%"),
    supabase.from("threads").select("*", { count: "exact", head: true }),
  ]);
  const [{ count: badMeetings }, { count: totalMeetingDecisions }] = await Promise.all([
    supabase.from("meetings").select("*", { count: "exact", head: true }).ilike("summary", "Summarization failed%"),
    supabase.from("meetings").select("*", { count: "exact", head: true }).not("summary", "is", null),
  ]);

  const threadRate = totalThreadDecisions ? (((badThreads ?? 0) / totalThreadDecisions) * 100).toFixed(1) : "n/a";
  const meetingRate = totalMeetingDecisions ? (((badMeetings ?? 0) / totalMeetingDecisions) * 100).toFixed(1) : "n/a";

  console.log(`  Thread classification failures: ${badThreads ?? 0} of ${totalThreadDecisions ?? 0} (${threadRate}%)`);
  console.log(`  Transcript summarization failures: ${badMeetings ?? 0} of ${totalMeetingDecisions ?? 0} (${meetingRate}%)`);
}

async function errorLogSummary() {
  const supabase = supabaseServer();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("error_log")
    .select("source, will_retry")
    .gte("created_at", since);

  if (error) {
    console.log(`  Could not read error_log: ${error.message}`);
    return;
  }
  if (!data || data.length === 0) {
    console.log("  No errors logged in the last 7 days — either nothing's failing, or the error_log migration hasn't run yet.");
    return;
  }

  const bySource = new Map<string, { attempts: number; retried: number; gaveUp: number }>();
  for (const row of data) {
    const b = bySource.get(row.source) ?? { attempts: 0, retried: 0, gaveUp: 0 };
    b.attempts += 1;
    if (row.will_retry) b.retried += 1;
    else b.gaveUp += 1;
    bySource.set(row.source, b);
  }

  for (const [source, b] of bySource) {
    console.log(`  ${source.padEnd(24)} failed_attempts=${b.attempts}  retried=${b.retried}  gave_up_terminally=${b.gaveUp}`);
  }
}

async function feedbackSummary() {
  const supabase = supabaseServer();
  const tables = ["threads", "sent", "followups", "meetings"] as const;

  let up = 0;
  let down = 0;
  const tagCounts = new Map<string, number>();

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("feedback, feedback_tags").not("feedback", "is", null);
    if (error) {
      console.log(`  Could not read feedback from ${table}: ${error.message}`);
      continue;
    }
    for (const row of data ?? []) {
      if (row.feedback === "up") up += 1;
      if (row.feedback === "down") down += 1;
      for (const tag of row.feedback_tags ?? []) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const total = up + down;
  if (total === 0) {
    console.log("  No feedback given yet — thumbs/tags on Dismissed or Sent cards haven't been used.");
    return;
  }
  console.log(`  ${up} up / ${down} down (${((up / total) * 100).toFixed(0)}% positive), ${total} total ratings`);
  const topTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (topTags.length > 0) {
    console.log(`  Top reason tags: ${topTags.map(([tag, n]) => `${tag} (${n})`).join(", ")}`);
  }
}

async function timeToResolution() {
  const supabase = supabaseServer();
  const { data: resolved } = await supabase
    .from("threads")
    .select("waited_hours")
    .in("status", ["sent", "dismissed"])
    .not("waited_hours", "is", null);
  const { data: open } = await supabase
    .from("threads")
    .select("waited_hours")
    .in("status", ["needs_reply", "low_confidence", "manual_followup"])
    .not("waited_hours", "is", null);

  const avg = (rows: { waited_hours: number }[] | null) =>
    rows && rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + r.waited_hours, 0) / rows.length) : null;

  const resolvedAvg = avg(resolved ?? null);
  const openAvg = avg(open ?? null);
  console.log(`  Resolved threads (sent/dismissed): avg ${resolvedAvg ?? "n/a"}h waited before resolution (${resolved?.length ?? 0} threads)`);
  console.log(`  Still open (needs-reply/low-confidence/follow-up): avg ${openAvg ?? "n/a"}h waited so far (${open?.length ?? 0} threads)`);
}

function goldenEvalSummary() {
  if (!fs.existsSync(GOLDEN_RESULTS_PATH)) {
    console.log("  No golden eval results found — run `npm run eval:golden` first.");
    return;
  }
  const results = JSON.parse(fs.readFileSync(GOLDEN_RESULTS_PATH, "utf-8"));
  for (const dp of results.decision_points) {
    const avgActual = dp.test_cases.reduce((s: number, tc: { actual_score: number }) => s + tc.actual_score, 0) / dp.test_cases.length;
    const avgExpected = dp.test_cases.reduce((s: number, tc: { expected_score: number }) => s + tc.expected_score, 0) / dp.test_cases.length;
    console.log(`  ${dp.id.padEnd(24)} avg_actual=${avgActual.toFixed(0)}  avg_expected=${avgExpected.toFixed(0)}  (${dp.test_cases.length} synthetic test cases)`);
  }
  console.log(`  Generated: ${results.generated_at}`);
}

async function main() {
  console.log("\n=== 1. AI call cost & volume (last 7 days) ===");
  await aiCallMetrics();

  console.log("\n=== 2. Failure / fallback rate (all time) ===");
  await failureRate();

  console.log("\n=== 3. Failed attempts & retries (last 7 days) ===");
  await errorLogSummary();

  console.log("\n=== 4. Real user feedback (all time) ===");
  await feedbackSummary();

  console.log("\n=== 5. Time to resolution ===");
  await timeToResolution();

  console.log("\n=== 6. Golden-eval quality scores (synthetic test cases, not real usage) ===");
  goldenEvalSummary();

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

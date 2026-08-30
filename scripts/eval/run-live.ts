import fs from "node:fs";
import path from "node:path";
import { supabaseServer } from "../../lib/supabase/server";
import { grade } from "./grade";
import type { DecisionPointConfig } from "./types";

// Grades REAL production output instead of the fixed synthetic test cases
// run-golden.ts uses. Same grader, same rubric per decision point (reuses
// each config's `dimensions` — the calibration anchors still come from the
// 3 synthetic examples in that file), but the actual input/output pulled
// straight from Supabase. There's no expected_score to diff against here —
// this is real usage, not a calibration exercise, so it just reports what
// Claude actually thinks of what shipped.
//
// Known gap: some original inputs the model saw at classification time
// aren't persisted (messageCount, a follow-up's recentHistory, a
// transcript's raw body) — grading works from what's in the database today,
// not a perfect replay of the original call.

const CONFIGS_DIR = path.join(__dirname, "configs");
const RESULTS_DIR = path.join(__dirname, "results");
const SAMPLE_SIZE = 8;

function loadConfigs(): Record<string, DecisionPointConfig> {
  const byDecisionPoint: Record<string, DecisionPointConfig> = {};
  for (const f of fs.readdirSync(CONFIGS_DIR).filter((f) => f.endsWith(".json"))) {
    const config = JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, f), "utf-8")) as DecisionPointConfig;
    byDecisionPoint[config.decision_point] = config;
  }
  return byDecisionPoint;
}

async function sampleClassifyAndDraft(supabase: ReturnType<typeof supabaseServer>) {
  const { data: threads } = await supabase
    .from("threads")
    .select("id, mailbox_id, subject, body, sender_name, sender_email, tier, status, why, waited_hours")
    .in("status", ["needs_reply", "low_confidence"])
    .order("updated_at", { ascending: false })
    .limit(SAMPLE_SIZE);
  if (!threads || threads.length === 0) return [];

  const mailboxIds = [...new Set(threads.map((t) => t.mailbox_id))];
  const { data: mailboxes } = await supabase.from("mailboxes").select("id, address").in("id", mailboxIds);
  const addressById = new Map((mailboxes ?? []).map((m) => [m.id, m.address]));

  const threadIds = threads.map((t) => t.id);
  const { data: draftRows } = await supabase
    .from("drafts")
    .select("thread_id, label, body")
    .in("thread_id", threadIds)
    .eq("source", "ai");
  const draftsByThread = new Map<string, { label: string; text: string }[]>();
  for (const d of draftRows ?? []) {
    const list = draftsByThread.get(d.thread_id) ?? [];
    list.push({ label: d.label ?? "Draft", text: d.body });
    draftsByThread.set(d.thread_id, list);
  }

  return threads.map((t) => ({
    ref: `thread:${t.id}`,
    candidate_input: {
      subject: t.subject,
      body: t.body,
      senderName: t.sender_name,
      senderEmail: t.sender_email,
      mailboxAddress: addressById.get(t.mailbox_id) ?? "",
      waitedHours: t.waited_hours,
    },
    candidate_output: {
      classification: t.status,
      tier: t.tier,
      why: t.why,
      drafts: draftsByThread.get(t.id) ?? [],
    },
  }));
}

async function sampleFollowupRelevance(supabase: ReturnType<typeof supabaseServer>) {
  const { data: followups } = await supabase
    .from("followups")
    .select("id, business_days_waited, nudge_reasoning, sent!inner(subject, body)")
    .eq("status", "pending")
    .order("updated_at", { ascending: false })
    .limit(SAMPLE_SIZE);
  if (!followups) return [];

  return followups.map((f) => {
    const sent = (f as unknown as { sent: { subject: string; body: string } }).sent;
    return {
      ref: `followup:${f.id}`,
      candidate_input: {
        subject: sent.subject,
        body: sent.body,
        recipientRaw: "(not persisted)",
        businessDaysWaited: f.business_days_waited,
      },
      candidate_output: {
        warranted: true, // only warranted follow-ups are ever persisted
        why: f.nudge_reasoning,
      },
    };
  });
}

async function sampleFallbackFollowup(supabase: ReturnType<typeof supabaseServer>) {
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, attendee_name, summary, drafts")
    .eq("state", "none")
    .order("updated_at", { ascending: false })
    .limit(SAMPLE_SIZE);
  if (!meetings) return [];

  return meetings.map((m) => ({
    ref: `meeting:${m.id}`,
    candidate_input: {
      title: m.title,
      attendeeName: m.attendee_name,
      recentHistory: "(not persisted separately from the summary already produced)",
    },
    candidate_output: {
      summary: m.summary,
      drafts: m.drafts ?? [],
    },
  }));
}

async function sampleSummarizeTranscript(supabase: ReturnType<typeof supabaseServer>) {
  const { data: meetings } = await supabase
    .from("meetings")
    .select("id, title, attendee_name, summary, action_items, drafts")
    .eq("state", "found")
    .order("updated_at", { ascending: false })
    .limit(SAMPLE_SIZE);
  if (!meetings) return [];

  return meetings.map((m) => ({
    ref: `meeting:${m.id}`,
    candidate_input: {
      title: m.title,
      attendeeName: m.attendee_name,
      transcriptBody: "(raw transcript not persisted — only the summary derived from it)",
    },
    candidate_output: {
      summary: m.summary,
      actionItems: m.action_items,
      drafts: m.drafts ?? [],
    },
  }));
}

async function main() {
  const supabase = supabaseServer();
  const configs = loadConfigs();

  const samplers: Record<string, (s: ReturnType<typeof supabaseServer>) => Promise<{ ref: string; candidate_input: unknown; candidate_output: unknown }[]>> = {
    classify_and_draft: sampleClassifyAndDraft,
    classify_followup_relevance: sampleFollowupRelevance,
    draft_fallback_followup: sampleFallbackFollowup,
    summarize_transcript: sampleSummarizeTranscript,
  };

  const decisionPoints = [];

  for (const [decisionPoint, sampler] of Object.entries(samplers)) {
    const config = configs[decisionPoint];
    if (!config) {
      console.log(`\n=== ${decisionPoint}: no config found, skipping ===`);
      continue;
    }
    const rows = await sampler(supabase);
    console.log(`\n=== ${decisionPoint} (${rows.length} real rows sampled) ===`);
    if (rows.length === 0) {
      console.log("  Nothing to grade yet — no real data in this state.");
      continue;
    }

    const graded = [];
    for (const row of rows) {
      const result = await grade(config, row.candidate_input, row.candidate_output);
      console.log(`  ${row.ref}  score=${result.totalScore}`);
      graded.push({
        ref: row.ref,
        candidate_input: row.candidate_input,
        candidate_output: row.candidate_output,
        actual_score: result.totalScore,
        dimension_scores: result.dimensionScores,
        reasoning: result.reasoning,
      });
    }

    const avg = graded.reduce((s, g) => s + g.actual_score, 0) / graded.length;
    console.log(`  Average: ${avg.toFixed(1)}`);

    decisionPoints.push({
      id: decisionPoint,
      name: config.product_name,
      dimensions: config.dimensions,
      sampled_at: new Date().toISOString(),
      rows: graded,
    });
  }

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const outPath = path.join(RESULTS_DIR, "followup-os-live-eval-results.json");
  fs.writeFileSync(outPath, JSON.stringify({ project: "FollowUp OS", generated_at: new Date().toISOString(), decision_points: decisionPoints }, null, 2));
  console.log(`\nWrote ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

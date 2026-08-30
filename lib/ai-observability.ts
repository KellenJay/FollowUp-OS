import { supabaseServer } from "@/lib/supabase/server";

// Structured per-call line for Vercel's Runtime Logs/Observability (useful
// for live tailing right after a scan), plus a row in ai_call_logs for a
// permanent audit trail — Vercel's own log retention is a rolling window
// (1 hour on Hobby, up to 30 days on paid Observability Plus) that eventually
// deletes the data, not real storage. A logging failure here must never
// break the actual AI call it's describing, so the insert is best-effort.
export async function logAiCall(
  ownerId: string,
  decisionPoint: string,
  model: string,
  startedAt: number,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null | undefined
) {
  const latencyMs = Date.now() - startedAt;
  console.log(JSON.stringify({
    event: "ai_call",
    decision_point: decisionPoint,
    model,
    latency_ms: latencyMs,
    prompt_tokens: usage?.prompt_tokens ?? null,
    completion_tokens: usage?.completion_tokens ?? null,
    total_tokens: usage?.total_tokens ?? null,
  }));

  try {
    const supabase = supabaseServer();
    await supabase.from("ai_call_logs").insert({
      owner_id: ownerId,
      decision_point: decisionPoint,
      model,
      latency_ms: latencyMs,
      prompt_tokens: usage?.prompt_tokens ?? null,
      completion_tokens: usage?.completion_tokens ?? null,
      total_tokens: usage?.total_tokens ?? null,
    });
  } catch (err) {
    console.error("Failed to persist ai_call_logs row", err);
  }
}

// Every failed attempt gets a row here — not just the terminal failure after
// retries are exhausted, so a transient blip that succeeded on retry 2 is
// still visible, not silently invisible just because the overall call
// eventually worked. Same best-effort pattern as logAiCall: never throws.
export async function logFailure(
  ownerId: string,
  source: string,
  attempt: number,
  willRetry: boolean,
  err: unknown
) {
  const message = err instanceof Error ? err.message : String(err);
  const status = typeof (err as { status?: unknown })?.status === "number" ? (err as { status: number }).status : null;

  console.error(JSON.stringify({
    event: "ai_call_error",
    source,
    attempt,
    will_retry: willRetry,
    error: message,
    status,
  }));

  try {
    const supabase = supabaseServer();
    await supabase.from("error_log").insert({
      owner_id: ownerId,
      source,
      attempt,
      will_retry: willRetry,
      error_message: message,
      error_status: status,
    });
  } catch (logErr) {
    console.error("Failed to persist error_log row", logErr);
  }
}

// A status in the 400s (bad request, auth, content policy) won't succeed on
// retry — only rate limits (429), server errors (5xx), and plain network
// failures (no status at all, e.g. a dropped connection) are worth retrying.
function isRetryable(err: unknown): boolean {
  const status = (err as { status?: unknown })?.status;
  if (status === undefined) return true;
  return typeof status === "number" && (status === 429 || status >= 500);
}

// Wraps a single AI call with up to 2 retries (3 attempts total) on
// transient failures, exponential backoff between attempts (500ms, 1000ms).
// Every failed attempt — including ones that get retried and eventually
// succeed — is reported via onAttemptError before this decides whether to
// retry or give up, so nothing fails silently even when the overall call
// works out.
export async function withRetry<T>(
  fn: () => Promise<T>,
  onAttemptError: (attempt: number, willRetry: boolean, err: unknown) => void,
  maxAttempts = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const willRetry = attempt < maxAttempts && isRetryable(err);
      onAttemptError(attempt, willRetry, err);
      if (!willRetry) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }
  throw new Error("unreachable");
}

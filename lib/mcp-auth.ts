import { randomBytes, createHash } from "crypto";
import { supabaseServer } from "@/lib/supabase/server";
import type { AuthInfo } from "@modelcontextprotocol/server";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Called from the logged-in web UI (Settings' "Generate token" button) —
// session-authenticated, not bearer-token-authenticated. Returns the
// plaintext once; only its hash is ever stored, so this is the only chance
// to see it (same UX as GitHub/Stripe-style API keys).
export async function generateMcpToken(ownerId: string): Promise<string> {
  const token = "fu_" + randomBytes(32).toString("base64url");
  const supabase = supabaseServer();
  const { error } = await supabase
    .from("mcp_tokens")
    .upsert({ owner_id: ownerId, token_hash: hashToken(token), created_at: new Date().toISOString() }, { onConflict: "owner_id" });
  if (error) {
    throw new Error(`Failed to store MCP token: ${error.message}`);
  }
  return token;
}

// The verifyToken callback mcp-handler's withMcpAuth expects: it already
// extracts the bearer token from the Authorization header itself, and
// expects undefined back (not a thrown error) for an invalid/missing token
// — withMcpAuth then handles the RFC 9728-compliant 401 response itself.
// ownerId rides along in AuthInfo.extra for the tool handlers to read via
// ctx.http.authInfo.extra.ownerId.
export async function verifyMcpBearerToken(_req: Request, bearerToken?: string): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const supabase = supabaseServer();
  const { data } = await supabase.from("mcp_tokens").select("owner_id").eq("token_hash", hashToken(bearerToken)).maybeSingle();
  if (!data) return undefined;

  await supabase.from("mcp_tokens").update({ last_used_at: new Date().toISOString() }).eq("owner_id", data.owner_id);
  return {
    token: bearerToken,
    clientId: data.owner_id,
    scopes: ["dashboard:read"],
    extra: { ownerId: data.owner_id },
  };
}

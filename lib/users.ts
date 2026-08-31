import { supabaseServer } from "@/lib/supabase/server";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
};

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, password_hash")
    .ilike("email", email.trim())
    .maybeSingle();
  if (error) throw new Error(`Failed to look up user: ${error.message}`);
  return data;
}

// Google's OAuth consent screen has no room for an invite-code field, so
// new-account creation on this path is gated by an email allowlist instead —
// GOOGLE_SIGNUP_ALLOWLIST, comma-separated. Existing accounts are completely
// unaffected (the check only runs when no row exists yet): this exists
// solely to stop "Log in with Google" from silently onboarding a stranger's
// real mailbox — and billing their scan to this app's own OpenAI key — the
// moment they click it from the public landing page.
function isAllowedNewGoogleSignup(email: string): boolean {
  const raw = process.env.GOOGLE_SIGNUP_ALLOWLIST ?? "";
  const allowed = raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

// Google sign-in path — identity is resolved by email (see 0010's migration
// note): a matching row is adopted regardless of whether it already has a
// password_hash, since Google's email is provider-verified. Never called
// from the credentials/signup path, which must not silently adopt an
// existing row (see createUserWithPassword below).
export async function resolveOrCreateUserByEmail(email: string, name: string | undefined): Promise<UserRow> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;

  if (!isAllowedNewGoogleSignup(email)) {
    throw new Error("This Google account is not on the invite list for FollowUp OS");
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("users")
    .insert({ email: email.trim(), name: name ?? null })
    .select("id, email, name, password_hash")
    .single();
  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return data;
}

// Credentials/signup path — deliberately does NOT upsert. Refuses if a row
// for this email already exists at all (Google-only or otherwise), per the
// plan's anti-collision policy: password signup can only create a brand-new
// identity, only Google sign-in can adopt an existing one.
export async function createUserWithPassword(
  email: string,
  name: string | undefined,
  passwordHash: string
): Promise<UserRow> {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error("An account with this email already exists");

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("users")
    .insert({ email: email.trim(), name: name ?? null, password_hash: passwordHash })
    .select("id, email, name, password_hash")
    .single();
  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return data;
}

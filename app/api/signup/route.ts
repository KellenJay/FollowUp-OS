import { NextResponse } from "next/server";
import { z } from "zod";
import { createUserWithPassword } from "@/lib/users";
import { hashPassword } from "@/lib/password";

const SignupSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid signup details" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const passwordHash = await hashPassword(password);
    // Deliberately does not upsert — refuses if this email exists at all,
    // Google-only account or not (see lib/users.ts's createUserWithPassword
    // for the reasoning: password signup can only create a brand-new
    // identity, only Google sign-in may adopt an existing one).
    const user = await createUserWithPassword(email, name, passwordHash);
    return NextResponse.json({ ok: true, email: user.email });
  } catch (err) {
    const message = (err as Error).message;
    const status = message.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

// Node's built-in scrypt rather than a new dependency (bcrypt needs a native
// binding, which can be a pain on serverless/Windows) — same "use what's
// already in Node's crypto module" convention as lib/crypto.ts's token
// encryption. Salt is stored alongside the hash, not separately, since
// there's nowhere else that needs it.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  if (!saltHex || !keyHex) return false;

  const key = Buffer.from(keyHex, "hex");
  const derived = (await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH)) as Buffer;

  // Guard the length before timingSafeEqual — it throws on mismatched
  // buffer lengths rather than returning false.
  return key.length === derived.length && timingSafeEqual(key, derived);
}

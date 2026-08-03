// Deterministic avatar gradient + initials for a sender, matching the visual
// style of the original mock data (public/app.js's THREADS/SENT/etc. `av`
// field) since real senders don't come with a designed color.
const GRADIENTS = [
  "linear-gradient(135deg,#cfe2f7,#b6cdf0)",
  "linear-gradient(135deg,#f7ddc4,#f3c9ae)",
  "linear-gradient(135deg,#cdeadd,#a9d8c4)",
  "linear-gradient(135deg,#e9dcf7,#d3c3ef)",
  "linear-gradient(135deg,#dfe6f2,#c8d3e6)",
  "linear-gradient(135deg,#f5dde8,#ecc6d8)",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function avatarFor(email: string): string {
  return GRADIENTS[hashString(email) % GRADIENTS.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

import { auth } from "@/auth";
import { runScan } from "@/lib/scan";

// Streams one NDJSON line per mailbox completed (see runScan's onProgress)
// so the client can show real scan-in-progress percentage instead of a
// generic indeterminate animation — no existing streaming pattern in this
// repo to follow, this is a plain Web Streams API ReadableStream, first one
// here.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const ownerId = session.user.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: object) => controller.enqueue(encoder.encode(JSON.stringify(line) + "\n"));
      try {
        const summary = await runScan(ownerId, (done, total, mailboxAddress) => {
          write({ type: "progress", done, total, mailbox: mailboxAddress });
        });
        write({ type: "done", ok: true, summary });
      } catch (err) {
        write({ type: "done", ok: false, error: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}

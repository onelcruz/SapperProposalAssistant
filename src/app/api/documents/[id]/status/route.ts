import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { assertCompanyAccess, resolveCompanyIdFromOrg } from "@/lib/workspace";

export const runtime = "nodejs";

const POLL_INTERVAL_MS = 1000;
const MAX_STREAM_DURATION_MS = 120_000;
const TERMINAL_STATUSES = new Set(["indexed", "failed"]);

/**
 * Server-Sent Events endpoint that reports a document's indexing status as
 * it progresses (`processing` -> `indexed` | `failed`). Intended for large
 * uploads where indexing may take a while — see spec.md Edge Cases.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const companyId = await resolveCompanyIdFromOrg();
    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: { id: true, companyId: true, status: true },
    });

    if (!document) {
      return new Response("Document not found.", { status: 404 });
    }

    assertCompanyAccess(companyId, document.companyId);

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const startedAt = Date.now();
        let closed = false;

        const send = (status: string) => {
          if (closed) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status })}\n\n`));
        };

        const stop = () => {
          if (closed) return;
          closed = true;
          clearInterval(interval);
          controller.close();
        };

        send(document.status);

        if (TERMINAL_STATUSES.has(document.status)) {
          stop();
          return;
        }

        const interval = setInterval(async () => {
          if (closed) return;

          try {
            const current = await prisma.document.findUnique({
              where: { id },
              select: { status: true },
            });

            if (!current) {
              stop();
              return;
            }

            send(current.status);

            if (TERMINAL_STATUSES.has(current.status) || Date.now() - startedAt > MAX_STREAM_DURATION_MS) {
              stop();
            }
          } catch {
            stop();
          }
        }, POLL_INTERVAL_MS);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

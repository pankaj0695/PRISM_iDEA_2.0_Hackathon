/**
 * Simple in-process pub/sub for Server-Sent Events. Upgrade path: swap the
 * EventTarget out for Redis pub/sub when running multi-instance.
 */
import type { Alert } from "@/lib/db/schemas";

type PrismEvent =
  | { type: "alert.new"; alert: Alert }
  | { type: "alert.updated"; alert: Alert }
  | { type: "ping"; at: string };

declare global {
  // eslint-disable-next-line no-var
  var __prismBus: EventTarget | undefined;
}

function bus(): EventTarget {
  if (!global.__prismBus) global.__prismBus = new EventTarget();
  return global.__prismBus;
}

export function publish(event: PrismEvent) {
  bus().dispatchEvent(new CustomEvent("event", { detail: event }));
}

export function subscribe(handler: (e: PrismEvent) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<PrismEvent>).detail);
  bus().addEventListener("event", listener);
  return () => bus().removeEventListener("event", listener);
}

export function sseStream(filter?: (e: PrismEvent) => boolean): ReadableStream {
  let unsub: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (e: PrismEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          // controller closed
        }
      };
      send({ type: "ping", at: new Date().toISOString() });
      unsub = subscribe((e) => {
        if (!filter || filter(e)) send(e);
      });
      keepAlive = setInterval(
        () => send({ type: "ping", at: new Date().toISOString() }),
        20_000,
      );
    },
    cancel() {
      if (unsub) unsub();
      if (keepAlive) clearInterval(keepAlive);
    },
  });
}

import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function bad(message: string, details?: unknown): NextResponse {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauth(message = "Unauthorized"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not Found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(err: unknown): NextResponse {
  const msg = err instanceof Error ? err.message : "Internal Server Error";
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, response: bad("Invalid JSON body") };
  }
  try {
    return { ok: true, data: schema.parse(raw) };
  } catch (e) {
    if (e instanceof ZodError)
      return { ok: false, response: bad("Validation failed", e.flatten()) };
    return { ok: false, response: bad("Validation failed") };
  }
}

export function parseQuery<T>(url: string, schema: ZodSchema<T>):
  | { ok: true; data: T }
  | { ok: false; response: NextResponse } {
  const params = Object.fromEntries(new URL(url).searchParams.entries());
  try {
    return { ok: true, data: schema.parse(params) };
  } catch (e) {
    if (e instanceof ZodError)
      return { ok: false, response: bad("Invalid query", e.flatten()) };
    return { ok: false, response: bad("Invalid query") };
  }
}

export const PAGINATION_QUERY = {
  parsePage(searchParams: URLSearchParams) {
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || "25")));
    return { page, limit, skip: (page - 1) * limit };
  },
};

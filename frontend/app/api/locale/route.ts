import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALES, LOCALE_COOKIE } from "@/lib/i18n/locales";
import { bad, parseBody } from "@/lib/api/respond";

const Body = z.object({
  locale: z.enum(LOCALES as unknown as [string, ...string[]]),
});

export async function POST(req: Request) {
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;

  const res = NextResponse.json({ ok: true, locale: parsed.data.locale });
  res.cookies.set(LOCALE_COOKIE, parsed.data.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

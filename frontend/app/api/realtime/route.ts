import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";
import { sseStream } from "@/lib/realtime/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stream = sseStream((e) => {
    if (e.type === "ping") return true;
    if (user.role === "BRANCH_MANAGER") return e.alert.branch_id === user.branch_id;
    if (user.role === "EMPLOYEE") return e.alert.employee_id === user.sub;
    return true;
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

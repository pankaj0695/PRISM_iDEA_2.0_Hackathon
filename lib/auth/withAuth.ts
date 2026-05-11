import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken, type SessionUser } from "./jwt";
import { can, type Capability } from "./rbac";

export type AuthedHandler = (
  req: NextRequest,
  ctx: { user: SessionUser; params: Record<string, string> },
) => Promise<NextResponse> | NextResponse;

interface Opts {
  capability?: Capability;
  /** allow this handler when no auth cookie present (rare; e.g. /api/auth/me) */
  optional?: boolean;
}

export function withAuth(handler: AuthedHandler, opts: Opts = {}) {
  return async (
    req: NextRequest,
    routeCtx: { params: Promise<Record<string, string>> | Record<string, string> },
  ) => {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const user = token ? await verifyToken(token) : null;

    if (!user) {
      if (opts.optional) {
        // pass through with a sentinel; handler must check
        const params = await Promise.resolve(routeCtx.params);
        return handler(req, { user: null as unknown as SessionUser, params });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (opts.capability && !can(user.role, opts.capability)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const params = await Promise.resolve(routeCtx.params);
    return handler(req, { user, params });
  };
}

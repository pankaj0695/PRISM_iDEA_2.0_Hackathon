import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";
import { homeForRole } from "@/lib/auth/rbac";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/locale", // language switcher works before sign-in
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname === "/favicon.ico" ||
    pathname === "/PRISM_logo.png" ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;

  // /api/* protection: return 401 instead of redirect for the API.
  if (pathname.startsWith("/api/")) {
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.next();
  }

  // Root → role home (or login if not signed in).
  if (pathname === "/") {
    if (user) return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!user) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Section-level role gating
  if (pathname.startsWith("/admin") && !["ADMIN", "FRAUD_ANALYST"].includes(user.role)) {
    return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
  }
  if (pathname.startsWith("/manager") && !["BRANCH_MANAGER", "COMPLIANCE_OFFICER", "ADMIN", "FRAUD_ANALYST"].includes(user.role)) {
    return NextResponse.redirect(new URL(homeForRole(user.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

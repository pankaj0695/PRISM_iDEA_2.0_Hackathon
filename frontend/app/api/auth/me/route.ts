import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "@/lib/auth/jwt";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });
  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({
    user: {
      employee_id: user.sub,
      employee_code: user.employee_code,
      name: user.name,
      role: user.role,
      branch_id: user.branch_id,
    },
  });
}

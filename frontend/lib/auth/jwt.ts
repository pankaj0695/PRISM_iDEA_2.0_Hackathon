import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Role } from "./rbac";

const SECRET = process.env.JWT_SECRET || "prism-dev-secret-change-me-32-bytes-min";
const key = new TextEncoder().encode(SECRET);

export interface SessionUser extends JWTPayload {
  sub: string; // employee_id
  employee_code: string;
  name: string;
  role: Role;
  branch_id: string;
}

export async function signToken(user: Omit<SessionUser, "iat" | "exp">): Promise<string> {
  return await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as SessionUser;
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "prism_session";

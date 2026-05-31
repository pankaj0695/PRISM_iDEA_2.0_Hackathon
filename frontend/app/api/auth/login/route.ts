import { NextResponse } from "next/server";
import { z } from "zod";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import type { Employee } from "@/lib/db/schemas";
import { deriveRoleFromCategory } from "@/lib/auth/rbac";
import { COOKIE_NAME, signToken } from "@/lib/auth/jwt";
import { bad, parseBody, serverError } from "@/lib/api/respond";

const Body = z.object({
  employee_code: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const parsed = await parseBody(req, Body);
    if (!parsed.ok) return parsed.response;

    const expected = process.env.DEMO_PASSWORD || "prism123";
    if (parsed.data.password !== expected) {
      return bad("Invalid credentials");
    }

    const employees = await getCollection<Employee>(COLLECTIONS.employees);
    // Accept either `employee_id` (EMP_00001) or `employee_code` (UBI/MUM/1234).
    const input = parsed.data.employee_code.trim();
    const rx = new RegExp(`^${escapeRegex(input)}$`, "i");
    const employee = await employees.findOne({
      $or: [{ employee_id: { $regex: rx } }, { employee_code: { $regex: rx } }],
    });
    if (!employee) return bad("Employee not found");

    const role = deriveRoleFromCategory(employee.role_category, employee.designation, employee.grade);
    const token = await signToken({
      sub: employee.employee_id,
      employee_code: employee.employee_code,
      name: employee.full_name,
      role,
      branch_id: employee.branch_id,
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        employee_id: employee.employee_id,
        employee_code: employee.employee_code,
        name: employee.full_name,
        role,
        branch_id: employee.branch_id,
        designation: employee.designation,
      },
    });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (e) {
    return serverError(e);
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

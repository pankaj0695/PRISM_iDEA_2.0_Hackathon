import { z } from "zod";
import { withAuth } from "@/lib/auth/withAuth";
import { parseBody, ok, serverError, forbidden } from "@/lib/api/respond";
import { runDetection } from "@/lib/detect";

const Body = z.object({
  employee_id: z.string().min(1),
  event_type: z.string().min(1),
  event_metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST = withAuth(async (req, { user }) => {
  if (user.role === "EMPLOYEE") return forbidden();
  const parsed = await parseBody(req, Body);
  if (!parsed.ok) return parsed.response;
  try {
    const result = await runDetection(parsed.data);
    return ok({ result });
  } catch (e) {
    return serverError(e);
  }
});

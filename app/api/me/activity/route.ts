import { withAuth } from "@/lib/auth/withAuth";
import { COLLECTIONS, getCollection } from "@/lib/db/mongo";
import { ok, serverError } from "@/lib/api/respond";
import type { ActivityLog } from "@/lib/db/schemas";

export const GET = withAuth(async (req, { user }) => {
  try {
    const url = new URL(req.url);
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));

    const logs = await getCollection<ActivityLog>(COLLECTIONS.activity_logs);
    const recent = await logs
      .find({ employee_id: user.sub })
      .sort({ action_datetime: -1 })
      .limit(limit)
      .toArray();

    const loginEvents = await logs
      .find({ employee_id: user.sub, action_type: "LOGIN" })
      .sort({ action_datetime: -1 })
      .limit(20)
      .toArray();

    const devicesMap = new Map<string, { device_id: string; ip_address: string; last_seen: string; count: number }>();
    for (const l of recent) {
      const k = `${l.device_id}|${l.ip_address}`;
      const prev = devicesMap.get(k);
      if (!prev) {
        devicesMap.set(k, { device_id: l.device_id, ip_address: l.ip_address, last_seen: l.action_datetime, count: 1 });
      } else {
        prev.count += 1;
        if (l.action_datetime > prev.last_seen) prev.last_seen = l.action_datetime;
      }
    }

    return ok({
      activity: recent,
      logins: loginEvents,
      devices: Array.from(devicesMap.values()).sort((a, b) => b.last_seen.localeCompare(a.last_seen)),
    });
  } catch (e) {
    return serverError(e);
  }
});

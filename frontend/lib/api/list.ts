import { NextResponse, type NextRequest } from "next/server";
import { type Document, type Filter } from "mongodb";
import { getCollection } from "@/lib/db/mongo";
import type { SessionUser } from "@/lib/auth/jwt";
import { PAGINATION_QUERY, ok, serverError } from "./respond";

interface ListOpts<T extends Document> {
  collection: string;
  /** RBAC scoping: restricts non-system roles to their branch / own record. */
  scope?: (user: SessionUser) => Filter<T>;
  /** Map URL search params into a Mongo filter. */
  filterFromQuery?: (sp: URLSearchParams) => Filter<T>;
  /** Default sort. */
  sort?: Record<string, 1 | -1>;
  /** Field projection. */
  projection?: Record<string, 0 | 1>;
}

export function listRoute<T extends Document>(opts: ListOpts<T>) {
  return async function handler(
    req: NextRequest,
    user: SessionUser | null,
  ): Promise<NextResponse> {
    try {
      const url = new URL(req.url);
      const sp = url.searchParams;
      const { page, limit, skip } = PAGINATION_QUERY.parsePage(sp);

      const scoped = user && opts.scope ? opts.scope(user) : {};
      const fromQuery = opts.filterFromQuery ? opts.filterFromQuery(sp) : {};
      const filter = { ...scoped, ...fromQuery } as Filter<T>;

      const col = await getCollection<T>(opts.collection);
      const cursor = col
        .find(filter, opts.projection ? { projection: opts.projection } : undefined)
        .sort(opts.sort || ({ _id: -1 } as Record<string, 1 | -1>))
        .skip(skip)
        .limit(limit);

      const [items, total] = await Promise.all([cursor.toArray(), col.countDocuments(filter)]);
      return ok({ items, page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) });
    } catch (e) {
      return serverError(e);
    }
  };
}

export function pickStringFilter(
  sp: URLSearchParams,
  param: string,
  field: string,
): Record<string, string> | Record<string, never> {
  const v = sp.get(param);
  if (!v) return {};
  return { [field]: v };
}

export function pickBoolFilter(
  sp: URLSearchParams,
  param: string,
  field: string,
): Record<string, boolean> | Record<string, never> {
  const v = sp.get(param);
  if (v === null) return {};
  return { [field]: v === "true" };
}

export function pickDateRangeFilter(
  sp: URLSearchParams,
  fromParam: string,
  toParam: string,
  field: string,
): Record<string, { $gte?: string; $lte?: string }> | Record<string, never> {
  const from = sp.get(fromParam);
  const to = sp.get(toParam);
  if (!from && !to) return {};
  const range: { $gte?: string; $lte?: string } = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return { [field]: range };
}

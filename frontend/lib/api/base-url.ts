/**
 * Returns the absolute base URL for internal server-side fetch calls.
 *
 * Priority:
 *  1. NEXT_PUBLIC_APP_URL  — explicitly set in Vercel env vars (recommended)
 *  2. VERCEL_URL           — auto-injected by Vercel for every deployment
 *  3. localhost:3000       — local development fallback
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

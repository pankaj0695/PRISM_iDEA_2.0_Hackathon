import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n/locales";

export default getRequestConfig(async () => {
  const jar = await cookies();
  const raw = jar.get(LOCALE_COOKIE)?.value;
  const locale: Locale = (LOCALES as readonly string[]).includes(raw || "")
    ? (raw as Locale)
    : DEFAULT_LOCALE;

  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
});

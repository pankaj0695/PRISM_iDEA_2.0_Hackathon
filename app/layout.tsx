import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { LOCALE_META, type Locale } from "@/lib/i18n/locales";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRISM — Union Bank of India",
  description:
    "Privileged-user Risk Identification and Surveillance Monitoring — AI-powered insider fraud detection for Union Bank of India.",
  icons: { icon: "/PRISM_logo.png" },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = (await getLocale()) as Locale;
  const messages = await getMessages();
  const dir = LOCALE_META[locale]?.dir ?? "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${devanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--bg-soft)] text-[var(--fg)]">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

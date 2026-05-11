import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PRISM — Union Bank of India",
  description:
    "Privileged-user Risk Identification and Surveillance Monitoring — AI-powered insider fraud detection for Union Bank of India.",
  icons: { icon: "/PRISM_logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[var(--bg-soft)] text-[var(--fg)]">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

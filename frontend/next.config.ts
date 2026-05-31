import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    // import.meta.dirname is the ESM equivalent of __dirname (Node 20.11+ / 21.2+).
    // __dirname is undefined in ESM (module: esnext) and causes a Turbopack panic.
    root: import.meta.dirname,
  },
  // Hide the Next.js dev-tools floating button in development.
  devIndicators: false,
};

export default withNextIntl(nextConfig);

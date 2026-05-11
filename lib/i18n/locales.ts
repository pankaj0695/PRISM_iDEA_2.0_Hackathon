export const LOCALES = [
  "en",
  "hi",
  "bn",
  "te",
  "mr",
  "ta",
  "ur",
  "gu",
  "kn",
  "ml",
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "prism_locale";

export interface LocaleMeta {
  code: Locale;
  label: string; // native script
  english: string;
  dir: "ltr" | "rtl";
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", label: "English", english: "English", dir: "ltr" },
  hi: { code: "hi", label: "हिन्दी", english: "Hindi", dir: "ltr" },
  bn: { code: "bn", label: "বাংলা", english: "Bengali", dir: "ltr" },
  te: { code: "te", label: "తెలుగు", english: "Telugu", dir: "ltr" },
  mr: { code: "mr", label: "मराठी", english: "Marathi", dir: "ltr" },
  ta: { code: "ta", label: "தமிழ்", english: "Tamil", dir: "ltr" },
  ur: { code: "ur", label: "اُردُو", english: "Urdu", dir: "rtl" },
  gu: { code: "gu", label: "ગુજરાતી", english: "Gujarati", dir: "ltr" },
  kn: { code: "kn", label: "ಕನ್ನಡ", english: "Kannada", dir: "ltr" },
  ml: { code: "ml", label: "മലയാളം", english: "Malayalam", dir: "ltr" },
};

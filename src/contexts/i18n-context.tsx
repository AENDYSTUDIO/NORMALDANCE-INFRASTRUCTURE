"use client";

import {
  ATR_LANGUAGES,
  ATRLanguageCode,
  isATRLanguage,
} from "@/lib/i18n/atr-languages";
import {
  ATR_TRANSLATIONS,
  ATRTranslationKey,
} from "@/lib/i18n/atr-translations";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface I18nContextType {
  language: ATRLanguageCode;
  setLanguage: (language: ATRLanguageCode) => void;
  t: (
    key: ATRTranslationKey,
    category?: keyof typeof ATR_TRANSLATIONS
  ) => string;
  languages: typeof ATR_LANGUAGES;
  isRTL: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<ATRLanguageCode>("en-AU");

  // Check if language is RTL (right-to-left)
  const isRTL = false; // For now, all ATR languages are LTR

  // Initialize language from localStorage or browser settings
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("selectedLanguage");
      if (savedLanguage && isATRLanguage(savedLanguage)) {
        setLanguage(savedLanguage as ATRLanguageCode);
      } else {
        // Try to detect browser language
        const browserLang = navigator.language;
        const shortLang = browserLang.split("-")[0];

        // Map browser language to our supported languages
        const langMap: Record<string, ATRLanguageCode> = {
          zh: "zh-CN",
          ja: "ja",
          ko: "ko",
          hi: "hi",
          id: "id",
          th: "th",
          vi: "vi",
          tl: "tl",
          ms: "ms",
          en: "en-AU",
        };

        const detectedLang = langMap[shortLang] || "en-AU";
        setLanguage(detectedLang);
      }
    }
  }, []);

  // Save language preference to localStorage
  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined" && language) {
      localStorage.setItem("selectedLanguage", language);
      // Update document direction for RTL languages
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language, isRTL]);

  // Translation function
  const t = (
    key: ATRTranslationKey,
    category: keyof typeof ATR_TRANSLATIONS = "common"
  ) => {
    try {
      const translations = ATR_TRANSLATIONS[category];
      const langTranslations =
        translations[language as keyof typeof translations];

      if (!langTranslations) {
        // Fallback to English if language not found
        const englishTranslations =
          translations["en-AU" as keyof typeof translations];
        return (
          englishTranslations?.[key as keyof typeof englishTranslations] || key
        );
      }

      return langTranslations[key as keyof typeof langTranslations] || key;
    } catch (error) {
      // Only log in development
      if (
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        // eslint-disable-next-line no-console
        console.error("Translation error:", error);
      }
      return key;
    }
  };

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage,
        t,
        languages: ATR_LANGUAGES,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}

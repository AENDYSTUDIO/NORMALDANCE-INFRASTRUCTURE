import { useI18n } from "@/contexts/i18n-context";
import { ATRTranslationKey } from "@/lib/i18n/atr-translations";

export function useTranslation() {
  const { t, language, setLanguage, languages, isRTL } = useI18n();

  return {
    t,
    language,
    setLanguage,
    languages,
    isRTL,
    // Convenience method for formatting translated strings with variables
    format: (
      key: ATRTranslationKey,
      variables: Record<string, string | number> = {}
    ) => {
      let translation = t(key);

      // Replace variables in the format {{variable}}
      Object.entries(variables).forEach(([key, value]) => {
        translation = translation.replace(
          new RegExp(`{{${key}}}`, "g"),
          String(value)
        );
      });

      return translation;
    },
  };
}

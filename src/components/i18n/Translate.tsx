"use client";

import { useTranslation } from "@/hooks/use-i18n";
import { ATRTranslationKey } from "@/lib/i18n/atr-translations";
import React from "react";

interface TranslateProps {
  id: ATRTranslationKey;
  category?: keyof typeof import("@/lib/i18n/atr-translations").ATR_TRANSLATIONS;
  variables?: Record<string, string | number>;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
}

export function Translate({
  id,
  category,
  variables,
  className,
  style,
  as: Component = "span",
}: TranslateProps) {
  const { t, format } = useTranslation();

  // Get translation
  const translation = category ? t(id, category) : t(id);

  // Format with variables if provided
  const formattedTranslation = variables ? format(id, variables) : translation;

  return (
    <Component className={className} style={style}>
      {formattedTranslation}
    </Component>
  );
}

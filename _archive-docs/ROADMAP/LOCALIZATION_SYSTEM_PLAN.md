# План системы локализации

## Обзор

В этом документе описывается план реализации системы локализации проекта NormalDance. Это улучшение имеет низкий приоритет для Q3-Q4 2025 года, так как обеспечивает расширение на международные рынки и улучшает доступность платформы для пользователей по всему миру.

## Текущая ситуация

### Существующая система локализации

- Отсутствие поддержки многоязычности
- Весь интерфейс на английском языке
- Нет механизма переключения языков
- Нет локализации контента

### Проблемы текущей реализации

- Ограниченный доступ для неанглоязычных пользователей
- Нет поддержки международных рынков
- Отсутствие культурной адаптации
- Нет автоматического определения языка

## Цели реализации

### Основные цели

- Реализация системы локализации
- Добавление поддержки нескольких языков
- Локализация интерфейса и контента
- Автоматический выбор языка

### Технические цели

- Поддержка основных языков
- Эффективная система локализации
- Интеграция с существующими системами
- Поддержка RTL языков

## План реализации

### Этап 1: Анализ и выбор языков (Неделя 1-2)

- Анализ целевых рынков
- Выбор приоритетных языков
- Подготовка структуры локализации
- Выбор инструментов локализации

### Этап 2: Подготовка инфраструктуры (Неделя 3-4)

- Настройка системы локализации
- Создание файлов переводов
- Интеграция с фронтендом
- Создание API для локализации

### Этап 3: Перевод контента (Неделя 5-6)

- Перевод интерфейса
- Локализация маркетингового контента
- Перевод документации
- Культурная адаптация

### Этап 4: Интеграция и тестирование (Неделя 7-8)

- Интеграция с приложением
- Тестирование локализации
- Тестирование UX
- Исправление выявленных проблем

### Этап 5: Внедрение (Неделя 9)

- Постепенное внедрение локализации
- Мониторинг после внедрения
- Обновление документации

## Технические детали

### Архитектура системы локализации

#### Структура файлов локализации

```
public/
└── locales/
    ├── en/
    │   ├── common.json
    │   ├── tracks.json
    │   ├── nfts.json
    │   ├── auth.json
    │   └── dashboard.json
    ├── ru/
    │   ├── common.json
    │   ├── tracks.json
    │   ├── nfts.json
    │   ├── auth.json
    │   └── dashboard.json
    ├── es/
    │   ├── common.json
    │   ├── tracks.json
    │   ├── nfts.json
    │   ├── auth.json
    │   └── dashboard.json
    └── fr/
        ├── common.json
        ├── tracks.json
        ├── nfts.json
        ├── auth.json
        └── dashboard.json
```

#### Базовые файлы локализации

```json
// public/locales/en/common.json
{
  "welcome": "Welcome to NormalDance",
  "home": "Home",
  "tracks": "Tracks",
  "nfts": "NFTs",
  "artists": "Artists",
  "profile": "Profile",
  "settings": "Settings",
  "search": "Search",
  "login": "Login",
  "signup": "Sign Up",
  "logout": "Logout",
  "connect_wallet": "Connect Wallet",
  "language": "Language",
  "currency": "Currency",
  "dashboard": "Dashboard",
  "admin_panel": "Admin Panel",
  "support": "Support",
  "help": "Help",
  "about": "About",
  "terms": "Terms of Service",
  "privacy": "Privacy Policy",
  "copyright": "© 2025 NormalDance. All rights reserved.",
  "loading": "Loading...",
  "error": "Error",
  "success": "Success",
  "cancel": "Cancel",
  "save": "Save",
  "delete": "Delete",
  "edit": "Edit",
  "view": "View",
  "share": "Share",
  "copy": "Copy",
  "copied": "Copied!",
  "close": "Close",
  "back": "Back",
  "next": "Next",
  "previous": "Previous",
  "more": "More",
  "less": "Less",
  "all": "All",
  "none": "None",
  "yes": "Yes",
  "no": "No",
  "ok": "OK",
  "confirm": "Confirm",
  "are_you_sure": "Are you sure?",
  "search_placeholder": "Search tracks, artists, NFTs...",
  "no_results": "No results found",
  "page_not_found": "Page not found",
  "something_went_wrong": "Something went wrong",
  "try_again": "Try again",
  "refresh": "Refresh",
  "offline": "You are offline",
  "online": "You are online",
  "last_updated": "Last updated",
  "powered_by": "Powered by"
}
```

```json
// public/locales/en/tracks.json
{
  "title": "Music Tracks",
  "subtitle": "Discover the latest music on NormalDance",
  "play": "Play",
  "pause": "Pause",
  "stop": "Stop",
  "volume": "Volume",
  "mute": "Mute",
  "unmute": "Unmute",
  "shuffle": "Shuffle",
  "repeat": "Repeat",
  "like": "Like",
  "unlike": "Unlike",
  "share_track": "Share Track",
  "download": "Download",
  "buy_nft": "Buy NFT",
  "add_to_playlist": "Add to Playlist",
  "create_playlist": "Create Playlist",
  "playlist_name": "Playlist Name",
  "add_to_queue": "Add to Queue",
  "remove_from_queue": "Remove from Queue",
  "track_info": "Track Info",
  "artist": "Artist",
  "album": "Album",
  "genre": "Genre",
  "duration": "Duration",
  "release_date": "Release Date",
  "bpm": "BPM",
  "key": "Key",
  "popularity": "Popularity",
  "plays": "Plays",
  "likes": "Likes",
  "comments": "Comments",
  "lyrics": "Lyrics",
  "view_lyrics": "View Lyrics",
  "no_lyrics": "No lyrics available",
  "related_tracks": "Related Tracks",
  "trending_now": "Trending Now",
  "new_releases": "New Releases",
  "top_tracks": "Top Tracks",
  "your_library": "Your Library",
  "recently_played": "Recently Played",
  "most_played": "Most Played",
  "create_album": "Create Album",
  "upload_track": "Upload Track",
  "upload": "Upload",
  "select_file": "Select File",
  "drag_drop": "Drag & drop or click to select",
  "max_file_size": "Max file size: 100MB",
  "supported_formats": "Supported formats: MP3, WAV, FLAC",
  "track_details": "Track Details",
  "title_placeholder": "Enter track title",
  "description": "Description",
  "description_placeholder": "Describe your track...",
  "cover_image": "Cover Image",
  "upload_cover": "Upload Cover",
  "price": "Price",
  "price_placeholder": "Enter price in SOL",
  "is_nft": "Mint as NFT",
  "publish": "Publish",
  "save_draft": "Save Draft",
  "publish_success": "Track published successfully!",
  "publish_error": "Error publishing track",
  "uploading": "Uploading...",
  "processing": "Processing...",
  "upload_success": "Upload completed successfully!",
  "upload_error": "Upload failed"
}
```

### Система локализации

#### Хук для локализации

```typescript
// src/hooks/useTranslation.ts
import { useState, useEffect } from "react";

interface Translations {
  [key: string]: any;
}

const DEFAULT_LOCALE = "en";
const SUPPORTED_LOCALES = ["en", "ru", "es", "fr"];

export const useTranslation = (namespace: string = "common") => {
  const [locale, setLocale] = useState<string>(DEFAULT_LOCALE);
  const [translations, setTranslations] = useState<Translations>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeTranslations = async () => {
      try {
        // Определение языка пользователя
        const userLocale = detectUserLocale();
        setLocale(userLocale);

        // Загрузка переводов
        const translations = await loadTranslations(userLocale, namespace);
        setTranslations(translations);
      } catch (error) {
        console.error("Error loading translations:", error);
        // Загрузка fallback переводов
        const fallbackTranslations = await loadTranslations(
          DEFAULT_LOCALE,
          namespace
        );
        setTranslations(fallbackTranslations);
      } finally {
        setLoading(false);
      }
    };

    initializeTranslations();
  }, [namespace]);

  const detectUserLocale = (): string => {
    // Попытка определить язык из:
    // 1. URL параметра
    // 2. localStorage
    // 3. Языка браузера
    // 4. Default языка

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlLocale = urlParams.get("locale");

      if (urlLocale && SUPPORTED_LOCALES.includes(urlLocale)) {
        return urlLocale;
      }

      const storedLocale = localStorage.getItem("locale");
      if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
        return storedLocale;
      }

      const browserLocale = window.navigator.language.split("-")[0];
      if (SUPPORTED_LOCALES.includes(browserLocale)) {
        return browserLocale;
      }
    }

    return DEFAULT_LOCALE;
  };

  const loadTranslations = async (
    locale: string,
    namespace: string
  ): Promise<Translations> => {
    try {
      // В продакшене использовать динамический импорт
      const module = await import(
        `@/public/locales/${locale}/${namespace}.json`
      );
      return module.default || {};
    } catch (error) {
      console.error(
        `Error loading translations for ${locale}/${namespace}:`,
        error
      );
      // Возвращаем пустой объект, чтобы не ломать приложение
      return {};
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    let translation = getNestedTranslation(translations, key);

    if (!translation) {
      // Попытка найти перевод в fallback языке
      const fallbackTranslations = loadFallbackTranslations(namespace);
      translation = getNestedTranslation(fallbackTranslations, key);
    }

    if (!translation) {
      // Возврат ключа, если перевод не найден
      return key;
    }

    // Замена параметров в переводе
    if (params) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }

    return translation;
  };

  const getNestedTranslation = (
    obj: Translations,
    path: string
  ): string | undefined => {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj) as string | undefined;
  };

  const loadFallbackTranslations = (namespace: string): Translations => {
    // В реальном приложении: кэширование fallback переводов
    try {
      const module = require(`@/public/locales/${DEFAULT_LOCALE}/${namespace}.json`);
      return module.default || {};
    } catch (error) {
      return {};
    }
  };

  const changeLocale = async (newLocale: string) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) {
      console.warn(`Locale ${newLocale} is not supported`);
      return;
    }

    setLoading(true);

    try {
      const newTranslations = await loadTranslations(newLocale, namespace);
      setTranslations(newTranslations);
      setLocale(newLocale);

      // Сохранение языка в localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("locale", newLocale);
      }
    } catch (error) {
      console.error("Error changing locale:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    t,
    locale,
    changeLocale,
    loading,
    supportedLocales: SUPPORTED_LOCALES,
  };
};

// Компонент провайдера локализации
export const TranslationProvider = ({
  children,
  initialLocale = DEFAULT_LOCALE,
}) => {
  // В реальном приложении: контекст для передачи данных локализации
  return children;
};
```

### Middleware для локализации

#### Middleware для определения языка

```typescript
// src/middleware/localization-middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { SUPPORTED_LOCALES } from "@/lib/constants";

export function localizationMiddleware(request: NextRequest) {
  // Получение языка из заголовка Accept-Language или из поддомена
  const urlLocale = request.nextUrl.pathname.split("/")[1];

  if (SUPPORTED_LOCALES.includes(urlLocale)) {
    // Язык уже в URL, продолжаем
    return NextResponse.next();
  }

  // Определение языка пользователя
  const userLocale = getUserLocale(request);

  // Перенаправление на URL с языком
  if (request.nextUrl.pathname !== "/404") {
    const localizedUrl = new URL(
      `/${userLocale}${request.nextUrl.pathname}`,
      request.url
    );
    localizedUrl.search = request.nextUrl.search;

    return NextResponse.redirect(localizedUrl);
  }

  return NextResponse.next();
}

function getUserLocale(request: NextRequest): string {
  // 1. Попытка получить язык из cookie
  const localeCookie = request.cookies.get("NEXT_LOCALE");
  if (localeCookie && SUPPORTED_LOCALES.includes(localeCookie.value)) {
    return localeCookie.value;
  }

  // 2. Попытка получить язык из заголовка Accept-Language
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim())
      .map((lang) => lang.split("-")[0]); // Получаем только код языка

    for (const lang of languages) {
      if (SUPPORTED_LOCALES.includes(lang)) {
        return lang;
      }
    }
  }

  // 3. Язык по умолчанию
  return "en";
}
```

### Компоненты локализации

#### Компонент переключения языка

```tsx
// src/components/LanguageSwitcher.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

const LanguageSwitcher = () => {
  const { locale, changeLocale, supportedLocales } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languageNames: Record<string, string> = {
    en: "English",
    ru: "Русский",
    es: "Español",
    fr: "Français",
  };

  const languageFlags: Record<string, string> = {
    en: "🇺🇸",
    ru: "🇷🇺",
    es: "🇪🇸",
    fr: "🇫🇷",
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <span>{languageFlags[locale]}</span>
        <span className="hidden md:inline">{languageNames[locale]}</span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          {supportedLocales.map((lang) => (
            <button
              key={lang}
              onClick={() => {
                changeLocale(lang);
                setIsOpen(false);
              }}
              className={`flex items-center space-x-3 w-full text-left px-4 py-2 hover:bg-gray-100 ${
                locale === lang
                  ? "bg-purple-50 text-purple-700"
                  : "text-gray-700"
              }`}
            >
              <span>{languageFlags[lang]}</span>
              <span>{languageNames[lang]}</span>
              {locale === lang && (
                <svg
                  className="w-4 h-4 ml-auto"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
```

#### Компонент с локализованным контентом

```tsx
// src/components/LocalizedText.tsx
import { useTranslation } from "@/hooks/useTranslation";

interface LocalizedTextProps {
  i18nKey: string;
  ns?: string;
  values?: Record<string, any>;
  children?: React.ReactNode;
}

const LocalizedText = ({
  i18nKey,
  ns = "common",
  values,
  children,
}: LocalizedTextProps) => {
  const { t } = useTranslation(ns);
  const translated = t(i18nKey, values);

  return <span>{translated}</span>;
};

export default LocalizedText;
```

### API для локализации

#### API для получения переводов

```typescript
// src/app/api/translations/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";
    const namespace = searchParams.get("namespace") || "common";

    // Проверка поддерживаемых языков
    const SUPPORTED_LOCALES = ["en", "ru", "es", "fr"];
    if (!SUPPORTED_LOCALES.includes(locale)) {
      return NextResponse.json(
        { error: "Unsupported locale" },
        { status: 400 }
      );
    }

    // Загрузка переводов
    try {
      const translationsModule = await import(
        `@/public/locales/${locale}/${namespace}.json`
      );
      const translations = translationsModule.default;

      return NextResponse.json({
        locale,
        namespace,
        translations,
      });
    } catch (error) {
      console.error("Error loading translations:", error);
      return NextResponse.json(
        { error: "Translations not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in translations API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// API для получения всех поддерживаемых языков
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    supportedLocales: ["en", "ru", "es", "fr"],
    defaultLocale: "en",
  });
}
```

### Локализация динамического контента

#### Сервис локализации контента

```typescript
// src/lib/content-localization-service.ts
import { prisma } from "@/lib/db";

export class ContentLocalizationService {
  // Локализация названий и описаний контента
  static async getLocalizedTrack(trackId: string, locale: string = "en") {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        artist: true,
        translations: {
          where: { locale },
        },
      },
    });

    if (!track) return null;

    // Если есть перевод для указанного языка, используем его
    const translation = track.translations[0];
    if (translation) {
      return {
        ...track,
        title: translation.title || track.title,
        description: translation.description || track.description,
      };
    }

    // Иначе возвращаем оригинальный контент
    return track;
  }

  // Локализация NFT
  static async getLocalizedNFT(nftId: string, locale: string = "en") {
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      include: {
        translations: {
          where: { locale },
        },
      },
    });

    if (!nft) return null;

    const translation = nft.translations[0];
    if (translation) {
      return {
        ...nft,
        name: translation.name || nft.name,
        description: translation.description || nft.description,
      };
    }

    return nft;
  }

  // Сохранение переводов
  static async saveTranslation(
    resourceId: string,
    resourceType: "track" | "nft" | "user",
    locale: string,
    translations: { [key: string]: string }
  ) {
    // В реальном приложении: проверка прав доступа и валидация
    await prisma.translation.upsert({
      where: {
        resourceId_locale_resourceType: {
          resourceId,
          locale,
          resourceType,
        },
      },
      update: {
        ...translations,
        updatedAt: new Date(),
      },
      create: {
        resourceId,
        resourceType,
        locale,
        ...translations,
      },
    });
  }

  // Получение доступных переводов для ресурса
  static async getAvailableTranslations(
    resourceId: string,
    resourceType: "track" | "nft" | "user"
  ) {
    const translations = await prisma.translation.findMany({
      where: { resourceId, resourceType },
    });

    return translations.map((t) => t.locale);
  }
}
```

### Поддержка RTL языков

#### Утилита для определения направления текста

```typescript
// src/lib/rtl-utils.ts
const RTL_LANGUAGES = [
  "ar",
  "he",
  "fa",
  "ur",
  "ku",
  "dv",
  "ha",
  "ps",
  "sd",
  "ug",
  "yi",
];

export function isRTL(locale: string): boolean {
  const languageCode = locale.split("-")[0];
  return RTL_LANGUAGES.includes(languageCode);
}

export function getDirection(locale: string): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}

// Пример использования в компоненте
export function applyDirectionToDocument(locale: string) {
  if (typeof document !== "undefined") {
    document.dir = getDirection(locale);
  }
}
```

## Риски и меры по их снижению

### Риск 1: Низкое качество переводов

- **Мера**: Профессиональные переводчики
- **Мера**: Культурная адаптация

### Риск 2: Проблемы с производительностью

- **Мера**: Кэширование переводов
- **Мера**: Ленивая загрузка

### Риск 3: Проблемы с RTL языками

- **Мера**: Тестирование на RTL языках
- **Мера**: Адаптация интерфейса

## Критерии успеха

- Поддержка основных международных языков
- Качественные переводы
- Удобное переключение языков
- Правильное отображение RTL языков
- Удовлетворенность международных пользователей

## Ресурсы

- 1-2 разработчика на 9 недель
- Профессиональные переводчики для основных языков
- Тестировщики для международных рынков

## Сроки

- Начало: 15 ноября 2025
- Завершение: 10 января 2026
- Общее время: 9 недель

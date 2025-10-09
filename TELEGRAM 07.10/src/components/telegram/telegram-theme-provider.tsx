"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

interface TelegramTheme {
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
  headerBgColor: string;
  accentTextColor: string;
  destructiveColor: string;
  successColor: string;
}

interface TelegramThemeContextType {
  theme: TelegramTheme;
  isDark: boolean;
  ready: boolean;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
}

const TelegramThemeContext = createContext<
  TelegramThemeContextType | undefined
>(undefined);

export function TelegramThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TelegramTheme>({
    bgColor: "#ffffff",
    textColor: "#000000",
    hintColor: "#999999",
    linkColor: "#2481cc",
    buttonColor: "#2481cc",
    buttonTextColor: "#ffffff",
    secondaryBgColor: "#f0f0f0",
    headerBgColor: "#ffffff",
    accentTextColor: "#2481cc",
    destructiveColor: "#ff3b30",
    successColor: "#34c759",
  });
  const [isDark, setIsDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();

      // Set initial theme
      const themeParams = tg.themeParams;
      if (themeParams) {
        setTheme({
          bgColor: themeParams.bg_color || "#ffffff",
          textColor: themeParams.text_color || "#000000",
          hintColor: themeParams.hint_color || "#999999",
          linkColor: themeParams.link_color || "#2481cc",
          buttonColor: themeParams.button_color || "#2481cc",
          buttonTextColor: themeParams.button_text_color || "#ffffff",
          secondaryBgColor: themeParams.secondary_bg_color || "#f0f0f0",
          headerBgColor: themeParams.header_bg_color || "#ffffff",
          accentTextColor: themeParams.accent_text_color || "#2481cc",
          destructiveColor: themeParams.destructive_text_color || "#ff3b30",
          successColor: "#34c759",
        });
      }

      setIsDark(tg.colorScheme === "dark");
      setReady(true);

      // Listen for theme changes
      const handleThemeChange = () => {
        if (tg.themeParams) {
          setTheme({
            bgColor: tg.themeParams.bg_color || "#ffffff",
            textColor: tg.themeParams.text_color || "#000000",
            hintColor: tg.themeParams.hint_color || "#999999",
            linkColor: tg.themeParams.link_color || "#2481cc",
            buttonColor: tg.themeParams.button_color || "#2481cc",
            buttonTextColor: tg.themeParams.button_text_color || "#ffffff",
            secondaryBgColor: tg.themeParams.secondary_bg_color || "#f0f0f0",
            headerBgColor: tg.themeParams.header_bg_color || "#ffffff",
            accentTextColor: tg.themeParams.accent_text_color || "#2481cc",
            destructiveColor:
              tg.themeParams.destructive_text_color || "#ff3b30",
            successColor: "#34c759",
          });
          setIsDark(tg.colorScheme === "dark");
        }
      };

      window.addEventListener("themechange", handleThemeChange);

      return () => {
        window.removeEventListener("themechange", handleThemeChange);
      };
    } else {
      // Fallback for web browsers
      setReady(true);
    }
  }, []);

  const expand = () => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  };

  const close = () => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  const setHeaderColor = (color: string) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.setHeaderColor(color);
    }
  };

  const setBackgroundColor = (color: string) => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      window.Telegram.WebApp.setBackgroundColor(color);
    }
  };

  return (
    <TelegramThemeContext.Provider
      value={{
        theme,
        isDark,
        ready,
        expand,
        close,
        setHeaderColor,
        setBackgroundColor,
      }}
    >
      <div
        className="telegram-theme-provider"
        style={{
          backgroundColor: theme.bgColor,
          color: theme.textColor,
        }}
      >
        {children}
      </div>
    </TelegramThemeContext.Provider>
  );
}

export function useTelegramTheme() {
  const context = useContext(TelegramThemeContext);
  if (context === undefined) {
    throw new Error(
      "useTelegramTheme must be used within a TelegramThemeProvider"
    );
  }
  return context;
}

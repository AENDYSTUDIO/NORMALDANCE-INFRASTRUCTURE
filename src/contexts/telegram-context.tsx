"use client";

import { useToast } from "@/hooks/use-toast";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

interface TelegramContextType {
  isTMA: boolean;
  tgWebApp: any;
  theme: "light" | "dark";
  colorScheme: any;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableVerticalSwipes: () => void;
  disableVerticalSwipes: () => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  showPopup: (params: any, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (
    message: string,
    callback?: (confirmed: boolean) => void
  ) => void;
  showScanQrPopup: (params: any, callback?: (text: string) => void) => void;
  closeScanQrPopup: () => void;
  showToast: (message: string, variant?: "default" | "destructive") => void;
  hapticFeedback: (type?: "impact" | "notification" | "selection") => void;
  // Enhanced methods for better performance
  initData?: any;
  user?: any;
  version?: string;
  platform?: string;
}

const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isTMA, setIsTMA] = useState(false);
  const [tgWebApp, setTgWebApp] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colorScheme, setColorScheme] = useState<any>(null);
  const [initData, setInitData] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [version, setVersion] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const initTelegram = async () => {
      // Check if we're in Telegram Mini App environment
      if (typeof window !== "undefined" && window.Telegram?.WebApp) {
        try {
          const tg = window.Telegram.WebApp;

          // Initialize Telegram WebApp with performance optimizations
          tg.ready();
          tg.expand();
          tg.setHeaderColor(tg.themeParams.bg_color || "#1c1c1c");
          tg.setBackgroundColor(tg.themeParams.bg_color || "#1c1c1c");

          // Set state with performance optimization
          setIsTMA(true);
          setTgWebApp(tg);
          setTheme(tg.colorScheme || "light");
          setColorScheme(tg.themeParams);
          setInitData(tg.initData);
          setUser(tg.initDataUnsafe?.user);
          setVersion(tg.version);
          setPlatform(tg.platform);

          // Optimize theme change handling with debouncing
          let themeTimeout: NodeJS.Timeout;
          const handleThemeChanged = () => {
            clearTimeout(themeTimeout);
            themeTimeout = setTimeout(() => {
              setTheme(tg.colorScheme || "light");
              setColorScheme(tg.themeParams);
            }, 100);
          };

          tg.onEvent("themeChanged", handleThemeChanged);

          // Cleanup function
          return () => {
            clearTimeout(themeTimeout);
            tg.offEvent("themeChanged", handleThemeChanged);
          };
        } catch (error) {
          console.error("Failed to initialize Telegram WebApp:", error);
        }
      }
    };

    initTelegram();
  }, []);

  const showToast = useCallback(
    (
      message: string,
      variant: "default" | "destructive" = "default"
    ) => {
      // Use native Telegram toast when available
      if (isTMA && tgWebApp?.showAlert) {
        tgWebApp.showAlert(message);
      } else {
        // Fallback to UI toast
        toast({
          title: message,
          variant,
        });
      }
    },
    [isTMA, tgWebApp, toast]
  );

  const hapticFeedback = useCallback(
    (type: "impact" | "notification" | "selection" = "impact") => {
      if (isTMA && tgWebApp?.HapticFeedback) {
        try {
          switch (type) {
            case "impact":
              tgWebApp.HapticFeedback.impactOccurred("medium");
              break;
            case "notification":
              tgWebApp.HapticFeedback.notificationOccurred("success");
              break;
            case "selection":
              tgWebApp.HapticFeedback.selectionChanged();
              break;
          }
        } catch (error) {
          console.warn("Haptic feedback not available:", error);
        }
      }
    },
    [isTMA, tgWebApp]
  );

  // Memoize context value for performance
  const contextValue: TelegramContextType = {
    isTMA,
    tgWebApp,
    theme,
    colorScheme,
    initData,
    user,
    version,
    platform,
    ready: useCallback(() => tgWebApp?.ready(), [tgWebApp]),
    expand: useCallback(() => tgWebApp?.expand(), [tgWebApp]),
    close: useCallback(() => tgWebApp?.close(), [tgWebApp]),
    enableVerticalSwipes: useCallback(() => tgWebApp?.enableVerticalSwipes(), [tgWebApp]),
    disableVerticalSwipes: useCallback(() => tgWebApp?.disableVerticalSwipes(), [tgWebApp]),
    enableClosingConfirmation: useCallback(() => tgWebApp?.enableClosingConfirmation(), [tgWebApp]),
    disableClosingConfirmation: useCallback(() => tgWebApp?.disableClosingConfirmation(), [tgWebApp]),
    showPopup: useCallback((params, callback) => tgWebApp?.showPopup(params, callback), [tgWebApp]),
    showAlert: useCallback((message, callback) => tgWebApp?.showAlert(message, callback), [tgWebApp]),
    showConfirm: useCallback((message, callback) => tgWebApp?.showConfirm(message, callback), [tgWebApp]),
    showScanQrPopup: useCallback((params, callback) => tgWebApp?.showScanQrPopup(params, callback), [tgWebApp]),
    closeScanQrPopup: useCallback(() => tgWebApp?.closeScanQrPopup(), [tgWebApp]),
    showToast,
    hapticFeedback,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error("useTelegram must be used within a TelegramProvider");
  }
  return context;
}

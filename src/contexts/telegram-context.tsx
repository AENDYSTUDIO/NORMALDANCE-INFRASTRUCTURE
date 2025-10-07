"use client";

import { useToast } from "@/hooks/use-toast";
import React, { createContext, useContext, useEffect, useState } from "react";

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
}

const TelegramContext = createContext<TelegramContextType | undefined>(
  undefined
);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isTMA, setIsTMA] = useState(false);
  const [tgWebApp, setTgWebApp] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colorScheme, setColorScheme] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      // Initialize Telegram WebApp
      tg.ready();
      tg.expand();

      setIsTMA(true);
      setTgWebApp(tg);
      setTheme(tg.colorScheme || "light");
      setColorScheme(tg.themeParams);

      // Listen for theme changes
      const handleThemeChanged = () => {
        setTheme(tg.colorScheme || "light");
        setColorScheme(tg.themeParams);
      };

      tg.onEvent("themeChanged", handleThemeChanged);

      return () => {
        tg.offEvent("themeChanged", handleThemeChanged);
      };
    }
  }, []);

  const showToast = (
    message: string,
    variant: "default" | "destructive" = "default"
  ) => {
    toast({
      title: message,
      variant,
    });
  };

  const hapticFeedback = (
    type: "impact" | "notification" | "selection" = "impact"
  ) => {
    if (isTMA && tgWebApp?.HapticFeedback) {
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
    }
  };

  const contextValue: TelegramContextType = {
    isTMA,
    tgWebApp,
    theme,
    colorScheme,
    ready: () => tgWebApp?.ready(),
    expand: () => tgWebApp?.expand(),
    close: () => tgWebApp?.close(),
    enableVerticalSwipes: () => tgWebApp?.enableVerticalSwipes(),
    disableVerticalSwipes: () => tgWebApp?.disableVerticalSwipes(),
    enableClosingConfirmation: () => tgWebApp?.enableClosingConfirmation(),
    disableClosingConfirmation: () => tgWebApp?.disableClosingConfirmation(),
    showPopup: (params, callback) => tgWebApp?.showPopup(params, callback),
    showAlert: (message, callback) => tgWebApp?.showAlert(message, callback),
    showConfirm: (message, callback) =>
      tgWebApp?.showConfirm(message, callback),
    showScanQrPopup: (params, callback) =>
      tgWebApp?.showScanQrPopup(params, callback),
    closeScanQrPopup: () => tgWebApp?.closeScanQrPopup(),
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

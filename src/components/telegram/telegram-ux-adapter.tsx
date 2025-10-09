"use client";

import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import React, { useEffect, useState } from "react";

interface TelegramUXAdapterProps {
  children: React.ReactNode;
  className?: string;
}

export function TelegramUXAdapter({
  children,
  className,
}: TelegramUXAdapterProps) {
  const [tgWebApp, setTgWebApp] = useState<any>(null);
  const [isTMA, setIsTMA] = useState(false);
  const { toast } = useToast();

  // Check if we're in Telegram Mini App
  useEffect(() => {
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      setIsTMA(true);
      setTgWebApp(window.Telegram.WebApp);

      // Initialize Telegram WebApp
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      // Set theme based on Telegram theme
      document.documentElement.setAttribute(
        "data-theme",
        tg.colorScheme || "light"
      );

      // Set custom CSS variables for Telegram theme
      const themeParams = tg.themeParams;
      if (themeParams) {
        const root = document.documentElement;
        root.style.setProperty(
          "--tg-bg-color",
          themeParams.bg_color || "#ffffff"
        );
        root.style.setProperty(
          "--tg-text-color",
          themeParams.text_color || "#000000"
        );
        root.style.setProperty(
          "--tg-hint-color",
          themeParams.hint_color || "#999999"
        );
        root.style.setProperty(
          "--tg-link-color",
          themeParams.link_color || "#2481cc"
        );
        root.style.setProperty(
          "--tg-button-color",
          themeParams.button_color || "#2481cc"
        );
        root.style.setProperty(
          "--tg-button-text-color",
          themeParams.button_text_color || "#ffffff"
        );
      }
    }
  }, []);

  // Show toast notification
  const showToast = (
    message: string,
    variant: "default" | "destructive" = "default"
  ) => {
    toast({
      title: message,
      variant,
    });
  };

  // Show confirmation dialog
  const showConfirm = (
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    if (isTMA && tgWebApp) {
      tgWebApp.showConfirm(message, (confirmed: boolean) => {
        if (confirmed) {
          onConfirm();
        } else if (onCancel) {
          onCancel();
        }
      });
    } else {
      // Fallback for web browsers
      if (window.confirm(message)) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    }
  };

  // Show popup dialog
  const showPopup = (
    title: string,
    message: string,
    buttons: { id: string; type: string; text: string }[]
  ) => {
    if (isTMA && tgWebApp) {
      tgWebApp.showPopup({
        title,
        message,
        buttons,
      });
    } else {
      // Fallback for web browsers
      alert(
        `${title}\n\n${message}\n\n${buttons.map((b) => b.text).join(", ")}`
      );
    }
  };

  // Haptic feedback
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

  // Context value
  const telegramContext = {
    isTMA,
    tgWebApp,
    showToast,
    showConfirm,
    showPopup,
    hapticFeedback,
  };

  return (
    <div className={`telegram-ux-adapter ${className || ""}`}>
      {children}
      <Toaster />

      <style jsx global>{`
        /* Global styles for Telegram UX Adapter */
        :root {
          --tg-bg-color: #ffffff;
          --tg-text-color: #000000;
          --tg-hint-color: #999999;
          --tg-link-color: #2481cc;
          --tg-button-color: #2481cc;
          --tg-button-text-color: #ffffff;
          --tg-secondary: #9c27b0;
        }

        html[data-theme="dark"] {
          --tg-bg-color: #1c1c1c;
          --tg-text-color: #ffffff;
          --tg-hint-color: #aaaaaa;
          --tg-link-color: #4da6ff;
          --tg-button-color: #4da6ff;
          --tg-button-text-color: #000000;
          --tg-secondary: #e91e63;
        }

        /* Apply Telegram theme to body */
        body {
          background-color: var(--tg-bg-color);
          color: var(--tg-text-color);
        }

        /* Theme-aware components */
        .telegram-themed-input {
          background-color: var(--tg-bg-color);
          color: var(--tg-text-color);
          border-color: var(--tg-hint-color);
        }

        .telegram-themed-button {
          background-color: var(--tg-button-color);
          color: var(--tg-button-text-color);
        }

        .telegram-themed-link {
          color: var(--tg-link-color);
        }

        /* Focus states for accessibility */
        .telegram-themed-input:focus,
        .telegram-themed-button:focus {
          outline: 2px solid var(--tg-button-color);
          outline-offset: 2px;
        }

        /* Responsive adjustments for Telegram Mini Apps */
        @media (max-width: 480px) {
          .telegram-ux-adapter {
            padding: 8px;
          }

          /* Adjust button sizes for mobile */
          .telegram-themed-button {
            padding: 10px 16px;
            font-size: 14px;
          }
        }

        /* Dark theme overrides */
        html[data-theme="dark"] .telegram-themed-input {
          border-color: #444444;
        }

        html[data-theme="dark"] .telegram-themed-button {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

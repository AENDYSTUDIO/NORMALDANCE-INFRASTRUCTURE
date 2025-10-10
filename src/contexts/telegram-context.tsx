'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface TelegramContextType {
  webApp: any
  user: any
  isReady: boolean
  theme: 'light' | 'dark'
  isTMA: boolean
}

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined)

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [webApp, setWebApp] = useState<any>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isTMA, setIsTMA] = useState(false)

  useEffect(() => {
    // Production-ready Telegram WebApp initialization
    const initTelegramWebApp = () => {
      // Check if we're in Telegram environment
      if (typeof window !== 'undefined' && window.Telegram) {
        try {
          const tg = window.Telegram.WebApp
  
          // Set up WebApp initialization
          tg.ready(() => {
            console.log('Telegram WebApp is ready');
            setIsReady(true);
          });
          
          // Set up theme
          tg.enableClosingConfirmation();
          
          // Initialize default theme
          setTheme(tg.colorScheme || 'light');
          
          // Expand to full screen
          tg.expand();
  
          // Get user data if available
          const userData = tg.initDataUnsafe;
          if (userData.user) {
            setUser(userData.user);
          }
          
          // Detect if running as Mini App
          const urlParams = new URLSearchParams(window.location.search);
          const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
          setIsTMA(!!tgWebAppStartParam);
  
          // Set up WebApp reference
          setWebApp(tg);
  
        } catch (error) {
          console.error('Error initializing Telegram WebApp:', error);
          // Fall back to mock for development
          initMockTelegram();
        }
      } else {
        // Development environment - use mock
        initMockTelegram();
      }
    };

    const initMockTelegram = () => {
      console.log('Using mock Telegram WebApp for development');
      setWebApp({
        ready: () => {},
        expand: () => {},
        close: () => {},
        MainButton: { 
          text: '', 
          isVisible: false,
          onClick: () => {}
        },
        colorScheme: 'light',
        themeParams: {
          bg_color: '#ffffff'
        },
        BackButton: {
          isVisible: false,
          onClick: () => {}
        },
        HapticFeedback: {
          impactOccurred: (style: 'medium') => {
            console.log(`Haptic feedback: ${style}`);
          }
        },
        popup: {
          open: () => {},
          close: () => {}
        }
      });
      setUser({
        id: 12345,
        first_name: 'Demo User',
        username: 'demouser',
        is_premium: true
      });
      setIsReady(true);
      setTheme('light');
    };

    initTelegramWebApp();
  }, []);

  const value: TelegramContextType = {
    webApp,
    user,
    isReady,
    theme,
    isTMA
  };

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

export function useTelegram() {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider')
  }
  return context
}

export { TelegramContext }

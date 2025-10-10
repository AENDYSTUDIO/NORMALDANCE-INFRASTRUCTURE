import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Сегодня'
  } else if (diffInDays === 1) {
    return 'Вчера'
  } else if (diffInDays < 7) {
    return `${diffInDays} дня назад`
  } else if (diffInDays < 30) {
    return `${Math.floor(diffInDays / 7)} нед. назад`
  } else if (diffInDays < 365) {
    return `${Math.floor(diffInDays / 30)} мес. назад`
  } else {
    return `${Math.floor(diffInDays / 365)} г. назад`
  }
}

export function isMobile(): boolean {
  // Только клиентская проверка для избежания SSR проблем
  if (typeof window === 'undefined') {
    return false; // На сервере всегда false
  }
  
  // Клиентская проверка
  const userAgent = navigator.userAgent;
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isMobileWidth = window.innerWidth <= 768;
  
  return isMobileUA || isMobileWidth;
}

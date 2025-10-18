import { useState, useEffect } from 'react';

// Определяем типы для информации о сети, чтобы избежать ошибок TypeScript
interface CustomNavigator extends Navigator {
  connection?: {
    effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    saveData?: boolean;
    addEventListener: (type: string, listener: EventListener) => void;
    removeEventListener: (type: string, listener: EventListener) => void;
  };
}

const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [effectiveType, setEffectiveType] = useState('4g');
  const [isMobile, setIsMobile] = useState(false);
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    // Определяем, является ли устройство мобильным
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
      const tabletRegex = /android|ipad|playbook|silk/i;
      
      setIsMobile(
        mobileRegex.test(userAgent) || 
        (tabletRegex.test(userAgent) && window.innerWidth < 1024)
      );
    };

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionStatus = () => {
      const connection = (navigator as CustomNavigator).connection;
      if (connection) {
        if (connection.effectiveType) {
          setEffectiveType(connection.effectiveType);
        }
        if (connection.saveData !== undefined) {
          setSaveData(connection.saveData);
        }
      }
    };

    // Устанавливаем начальные значения
    checkMobile();
    updateOnlineStatus();
    updateConnectionStatus();

    // Добавляем слушатели событий
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('resize', checkMobile);
    
    const connection = (navigator as CustomNavigator).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionStatus);
    }

    // Очистка при размонтировании компонента
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('resize', checkMobile);
      if (connection) {
        connection.removeEventListener('change', updateConnectionStatus);
      }
    };
  }, []);
  
  return { isOnline, effectiveType, isMobile, saveData };

  return { isOnline, effectiveType };
};

export default useNetworkStatus;

import React, { useState, useEffect } from 'react';
import { useInvisibleWallet } from './invisible-wallet-provider';
import { formatSolAmount } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Типы для компонента
interface MinimalWalletUIProps {
  showBalance?: boolean;
  showConnectionStatus?: boolean;
  compact?: boolean;
  className?: string;
  onWalletClick?: () => void;
}

// Компонент минимального UI для отображения состояния кошелька
export const MinimalWalletUI: React.FC<MinimalWalletUIProps> = ({
  showBalance = true,
  showConnectionStatus = true,
  compact = false,
  className = '',
  onWalletClick,
}) => {
  const { state } = useInvisibleWallet();
  const [isHovered, setIsHovered] = useState(false);

  // Обработка отображения публичного ключа
  const truncatePublicKey = (key: string | null) => {
    if (!key) return '';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

 // Определение статуса подключения
  const getConnectionStatus = () => {
    if (state.offlineMode) {
      return { status: 'offline', label: 'Оффлайн режим', color: 'text-yellow-500' };
    }
    if (state.connected) {
      return { status: 'connected', label: 'Подключен', color: 'text-green-500' };
    }
    if (state.connecting) {
      return { status: 'connecting', label: 'Подключение...', color: 'text-blue-500' };
    }
    return { status: 'disconnected', label: 'Отключен', color: 'text-gray-500' };
  };

  const connectionStatus = getConnectionStatus();

  // Эффект для автоматического скрытия элемента при определенных условиях
  useEffect(() => {
    if (state.offlineMode && !isHovered) {
      // В оффлайн режиме может потребоваться особое поведение
      console.log('Wallet is in offline mode');
    }
  }, [state.offlineMode, isHovered]);

  // Если все элементы скрыты, не отображаем компонент
 if (!showBalance && !showConnectionStatus) {
    return null;
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-200',
        compact ? 'text-xs' : 'text-sm',
        state.offlineMode ? 'bg-yellow-500/10' : state.connected ? 'bg-green-500/10' : 'bg-gray-500/10',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onWalletClick}
    >
      {/* Индикатор подключения */}
      {showConnectionStatus && (
        <Tooltip content={connectionStatus.label}>
          <div className="flex items-center">
            <div className={cn(
              'w-2 h-2 rounded-full mr-1',
              connectionStatus.color.replace('text-', 'bg-'),
              state.connecting && 'animate-pulse'
            )} />
            {!compact && (
              <span className={cn('font-medium', connectionStatus.color)}>
                {state.publicKey ? truncatePublicKey(state.publicKey.toString()) : 'Кошелек'}
              </span>
            )}
          </div>
        </Tooltip>
      )}

      {/* Отображение баланса */}
      {showBalance && state.balance !== null && (
        <Tooltip content={`Баланс: ${state.balance} SOL`}>
          <div className="flex items-center">
            <span className="font-mono">
              {formatSolAmount(state.balance)} SOL
            </span>
          </div>
        </Tooltip>
      )}

      {/* Индикатор оффлайн режима */}
      {state.offlineMode && (
        <Tooltip content="Работа в оффлайн режиме. Некоторые функции могут быть ограничены.">
          <div className="text-xs bg-yellow-500/20 px-1.5 py-0.5 rounded text-yellow-700">
            OFF
          </div>
        </Tooltip>
      )}
    </div>
  );
};

// Компонент для отображения уведомлений о важных событиях
interface WalletNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const WalletNotification: React.FC<WalletNotificationProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible) return null;

  const typeStyles = {
    success: 'bg-green-500/10 border-green-500/30 text-green-700',
    error: 'bg-red-500/10 border-red-50/30 text-red-700',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  };

  return (
    <div className={cn(
      'fixed bottom-4 right-4 p-4 rounded-lg border max-w-sm shadow-lg z-50',
      typeStyles[type]
    )}>
      <div className="flex items-start">
        <div className="flex-1">
          <p className="text-sm">{message}</p>
        </div>
        <button 
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          className="ml-2 text-current hover:opacity-70"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Компонент индикатора активности
export const WalletActivityIndicator: React.FC = () => {
  const { state } = useInvisibleWallet();
  
  if (!state.connecting && state.lastUpdated === null) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-black/80 text-white px-3 py-2 rounded-lg">
      <div className={cn(
        'w-2 h-2 rounded-full',
        state.connecting ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
      )} />
      <span className="text-xs">
        {state.connecting ? 'Подключение...' : `Обновлено: ${state.lastUpdated?.toLocaleTimeString()}`}
      </span>
    </div>
  );
};
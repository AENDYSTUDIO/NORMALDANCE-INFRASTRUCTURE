import React, { useState, useEffect, useCallback } from 'react';
import { useInvisibleWallet } from './invisible-wallet-provider';
import { useInvisibleBalance, useInvisibleTransaction, useInvisibleAuth, useInvisibleWalletEvents } from '@/lib/wallet/invisible-wallet-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TransactionHistory } from './invisible-transaction-ui';
import { walletEmitter } from './wallet-adapter';
import { cn } from '@/lib/utils';

// Типы для настроек
interface WalletSettings {
  autoConnect: boolean;
  notificationsEnabled: boolean;
  offlineModeAllowed: boolean;
  transactionConfirmations: boolean;
  privacyMode: boolean;
}

// Типы для безопасности
interface SecuritySettings {
  autoLockTimeout: number; // в минутах
  requirePassword: boolean;
  biometricAuth: boolean;
  transactionLimits: {
    daily: number;
    perTransaction: number;
  };
}

// Компонент скрытой панели управления невидимым кошельком
export const InvisibleWalletDashboard: React.FC = () => {
  const { state, setOfflineMode } = useInvisibleWallet();
  const { balance, refresh: refreshBalance } = useInvisibleBalance();
  const { transactions } = useInvisibleTransaction();
  const { isAuthenticated, signOut } = useInvisibleAuth();
  const { events, clearEvents } = useInvisibleWalletEvents();
  
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security' | 'history'>('overview');
  const [settings, setSettings] = useState<WalletSettings>({
    autoConnect: true,
    notificationsEnabled: true,
    offlineModeAllowed: true,
    transactionConfirmations: true,
    privacyMode: false,
  });
  
  const [security, setSecurity] = useState<SecuritySettings>({
    autoLockTimeout: 30,
    requirePassword: false,
    biometricAuth: false,
    transactionLimits: {
      daily: 10,
      perTransaction: 5,
    }
  });

  // Показ панели по специальному жесту (например, тройной клик на определенный элемент)
  const handleSpecialGesture = useCallback((e: MouseEvent) => {
    // Реализация специального жеста для открытия панели
    // В реальной реализации это может быть тройной клик, долгое нажатие или комбинация клавиш
    const target = e.target as HTMLElement;
    if (target.classList.contains('wallet-dashboard-trigger')) {
      setIsVisible(true);
    }
  }, []);

  // Добавляем глобальный обработчик для специального жеста
  useEffect(() => {
    document.addEventListener('click', handleSpecialGesture);
    return () => {
      document.removeEventListener('click', handleSpecialGesture);
    };
  }, [handleSpecialGesture]);

  // Обработка клавиатурных комбинаций
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Комбинация Ctrl+Alt+W для открытия панели
      if (e.ctrlKey && e.altKey && e.key === 'w') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Обновление баланса при отображении панели
  useEffect(() => {
    if (isVisible && state.connected) {
      refreshBalance();
    }
  }, [isVisible, state.connected, refreshBalance]);

  // Обработка изменения настроек
  const handleSettingsChange = (key: keyof WalletSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    
    // Включаем/выключаем оффлайн режим
    if (key === 'offlineModeAllowed') {
      setOfflineMode(value);
    }
  };

  // Обработка изменения настроек безопасности
  const handleSecurityChange = (key: keyof SecuritySettings, value: any) => {
    setSecurity(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Обработка изменения лимитов транзакций
  const handleTransactionLimitChange = (key: keyof SecuritySettings['transactionLimits'], value: number) => {
    setSecurity(prev => ({
      ...prev,
      transactionLimits: {
        ...prev.transactionLimits,
        [key]: value
      }
    }));
  };

  // Сохранение настроек
  const saveSettings = () => {
    // В реальной реализации сохраняем настройки в localStorage или на сервере
    localStorage.setItem('invisibleWalletSettings', JSON.stringify(settings));
    localStorage.setItem('invisibleWalletSecurity', JSON.stringify(security));
    walletEmitter.emit('invisibleWallet:settingsChanged', { settings, security });
  };

  // Загрузка настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem('invisibleWalletSettings');
    const savedSecurity = localStorage.getItem('invisibleWalletSecurity');
    
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    if (savedSecurity) {
      setSecurity(JSON.parse(savedSecurity));
    }
  }, []);

  // Форматирование даты для отображения
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Отображение панели только если она видима
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={cn("w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col", 
        settings.privacyMode ? "bg-gray-900" : "bg-white")}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Панель управления невидимым кошельком</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            Закрыть (Esc)
          </Button>
        </CardHeader>
        
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Навигация */}
          <div className="w-full md:w-48 border-r p-4">
            <nav className="space-y-2">
              {([
                { id: 'overview', label: 'Обзор' },
                { id: 'settings', label: 'Настройки' },
                { id: 'security', label: 'Безопасность' },
                { id: 'history', label: 'История' }
              ] as const).map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </nav>
            
            <div className="mt-8 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">Статус кошелька</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Подключен:</span>
                  <Badge variant={state.connected ? "default" : "destructive"}>
                    {state.connected ? "Да" : "Нет"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Оффлайн режим:</span>
                  <Badge variant={state.offlineMode ? "destructive" : "secondary"}>
                    {state.offlineMode ? "Да" : "Нет"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Баланс:</span>
                  <span>{balance !== null ? `${balance} SOL` : "Загрузка..."}</span>
                </div>
              </div>
            </div>
          
          {/* Контент */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Обзор невидимого кошелька</h2>
                  <p className="text-gray-600">
                    Невидимый кошелек работает в фоновом режиме, обеспечивая автономную работу 
                    Web3 функций без необходимости ручного подключения. Все транзакции и 
                    взаимодействия происходят автоматически с вашей криптографической подписью.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Статистика</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Активные транзакции:</span>
                          <span>{Object.keys(transactions).length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>События в системе:</span>
                          <span>{events.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Последнее обновление:</span>
                          <span>{state.lastUpdated ? formatDate(state.lastUpdated) : "Нет данных"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Быстрые действия</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={refreshBalance}
                        disabled={!state.connected}
                      >
                        Обновить баланс
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearEvents}
                      >
                        Очистить события
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="w-full"
                        onClick={signOut}
                        disabled={!isAuthenticated}
                      >
                        Отключить кошелек
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Настройки невидимого кошелька</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Автоподключение</Label>
                      <p className="text-sm text-gray-500">Автоматически подключать кошелек при запуске</p>
                    </div>
                    <Switch
                      checked={settings.autoConnect}
                      onCheckedChange={(value) => handleSettingsChange('autoConnect', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Уведомления</Label>
                      <p className="text-sm text-gray-500">Показывать уведомления о транзакциях</p>
                    </div>
                    <Switch
                      checked={settings.notificationsEnabled}
                      onCheckedChange={(value) => handleSettingsChange('notificationsEnabled', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Оффлайн режим</Label>
                      <p className="text-sm text-gray-500">Разрешить работу в оффлайн режиме</p>
                    </div>
                    <Switch
                      checked={settings.offlineModeAllowed}
                      onCheckedChange={(value) => handleSettingsChange('offlineModeAllowed', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Подтверждение транзакций</Label>
                      <p className="text-sm text-gray-500">Требовать подтверждение важных транзакций</p>
                    </div>
                    <Switch
                      checked={settings.transactionConfirmations}
                      onCheckedChange={(value) => handleSettingsChange('transactionConfirmations', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Режим конфиденциальности</Label>
                      <p className="text-sm text-gray-500">Уменьшить видимость элементов интерфейса</p>
                    </div>
                    <Switch
                      checked={settings.privacyMode}
                      onCheckedChange={(value) => handleSettingsChange('privacyMode', value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveSettings}>Сохранить настройки</Button>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Настройки безопасности</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label>Таймаут автоблокировки (минуты)</Label>
                    <Input
                      type="number"
                      value={security.autoLockTimeout}
                      onChange={(e) => handleSecurityChange('autoLockTimeout', parseInt(e.target.value))}
                      min="1"
                      max="120"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Требовать пароль</Label>
                      <p className="text-sm text-gray-500">Запрашивать пароль при выполнении транзакций</p>
                    </div>
                    <Switch
                      checked={security.requirePassword}
                      onCheckedChange={(value) => handleSecurityChange('requirePassword', value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Биометрическая аутентификация</Label>
                      <p className="text-sm text-gray-500">Использовать отпечаток пальца или Face ID</p>
                    </div>
                    <Switch
                      checked={security.biometricAuth}
                      onCheckedChange={(value) => handleSecurityChange('biometricAuth', value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Лимиты транзакций</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Ежедневный лимит (SOL)</Label>
                        <Input
                          type="number"
                          value={security.transactionLimits.daily}
                          onChange={(e) => handleTransactionLimitChange('daily', parseFloat(e.target.value))}
                          min="0"
                        />
                      </div>
                      <div>
                        <Label>Одна транзакция (SOL)</Label>
                        <Input
                          type="number"
                          value={security.transactionLimits.perTransaction}
                          onChange={(e) => handleTransactionLimitChange('perTransaction', parseFloat(e.target.value))}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={saveSettings}>Сохранить настройки</Button>
                </div>
              </div>
            )}
            
            {activeTab === 'history' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">История событий</h2>
                <TransactionHistory limit={10} />
                
                <div>
                  <h3 className="font-medium mb-2">Журнал событий</h3>
                  <div className="bg-gray-100 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Нет событий для отображения</p>
                    ) : (
                      <div className="space-y-2">
                        {events.slice(0, 20).map((event, index) => (
                          <div key={index} className="text-sm p-2 bg-white rounded border">
                            <div className="flex justify-between">
                              <span className="font-medium">{event.type}</span>
                              <span className="text-gray-500">{formatDate(event.timestamp)}</span>
                            </div>
                            {event.data && (
                              <div className="mt-1 text-xs text-gray-600">
                                {JSON.stringify(event.data, null, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Компонент-триггер для открытия панели (скрытый элемент)
export const WalletDashboardTrigger: React.FC = () => {
  return (
    <div 
      className="wallet-dashboard-trigger fixed top-0 left-0 w-4 h-4 opacity-0 z-[-1] cursor-default"
      aria-hidden="true"
    />
  );
};
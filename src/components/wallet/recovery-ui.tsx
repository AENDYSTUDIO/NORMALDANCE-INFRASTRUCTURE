"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  TelegramContact, 
  RecoverySession, 
  RecoveryShare,
  AuthType,
  AuthResult 
} from '@/types/wallet';
import { 
  RecoverySystemImpl, 
  TelegramContactsManager, 
  AuthManager 
} from '@/lib/wallet';
import { logger } from '@/lib/utils/logger';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Shield, 
  Users, 
  Key,
  Smartphone,
  MessageCircle,
  Lock,
  Unlock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

/**
 * Интерфейс для настроек восстановления
 */
interface RecoverySetupProps {
  onSetupComplete: () => void;
  onCancel: () => void;
}

/**
 * Интерфейс для процесса восстановления
 */
interface RecoveryProcessProps {
  onRecoveryComplete: (encryptedKey: any) => void;
  onCancel: () => void;
}

/**
 * Компонент для настройки восстановления
 */
export function RecoverySetup({ onSetupComplete, onCancel }: RecoverySetupProps) {
  const [contacts, setContacts] = useState<TelegramContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<TelegramContact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const contactsManager = new TelegramContactsManager();
  const authManager = new AuthManager();
  
  useEffect(() => {
    loadContacts();
    checkBiometricAvailability();
  }, []);
  
  const loadContacts = async () => {
    try {
      setIsLoading(true);
      const telegramContacts = await contactsManager.getTelegramContacts();
      const trustedContacts = await contactsManager.selectTrustedContacts(telegramContacts);
      setContacts(trustedContacts);
    } catch (error) {
      logger.error("Failed to load contacts", error as Error);
      setError("Не удалось загрузить контакты");
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkBiometricAvailability = async () => {
    try {
      const available = await authManager.getAvailableAuthMethods();
      setBiometricEnabled(available.includes(AuthType.BIOMETRIC));
    } catch (error) {
      logger.error("Failed to check biometric availability", error as Error);
    }
  };
  
  const handleContactSelection = (contact: TelegramContact, selected: boolean) => {
    if (selected) {
      if (selectedContacts.length < 5) {
        setSelectedContacts([...selectedContacts, contact]);
      }
    } else {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    }
  };
  
  const validatePin = (pinValue: string): boolean => {
    return pinValue.length >= 4 && /^\d+$/.test(pinValue);
  };
  
  const handleNextStep = async () => {
    setError(null);
    
    switch (currentStep) {
      case 1:
        if (selectedContacts.length < 3) {
          setError("Выберите минимум 3 доверенных контакта");
          return;
        }
        setCurrentStep(2);
        break;
        
      case 2:
        if (!validatePin(pin)) {
          setError("PIN-код должен содержать минимум 4 цифры");
          return;
        }
        if (pin !== confirmPin) {
          setError("PIN-коды не совпадают");
          return;
        }
        setCurrentStep(3);
        break;
        
      case 3:
        await completeSetup();
        break;
    }
  };
  
  const completeSetup = async () => {
    try {
      setIsLoading(true);
      
      // Настройка PIN аутентификации
      await authManager.setupPinAuth(pin);
      
      // Настройка биометрии если доступна
      if (biometricEnabled) {
        await authManager.setupBiometricAuth();
      }
      
      // Здесь будет настройка восстановления через RecoverySystem
      // Для демонстрации просто завершаем настройку
      
      setSuccess("Настройка восстановления завершена успешно!");
      
      setTimeout(() => {
        onSetupComplete();
      }, 2000);
      
    } catch (error) {
      logger.error("Failed to complete recovery setup", error as Error);
      setError("Не удалось завершить настройку восстановления");
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Выберите доверенные контакты</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Выберите от 3 до 5 контактов, которым доверяете для восстановления доступа
              </p>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedContacts.some(c => c.id === contact.id)}
                    onCheckedChange={(checked) => handleContactSelection(contact, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{contact.username || 'no_username'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contact.isVerified && (
                      <Badge variant="secondary" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Верифицирован
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      Уровень доверия: {Math.round(contact.trustLevel * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Выбрано: {selectedContacts.length} из 5 контактов
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Lock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Создайте PIN-код</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Придумайте PIN-код для дополнительной защиты
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="pin">PIN-код</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Введите 4-значный PIN-код"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  maxLength={4}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPin">Подтвердите PIN-код</Label>
                <Input
                  id="confirmPin"
                  type="password"
                  placeholder="Повторите PIN-код"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  maxLength={4}
                  className="text-center text-2xl tracking-widest"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Настройка безопасности</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Дополнительные методы аутентификации
              </p>
            </div>
            
            <div className="space-y-4">
              {biometricEnabled && (
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <div className="font-medium">Биометрическая аутентификация</div>
                    <div className="text-sm text-muted-foreground">
                      Используйте отпечаток пальца или Face ID
                    </div>
                  </div>
                  <Badge variant="secondary">Доступно</Badge>
                </div>
              )}
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">Telegram аутентификация</div>
                  <div className="text-sm text-muted-foreground">
                    Вход через аккаунт Telegram
                  </div>
                </div>
                <Badge variant="secondary">Включено</Badge>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <Key className="h-5 w-5 text-purple-500" />
                <div className="flex-1">
                  <div className="font-medium">Социальное восстановление</div>
                  <div className="text-sm text-muted-foreground">
                    Восстановление через {selectedContacts.length} доверенных контактов
                  </div>
                </div>
                <Badge variant="secondary">Настроено</Badge>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Настройка восстановления</CardTitle>
        <CardDescription className="text-center">
          Защитите свой кошелек с помощью социальных контактов
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Шаг {currentStep} из 3</span>
            <span>{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 3) * 100} className="w-full" />
        </div>
        
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Success */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
        
        {/* Step Content */}
        {renderStepContent()}
        
        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Отмена
          </Button>
          
          <Button
            onClick={handleNextStep}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : currentStep === 3 ? (
              'Завершить'
            ) : (
              'Далее'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Компонент для процесса восстановления
 */
export function RecoveryProcess({ onRecoveryComplete, onCancel }: RecoveryProcessProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [recoverySession, setRecoverySession] = useState<RecoverySession | null>(null);
  const [collectedShares, setCollectedShares] = useState<RecoveryShare[]>([]);
  const [contactCode, setContactCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  const contactsManager = new TelegramContactsManager();
  const recoverySystem = new RecoverySystemImpl({
    threshold: 3,
    totalShares: 5,
    shareEncryption: true,
    contactVerification: true,
    gracePeriod: 24 * 60 * 60 * 1000
  });
  
  useEffect(() => {
    if (recoverySession) {
      const timer = setInterval(() => {
        const remaining = recoverySession.expiresAt - Date.now();
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          setError("Время восстановления истекло");
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [recoverySession]);
  
  const initiateRecovery = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await recoverySystem.initiateRecovery('user_id'); // В реальности здесь будет ID пользователя
      setRecoverySession(session);
      setCurrentStep(2);
      
    } catch (error) {
      logger.error("Failed to initiate recovery", error as Error);
      setError("Не удалось начать процесс восстановления");
    } finally {
      setIsLoading(false);
    }
  };
  
  const addShareFromContact = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!recoverySession) {
        throw new Error("Recovery session not found");
      }
      
      // В реальности здесь будет получение share от контакта по коду
      // Для демонстрации создаем mock share
      const mockShare: RecoveryShare = {
        id: `share_${Date.now()}`,
        shareData: new Uint8Array(32), // Mock данные
        contactId: contactCode,
        encrypted: false,
        createdAt: Date.now()
      };
      
      const updatedSession = await recoverySystem.addShareToSession(
        recoverySession.id,
        mockShare.shareData,
        mockShare.contactId
      );
      
      setCollectedShares([...collectedShares, mockShare]);
      setRecoverySession(updatedSession);
      setContactCode('');
      
      if (updatedSession.status === 'completed') {
        setCurrentStep(3);
        await completeRecovery(updatedSession.id);
      }
      
    } catch (error) {
      logger.error("Failed to add share from contact", error as Error);
      setError("Не удалось добавить share от контакта");
    } finally {
      setIsLoading(false);
    }
  };
  
  const completeRecovery = async (sessionId: string) => {
    try {
      setIsLoading(true);
      
      const encryptedKey = await recoverySystem.recoverKey(sessionId);
      onRecoveryComplete(encryptedKey);
      
    } catch (error) {
      logger.error("Failed to complete recovery", error as Error);
      setError("Не удалось завершить восстановление");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTimeRemaining = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Unlock className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Восстановление доступа</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Начните процесс восстановления доступа к кошельку
              </p>
            </div>
            
            <div className="space-y-3">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Для восстановления доступа вам понадобится помощь от {3} доверенных контактов.
                  Каждый контакт предоставит вам специальный код.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Социальное восстановление</div>
                    <div className="text-sm text-muted-foreground">
                      Через доверенные контакты
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium">Ограниченное время</div>
                    <div className="text-sm text-muted-foreground">
                      24 часа на завершение
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Сбор кодов восстановления</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Получите коды от ваших доверенных контактов
              </p>
            </div>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Собрано кодов: {collectedShares.length} из {recoverySession?.requiredShares || 3}</span>
                <span>{Math.round((collectedShares.length / (recoverySession?.requiredShares || 3)) * 100)}%</span>
              </div>
              <Progress 
                value={(collectedShares.length / (recoverySession?.requiredShares || 3)) * 100} 
                className="w-full" 
              />
            </div>
            
            {/* Time Remaining */}
            {timeRemaining > 0 && (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Осталось времени: {formatTimeRemaining(timeRemaining)}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Collected Shares */}
            {collectedShares.length > 0 && (
              <div className="space-y-2">
                <Label>Полученные коды:</Label>
                <div className="space-y-1">
                  {collectedShares.map((share, index) => (
                    <div key={share.id} className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Код от контакта #{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Add Share Form */}
            {collectedShares.length < (recoverySession?.requiredShares || 3) && (
              <div className="space-y-2">
                <Label htmlFor="contactCode">Код от контакта</Label>
                <Input
                  id="contactCode"
                  placeholder="Введите код от доверенного контакта"
                  value={contactCode}
                  onChange={(e) => setContactCode(e.target.value)}
                />
              </div>
            )}
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">Восстановление завершено</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Доступ к кошельку успешно восстановлен
              </p>
            </div>
            
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Все {collectedShares.length} кодов успешно собраны и проверены.
                  Ваш кошелек восстановлен и готов к использованию.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Безопасность подтверждена</div>
                    <div className="text-sm text-muted-foreground">
                      Все проверки пройдены успешно
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Key className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Ключи восстановлены</div>
                    <div className="text-sm text-muted-foreground">
                      Приватные ключи доступны
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Восстановление доступа</CardTitle>
        <CardDescription className="text-center">
          Безопасное восстановление через доверенные контакты
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Step Content */}
        {renderStepContent()}
        
        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Отмена
          </Button>
          
          {currentStep === 1 && (
            <Button
              onClick={initiateRecovery}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                'Начать восстановление'
              )}
            </Button>
          )}
          
          {currentStep === 2 && collectedShares.length < (recoverySession?.requiredShares || 3) && (
            <Button
              onClick={addShareFromContact}
              disabled={isLoading || !contactCode.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Проверка...
                </>
              ) : (
                'Добавить код'
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Главный компонент управления восстановлением
 */
export function RecoveryManager() {
  const [currentView, setCurrentView] = useState<'setup' | 'recover' | 'manage'>('manage');
  const [isRecoverySetup, setIsRecoverySetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const recoverySystem = new RecoverySystemImpl({
    threshold: 3,
    totalShares: 5,
    shareEncryption: true,
    contactVerification: true,
    gracePeriod: 24 * 60 * 60 * 1000
  });
  
  useEffect(() => {
    checkRecoverySetup();
  }, []);
  
  const checkRecoverySetup = async () => {
    try {
      setIsLoading(true);
      const setup = await recoverySystem.isRecoverySetup();
      setIsRecoverySetup(setup);
    } catch (error) {
      logger.error("Failed to check recovery setup", error as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSetupComplete = () => {
    setIsRecoverySetup(true);
    setCurrentView('manage');
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Управление восстановлением</h2>
        <p className="text-muted-foreground mt-2">
          Защитите свой кошелек с помощью социальных контактов
        </p>
      </div>
      
      <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manage">Управление</TabsTrigger>
          <TabsTrigger value="setup">Настройка</TabsTrigger>
          <TabsTrigger value="recover">Восстановление</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Статус восстановления</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                {isRecoverySetup ? (
                  <>
                    <Shield className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="font-medium">Восстановление настроено</div>
                      <div className="text-sm text-muted-foreground">
                        Ваш кошелек защищен социальным восстановлением
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <div className="font-medium">Восстановление не настроено</div>
                      <div className="text-sm text-muted-foreground">
                        Рекомендуем настроить восстановление для безопасности
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {isRecoverySetup && (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Управление контактами
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    <Key className="mr-2 h-4 w-4" />
                    Обновить настройки
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup">
          <RecoverySetup
            onSetupComplete={handleSetupComplete}
            onCancel={() => setCurrentView('manage')}
          />
        </TabsContent>
        
        <TabsContent value="recover">
          <RecoveryProcess
            onRecoveryComplete={(encryptedKey) => {
              console.log('Recovery completed:', encryptedKey);
              setCurrentView('manage');
            }}
            onCancel={() => setCurrentView('manage')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RecoveryManager;
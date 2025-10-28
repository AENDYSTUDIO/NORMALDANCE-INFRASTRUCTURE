"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWalletContext } from "./wallet-provider";
import { TelegramUtils } from "@/lib/wallet/utils";
import { logger } from "@/lib/utils/logger";

/**
 * Демонстрационный компонент для Invisible Wallet
 */
export function InvisibleWalletDemo() {
  const { 
    connected, 
    publicKey, 
    balance, 
    isInvisibleWallet, 
    starsBalance,
    recoverySetup,
    purchaseWithStars,
    setupRecovery,
    connect,
    disconnect,
    error 
  } = useWalletContext();
  
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [isSettingUpRecovery, setIsSettingUpRecovery] = useState(false);

  useEffect(() => {
    logger.info("InvisibleWalletDemo mounted", {
      isInvisibleWallet,
      connected,
      publicKey: publicKey?.toBase58()
    });
  }, [isInvisibleWallet, connected, publicKey]);

  const handlePurchaseWithStars = async () => {
    if (!purchaseWithStars) {
      logger.error("purchaseWithStars not available");
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await purchaseWithStars(
        purchaseAmount,
        `Покупка ${purchaseAmount} NDT токенов`
      );
      
      logger.info("Stars purchase completed", result);
      alert(`Покупка успешна!\nStars: ${result.starsAmount}\nSOL: ${result.solAmount}\nNDT: ${result.ndtAmount}`);
    } catch (error) {
      logger.error("Stars purchase failed", error as Error);
      alert(`Ошибка покупки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleSetupRecovery = async () => {
    if (!setupRecovery) {
      logger.error("setupRecovery not available");
      return;
    }

    setIsSettingUpRecovery(true);
    try {
      // В реальном приложении здесь будет выбор контактов
      const mockContacts = [
        {
          id: '123456789',
          username: 'trusted_contact_1',
          firstName: 'Alice',
          isVerified: true,
          trustLevel: 0.9
        },
        {
          id: '987654321',
          username: 'trusted_contact_2',
          firstName: 'Bob',
          isVerified: true,
          trustLevel: 0.8
        }
      ];

      await setupRecovery(mockContacts);
      logger.info("Recovery setup completed");
      alert("Восстановление успешно настроено!");
    } catch (error) {
      logger.error("Recovery setup failed", error as Error);
      alert(`Ошибка настройки восстановления: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsSettingUpRecovery(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!TelegramUtils.isTelegramWebApp()) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Invisible Wallet недоступен</CardTitle>
          <CardDescription>
            Invisible Wallet работает только в Telegram Mini App
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Пожалуйста, откройте это приложение в Telegram для использования Invisible Wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Invisible Wallet
              {isInvisibleWallet && (
                <Badge variant="secondary">Автоматический</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {connected && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Подключен
                </Badge>
              )}
              {isInvisibleWallet && (
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  Telegram
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Бесшовный кошелек с автоматическим управлением ключами
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">Ошибка: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Статус подключения</h4>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">
                  {connected ? 'Подключен' : 'Не подключен'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Тип кошелька</h4>
              <div className="text-sm">
                {isInvisibleWallet ? 'Invisible Wallet' : 'Стандартный кошелек'}
              </div>
            </div>

            {publicKey && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Публичный ключ</h4>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {formatAddress(publicKey.toBase58())}
                </div>
              </div>
            )}

            {balance !== null && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Баланс SOL</h4>
                <div className="text-sm font-semibold">
                  {balance.toFixed(6)} SOL
                </div>
              </div>
            )}

            {starsBalance !== null && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Баланс Stars</h4>
                <div className="text-sm font-semibold">
                  {starsBalance} Stars
                </div>
              </div>
            )}

            {recoverySetup !== undefined && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Восстановление</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${recoverySetup ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm">
                    {recoverySetup ? 'Настроено' : 'Не настроено'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            {!connected && (
              <Button onClick={connect} variant="default">
                Подключить кошелек
              </Button>
            )}
            
            {connected && (
              <Button onClick={disconnect} variant="outline">
                Отключить
              </Button>
            )}

            {isInvisibleWallet && connected && purchaseWithStars && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                  min={1}
                  max={10000}
                  className="w-24 px-2 py-1 border rounded text-sm"
                />
                <Button 
                  onClick={handlePurchaseWithStars} 
                  disabled={isPurchasing}
                  variant="secondary"
                >
                  {isPurchasing ? 'Покупка...' : 'Купить за Stars'}
                </Button>
              </div>
            )}

            {isInvisibleWallet && connected && setupRecovery && !recoverySetup && (
              <Button 
                onClick={handleSetupRecovery} 
                disabled={isSettingUpRecovery}
                variant="outline"
              >
                {isSettingUpRecovery ? 'Настройка...' : 'Настроить восстановление'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Преимущества Invisible Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h5 className="font-medium">🔐 Безопасность</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Детерминистическая генерация ключей</li>
                <li>• Шифрование AES-256-GCM</li>
                <li>• Социальное восстановление</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">⚡ Удобство</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Автоматическая инициализация</li>
                <li>• Покупки за Telegram Stars</li>
                <li>• Отсутствие seed фраз</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">🌐 Интеграция</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Нативная работа в Telegram</li>
                <li>• Автоматическая конвертация</li>
                <li>• Оффлайн подпись транзакций</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium">🔄 Восстановление</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Через Telegram аккаунт</li>
                <li>• Через доверенные контакты</li>
                <li>• Без seed фразы</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvisibleWalletDemo;
import { logger } from "@/lib/utils/logger";
import React, { ReactNode, useEffect, useState } from "react";
import { BiometricAuthUtils } from "./biometric-auth";
import { InvisibleWalletAdapter } from "./invisible-wallet-adapter";

/**
 * Уровни раскрытия сложности
 */
export type DisclosureLevel = "basic" | "intermediate" | "advanced" | "expert";

/**
 * Конфигурация уровня раскрытия
 */
export interface DisclosureConfig {
  level: DisclosureLevel;
  showPrivateKey: boolean;
  showTransactionDetails: boolean;
  showAdvancedSettings: boolean;
  showDeveloperTools: boolean;
  showNetworkInfo: boolean;
  showGasSettings: boolean;
  showSecuritySettings: boolean;
}

/**
 * Свойства компонента Progressive Disclosure
 */
export interface ProgressiveDisclosureUIProps {
  wallet: InvisibleWalletAdapter;
  initialLevel?: DisclosureLevel;
  onLevelChange?: (level: DisclosureLevel) => void;
  children?: ReactNode;
  className?: string;
}

/**
 * Компонент для прогрессивного раскрытия сложности кошелька
 *
 * Особенности:
 * - Постепенное раскрытие функциональности
 * - Адаптация под уровень пользователя
 * - Сохранение предпочтений
 * - Плавные переходы между уровнями
 */
export const ProgressiveDisclosureUI: React.FC<
  ProgressiveDisclosureUIProps
> = ({
  wallet,
  initialLevel = "basic",
  onLevelChange,
  children,
  className = "",
}) => {
  const [currentLevel, setCurrentLevel] =
    useState<DisclosureLevel>(initialLevel);
  const [config, setConfig] = useState<DisclosureConfig>(
    getLevelConfig(initialLevel)
  );
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);

  useEffect(() => {
    loadUserPreferences();
  }, []);

  useEffect(() => {
    const newConfig = getLevelConfig(currentLevel);
    setConfig(newConfig);
    onLevelChange?.(currentLevel);
    saveUserPreferences({ ...userPreferences, disclosureLevel: currentLevel });
  }, [currentLevel]);

  const loadUserPreferences = async () => {
    try {
      const stored = localStorage.getItem("wallet_disclosure_preferences");
      if (stored) {
        const preferences = JSON.parse(stored);
        setUserPreferences(preferences);
        if (preferences.disclosureLevel) {
          setCurrentLevel(preferences.disclosureLevel);
        }
      }
    } catch (error) {
      logger.error("Failed to load user preferences", error);
    }
  };

  const saveUserPreferences = async (preferences: any) => {
    try {
      localStorage.setItem(
        "wallet_disclosure_preferences",
        JSON.stringify(preferences)
      );
    } catch (error) {
      logger.error("Failed to save user preferences", error);
    }
  };

  const handleLevelChange = (newLevel: DisclosureLevel) => {
    if (newLevel === currentLevel) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentLevel(newLevel);
      setIsTransitioning(false);
    }, 300);
  };

  const canUpgradeTo = (level: DisclosureLevel): boolean => {
    const levels: DisclosureLevel[] = [
      "basic",
      "intermediate",
      "advanced",
      "expert",
    ];
    const currentIndex = levels.indexOf(currentLevel);
    const targetIndex = levels.indexOf(level);
    return targetIndex <= currentIndex + 1;
  };

  const getLevelRequirements = (level: DisclosureLevel): string[] => {
    const requirements: Record<DisclosureLevel, string[]> = {
      basic: [],
      intermediate: ["Базовое понимание криптовалют"],
      advanced: ["Опыт использования DeFi", "Понимание газовых комиссий"],
      expert: ["Технические знания", "Опыт разработки"],
    };
    return requirements[level];
  };

  return (
    <div
      className={`progressive-disclosure-ui ${className} ${
        isTransitioning ? "transitioning" : ""
      }`}
    >
      {/* Header с выбором уровня */}
      <div className="level-selector">
        <h3>Уровень интерфейса</h3>
        <div className="level-buttons">
          {(
            ["basic", "intermediate", "advanced", "expert"] as DisclosureLevel[]
          ).map((level) => (
            <button
              key={level}
              className={`level-button ${
                currentLevel === level ? "active" : ""
              } ${!canUpgradeTo(level) ? "disabled" : ""}`}
              onClick={() => canUpgradeTo(level) && handleLevelChange(level)}
              disabled={!canUpgradeTo(level)}
              title={getLevelRequirements(level).join(", ")}
            >
              <div className="level-icon">{getLevelIcon(level)}</div>
              <div className="level-label">{getLevelLabel(level)}</div>
              {currentLevel === level && <div className="level-indicator" />}
            </button>
          ))}
        </div>
      </div>

      {/* Основной контент с прогрессивным раскрытием */}
      <div className={`content-area level-${currentLevel}`}>
        {children}

        {/* Базовая информация - всегда видна */}
        <BasicWalletInfo wallet={wallet} />

        {/* Промежуточный уровень */}
        {config.showTransactionDetails && (
          <TransactionDetails wallet={wallet} />
        )}

        {/* Продвинутый уровень */}
        {config.showAdvancedSettings && <AdvancedSettings wallet={wallet} />}

        {/* Экспертный уровень */}
        {config.showDeveloperTools && <DeveloperTools wallet={wallet} />}

        {/* Настройки безопасности */}
        {config.showSecuritySettings && <SecuritySettings wallet={wallet} />}

        {/* Сетевая информация */}
        {config.showNetworkInfo && <NetworkInfo wallet={wallet} />}

        {/* Настройки газа */}
        {config.showGasSettings && <GasSettings wallet={wallet} />}
      </div>

      {/* Подсказки для следующего уровня */}
      <LevelUpgradePrompt
        currentLevel={currentLevel}
        onUpgrade={handleLevelChange}
        canUpgrade={canUpgradeTo}
      />
    </div>
  );
};

/**
 * Базовая информация о кошельке
 */
const BasicWalletInfo: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [balance, setBalance] = useState<number>(0);
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    const loadBasicInfo = async () => {
      try {
        const bal = await wallet.getBalance();
        setBalance(bal);

        if (wallet.publicKey) {
          setAddress(wallet.publicKey.toBase58());
        }
      } catch (error) {
        logger.error("Failed to load basic wallet info", error);
      }
    };

    loadBasicInfo();
    const interval = setInterval(loadBasicInfo, 30000); // Обновление каждые 30 секунд

    return () => clearInterval(interval);
  }, [wallet]);

  return (
    <div className="basic-wallet-info">
      <div className="balance-card">
        <h4>Баланс</h4>
        <div className="balance-amount">{balance.toFixed(4)} SOL</div>
      </div>

      <div className="address-card">
        <h4>Адрес кошелька</h4>
        <div className="address-display">
          {address
            ? `${address.slice(0, 6)}...${address.slice(-4)}`
            : "Загрузка..."}
        </div>
        <button
          className="copy-button"
          onClick={() => address && navigator.clipboard.writeText(address)}
        >
          Копировать
        </button>
      </div>
    </div>
  );
};

/**
 * Детали транзакций
 */
const TransactionDetails: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        // В реальной реализации здесь должна быть загрузка транзакций
        setTransactions([]);
      } catch (error) {
        logger.error("Failed to load transactions", error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [wallet]);

  return (
    <div className="transaction-details">
      <h4>Последние транзакции</h4>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <div className="transaction-list">
          {transactions.length === 0 ? (
            <div className="empty-state">Нет транзакций</div>
          ) : (
            transactions.map((tx, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-type">{tx.type}</div>
                  <div className="transaction-amount">{tx.amount} SOL</div>
                </div>
                <div className="transaction-status">{tx.status}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Продвинутые настройки
 */
const AdvancedSettings: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [settings, setSettings] = useState({
    autoSign: false,
    maxFee: 0.001,
    slippage: 1.0,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="advanced-settings">
      <h4>Продвинутые настройки</h4>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={settings.autoSign}
            onChange={(e) => handleSettingChange("autoSign", e.target.checked)}
          />
          Автоматическая подпись транзакций
        </label>
      </div>

      <div className="setting-group">
        <label>Максимальная комиссия (SOL)</label>
        <input
          type="number"
          step="0.0001"
          value={settings.maxFee}
          onChange={(e) =>
            handleSettingChange("maxFee", parseFloat(e.target.value))
          }
        />
      </div>

      <div className="setting-group">
        <label>Проскальзывание (%)</label>
        <input
          type="number"
          step="0.1"
          value={settings.slippage}
          onChange={(e) =>
            handleSettingChange("slippage", parseFloat(e.target.value))
          }
        />
      </div>
    </div>
  );
};

/**
 * Инструменты разработчика
 */
const DeveloperTools: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [privateKey, setPrivateKey] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const exportPrivateKey = async () => {
    try {
      // В реальной реализации здесь должен быть экспорт приватного ключа
      setPrivateKey("•••••••••••••••••••••••••••••••••");
    } catch (error) {
      logger.error("Failed to export private key", error);
    }
  };

  return (
    <div className="developer-tools">
      <h4>Инструменты разработчика</h4>

      <div className="tool-section">
        <h5>Экспорт приватного ключа</h5>
        <button onClick={exportPrivateKey}>Показать приватный ключ</button>
        {showPrivateKey && (
          <div className="private-key-display">
            <code>{privateKey}</code>
            <button onClick={() => navigator.clipboard.writeText(privateKey)}>
              Копировать
            </button>
          </div>
        )}
      </div>

      <div className="tool-section">
        <h5>Отладочная информация</h5>
        <div className="debug-info">
          <div>Network: {wallet.connected ? "Connected" : "Disconnected"}</div>
          <div>Public Key: {wallet.publicKey?.toBase58()}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Настройки безопасности
 */
const SecuritySettings: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await BiometricAuthUtils.isSupported();
      setBiometricAvailable(available);
    };
    checkBiometric();
  }, []);

  const toggleBiometric = async () => {
    // В реальной реализации здесь должно быть включение/выключение биометрии
    setBiometricEnabled(!biometricEnabled);
  };

  return (
    <div className="security-settings">
      <h4>Настройки безопасности</h4>

      {biometricAvailable && (
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={biometricEnabled}
              onChange={toggleBiometric}
            />
            Биометрическая аутентификация
          </label>
        </div>
      )}

      <div className="setting-group">
        <button>Настроить социальное восстановление</button>
      </div>

      <div className="setting-group">
        <button>Экспортировать бэкап</button>
      </div>
    </div>
  );
};

/**
 * Информация о сети
 */
const NetworkInfo: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  return (
    <div className="network-info">
      <h4>Информация о сети</h4>
      <div className="network-details">
        <div>Сеть: Solana Devnet</div>
        <div>RPC: https://api.devnet.solana.com</div>
        <div>Статус: {wallet.connected ? "Подключено" : "Отключено"}</div>
      </div>
    </div>
  );
};

/**
 * Настройки газа
 */
const GasSettings: React.FC<{ wallet: InvisibleWalletAdapter }> = ({
  wallet,
}) => {
  const [gasSettings, setGasSettings] = useState({
    priorityFee: 0.0001,
    computeLimit: 200000,
    skipPreflight: false,
  });

  return (
    <div className="gas-settings">
      <h4>Настройки газа</h4>

      <div className="setting-group">
        <label>Приоритетная комиссия (SOL)</label>
        <input
          type="number"
          step="0.00001"
          value={gasSettings.priorityFee}
          onChange={(e) =>
            setGasSettings((prev) => ({
              ...prev,
              priorityFee: parseFloat(e.target.value),
            }))
          }
        />
      </div>

      <div className="setting-group">
        <label>Лимит compute units</label>
        <input
          type="number"
          value={gasSettings.computeLimit}
          onChange={(e) =>
            setGasSettings((prev) => ({
              ...prev,
              computeLimit: parseInt(e.target.value),
            }))
          }
        />
      </div>

      <div className="setting-group">
        <label>
          <input
            type="checkbox"
            checked={gasSettings.skipPreflight}
            onChange={(e) =>
              setGasSettings((prev) => ({
                ...prev,
                skipPreflight: e.target.checked,
              }))
            }
          />
          Пропустить preflight проверку
        </label>
      </div>
    </div>
  );
};

/**
 * Подсказка для перехода на следующий уровень
 */
const LevelUpgradePrompt: React.FC<{
  currentLevel: DisclosureLevel;
  onUpgrade: (level: DisclosureLevel) => void;
  canUpgrade: (level: DisclosureLevel) => boolean;
}> = ({ currentLevel, onUpgrade, canUpgrade }) => {
  const levels: DisclosureLevel[] = [
    "basic",
    "intermediate",
    "advanced",
    "expert",
  ];
  const currentIndex = levels.indexOf(currentLevel);
  const nextLevel = levels[currentIndex + 1];

  if (!nextLevel) return null;

  return (
    <div className="level-upgrade-prompt">
      <div className="prompt-content">
        <h5>Готовы перейти на следующий уровень?</h5>
        <p>Откройте доступ к расширенным функциям</p>
        <button
          className="upgrade-button"
          onClick={() => canUpgrade(nextLevel) && onUpgrade(nextLevel)}
          disabled={!canUpgrade(nextLevel)}
        >
          Перейти на {getLevelLabel(nextLevel)}
        </button>
      </div>
    </div>
  );
};

// Вспомогательные функции

function getLevelConfig(level: DisclosureLevel): DisclosureConfig {
  const configs: Record<DisclosureLevel, DisclosureConfig> = {
    basic: {
      level: "basic",
      showPrivateKey: false,
      showTransactionDetails: false,
      showAdvancedSettings: false,
      showDeveloperTools: false,
      showNetworkInfo: false,
      showGasSettings: false,
      showSecuritySettings: false,
    },
    intermediate: {
      level: "intermediate",
      showPrivateKey: false,
      showTransactionDetails: true,
      showAdvancedSettings: false,
      showDeveloperTools: false,
      showNetworkInfo: true,
      showGasSettings: false,
      showSecuritySettings: true,
    },
    advanced: {
      level: "advanced",
      showPrivateKey: false,
      showTransactionDetails: true,
      showAdvancedSettings: true,
      showDeveloperTools: false,
      showNetworkInfo: true,
      showGasSettings: true,
      showSecuritySettings: true,
    },
    expert: {
      level: "expert",
      showPrivateKey: true,
      showTransactionDetails: true,
      showAdvancedSettings: true,
      showDeveloperTools: true,
      showNetworkInfo: true,
      showGasSettings: true,
      showSecuritySettings: true,
    },
  };

  return configs[level];
}

function getLevelLabel(level: DisclosureLevel): string {
  const labels: Record<DisclosureLevel, string> = {
    basic: "Базовый",
    intermediate: "Промежуточный",
    advanced: "Продвинутый",
    expert: "Экспертный",
  };
  return labels[level];
}

function getLevelIcon(level: DisclosureLevel): string {
  const icons: Record<DisclosureLevel, string> = {
    basic: "👤",
    intermediate: "🎯",
    advanced: "⚙️",
    expert: "🔧",
  };
  return icons[level];
}

export default ProgressiveDisclosureUI;

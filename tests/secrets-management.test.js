/**
 * Тесты для системы управления секретами NORMALDANCE
 * 
 * Этот файл содержит тесты для проверки функциональности
 * управления секретами, включая шифрование, валидацию,
 * ротацию и мониторинг.
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import { SecretsTemplateManager  } from '../config/secrets-templates';;
import { SecretsManager  } from '../scripts/secrets-manager';;
import { SecurityMonitor  } from '../scripts/security-monitor';;
import { HardcodedSecretsChecker  } from '../scripts/check-hardcoded-secrets';;
import { SecretRotator  } from '../scripts/rotate-secrets';;

describe('Система управления секретами NORMALDANCE', () => {
  const testDir = path.join(__dirname, '../temp-test');
  const backupDir = path.join(testDir, 'backups');
  const logDir = path.join(testDir, 'logs');

  beforeAll(async () => {
    // Создаем временные директории для тестов
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(backupDir, { recursive: true });
    await fs.mkdir(logDir, { recursive: true });

    // Устанавливаем тестовые переменные окружения
    process.env.TEST_MODE = 'true';
    process.env.GITHUB_TOKEN = 'test_github_token';
    process.env.VERCEL_TOKEN = 'test_vercel_token';
    process.env.SLACK_WEBHOOK = 'test_slack_webhook';
  });

  afterAll(async () => {
    // Очищаем временные директории
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Не удалось очистить тестовую директорию:', error.message);
    }
  });

  describe('SecretsTemplateManager', () => {
    let templateManager;

    beforeEach(() => {
      templateManager = new SecretsTemplateManager();
    });

    test('должен загружать шаблон для development окружения', () => {
      const template = templateManager.getTemplate('development');
      expect(template).toBeDefined();
      expect(template.name).toBe('development');
      expect(template.secrets).toBeDefined();
      expect(Object.keys(template.secrets).length).toBeGreaterThan(0);
    });

    test('должен загружать шаблон для staging окружения', () => {
      const template = templateManager.getTemplate('staging');
      expect(template).toBeDefined();
      expect(template.name).toBe('staging');
      expect(template.secrets).toBeDefined();
    });

    test('должен загружать шаблон для production окружения', () => {
      const template = templateManager.getTemplate('production');
      expect(template).toBeDefined();
      expect(template.name).toBe('production');
      expect(template.secrets).toBeDefined();
    });

    test('должен возвращать null для неизвестного окружения', () => {
      const template = templateManager.getTemplate('unknown');
      expect(template).toBeNull();
    });

    test('должен валидировать шаблон', () => {
      const template = templateManager.getTemplate('production');
      const isValid = templateManager.validateTemplate(template);
      expect(isValid).toBe(true);
    });

    test('должен генерировать секреты', () => {
      const template = templateManager.getTemplate('production');
      const secrets = templateManager.generateSecrets('production');
      
      expect(secrets).toBeDefined();
      expect(typeof secrets).toBe('object');
      expect(Object.keys(secrets).length).toBeGreaterThan(0);
    });

    test('должен возвращать обязательные секреты', () => {
      const requiredSecrets = templateManager.getRequiredSecrets('production');
      expect(requiredSecrets).toBeDefined();
      expect(Array.isArray(requiredSecrets)).toBe(true);
      expect(requiredSecrets.length).toBeGreaterThan(0);
    });
  });

  describe('SecretsManager', () => {
    let manager;

    beforeEach(() => {
      manager = new SecretsManager();
      manager.backupDir = backupDir;
      manager.logDir = logDir;
    });

    test('должен добавлять секрет', async () => {
      const result = await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      expect(result.success).toBe(true);
      expect(result.secret).toBe('TEST_SECRET');
    });

    test('должен получать секрет', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      const secret = await manager.getSecret('development', 'TEST_SECRET');
      expect(secret).toBe('test_value');
    });

    test('должен обновлять секрет', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'old_value');
      const result = await manager.updateSecret('development', 'TEST_SECRET', 'new_value');
      expect(result.success).toBe(true);
      
      const secret = await manager.getSecret('development', 'TEST_SECRET');
      expect(secret).toBe('new_value');
    });

    test('должен удалять секрет', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      const result = await manager.removeSecret('development', 'TEST_SECRET');
      expect(result.success).toBe(true);
      
      const secret = await manager.getSecret('development', 'TEST_SECRET');
      expect(secret).toBeNull();
    });

    test('должен валидировать секрет', async () => {
      const validResult = await manager.validateSecret('development', 'TEST_SECRET', 'valid_value');
      expect(validResult.valid).toBe(true);
      
      const invalidResult = await manager.validateSecret('development', 'TEST_SECRET', '');
      expect(invalidResult.valid).toBe(false);
    });

    test('должен создавать бэкап', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      const backup = await manager.createBackup('development');
      
      expect(backup).toBeDefined();
      expect(backup.environment).toBe('development');
      expect(backup.secrets).toBeDefined();
      expect(backup.timestamp).toBeDefined();
    });

    test('должен восстанавливать из бэкапа', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      const backup = await manager.createBackup('development');
      
      await manager.removeSecret('development', 'TEST_SECRET');
      const restoreResult = await manager.restoreFromBackup(backup);
      
      expect(restoreResult.success).toBe(true);
      const secret = await manager.getSecret('development', 'TEST_SECRET');
      expect(secret).toBe('test_value');
    });

    test('должен логировать операции', async () => {
      await manager.addSecret('development', 'TEST_SECRET', 'test_value');
      
      const logs = await manager.getAuditLogs('development');
      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('SecurityMonitor', () => {
    let monitor;

    beforeEach(() => {
      monitor = new SecurityMonitor();
      monitor.reportDir = testDir;
    });

    test('должен проверять силу паролей', async () => {
      const weakPassword = 'password123';
      const strongPassword = 'SecureP@ssw0rd123!';
      
      const weakCheck = await monitor.checkPasswordStrength('production', weakPassword);
      expect(weakCheck.strong).toBe(false);
      expect(weakCheck.issues).toBeDefined();
      
      const strongCheck = await monitor.checkPasswordStrength('production', strongPassword);
      expect(strongCheck.strong).toBe(true);
      expect(strongCheck.issues).toEqual([]);
    });

    test('должен проверять ротацию секретов', async () => {
      const rotationCheck = await monitor.checkSecretRotation('production');
      expect(rotationCheck).toBeDefined();
      expect(rotationCheck.lastRotated).toBeDefined();
      expect(rotationCheck.rotationStatus).toBeDefined();
    });

    test('должен проверять контроль доступа', async () => {
      const accessCheck = await monitor.checkAccessControl('production');
      expect(accessCheck).toBeDefined();
      expect(accessCheck.accessPermissions).toBeDefined();
      expect(accessCheck.issues).toBeDefined();
    });

    test('должен проверять шифрование', async () => {
      const encryptionCheck = await monitor.checkEncryption('production');
      expect(encryptionCheck).toBeDefined();
      expect(encryptionCheck.encryptionStatus).toBeDefined();
      expect(encryptionCheck.issues).toBeDefined();
    });

    test('должен проверять аудит логи', async () => {
      const auditCheck = await monitor.checkAuditLogging('production');
      expect(auditCheck).toBeDefined();
      expect(auditCheck.loggingStatus).toBeDefined();
      expect(auditCheck.issues).toBeDefined();
    });

    test('должен проверять утечки секретов', async () => {
      const exposedCheck = await monitor.checkExposedSecrets('production');
      expect(exposedCheck).toBeDefined();
      expect(exposedCheck.issues).toBeDefined();
      expect(exposedCheck.exposedSecrets).toBeDefined();
    });

    test('должен генерировать отчет', async () => {
      const report = await monitor.monitorEnvironment('production');
      expect(report).toBeDefined();
      expect(report.environment).toBe('production');
      expect(report.score).toBeDefined();
      expect(report.issues).toBeDefined();
    });

    test('должен генерировать отчет в разных форматах', async () => {
      const report = await monitor.monitorEnvironment('production');
      
      const jsonReport = monitor.generateComprehensiveReport([report], 'json');
      expect(typeof jsonReport).toBe('string');
      
      const textReport = monitor.generateComprehensiveReport([report], 'text');
      expect(typeof textReport).toBe('string');
      
      const htmlReport = monitor.generateComprehensiveReport([report], 'html');
      expect(typeof htmlReport).toBe('string');
      expect(htmlReport).toContain('<html>');
    });
  });

  describe('HardcodedSecretsChecker', () => {
    let checker;

    beforeEach(() => {
      checker = new HardcodedSecretsChecker();
    });

    test('должен находить жестко закодированные секреты', async () => {
      // Создаем тестовый файл с секретами
      const testFile = path.join(testDir, 'test-file.js');
      const testContent = `
        const apiKey = 'sk_test_1234567890abcdef';
        const databaseUrl = 'postgresql://user:pass@host:5432/db';
        const password = 'password123';
      `;
      
      await fs.writeFile(testFile, testContent);
      
      const results = await checker.scanFile(testFile, testContent);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Проверяем, что найдены секреты
      const hasApiKey = results.some(r => r.secret.includes('sk_test'));
      const hasDatabaseUrl = results.some(r => r.secret.includes('postgresql'));
      const hasPassword = results.some(r => r.secret.includes('password123'));
      
      expect(hasApiKey).toBe(true);
      expect(hasDatabaseUrl).toBe(true);
      expect(hasPassword).toBe(true);
    });

    test('должен идентифицировать типы секретов', () => {
      const secret = 'sk_test_1234567890abcdef';
      const type = checker.identifySecretType(secret);
      expect(type).toBe('API Key');
    });

    test('должен рассчитывать уверенность', () => {
      const secret = 'sk_test_1234567890abcdef';
      const filePath = 'src/config/secrets.js';
      const confidence = checker.calculateConfidence(secret, filePath);
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    test('должен генерировать предложения', () => {
      const secret = 'sk_test_1234567890abcdef';
      const filePath = 'src/config/secrets.js';
      const suggestion = checker.generateSuggestion(secret, filePath);
      expect(suggestion).toBeDefined();
      expect(typeof suggestion).toBe('string');
    });

    test('должен маскировать чувствительные значения', () => {
      const masked = checker.maskSecretValue('API_KEY', 'sk_test_1234567890abcdef');
      expect(masked).toBe('sk_test_1234*******');
    });

    test('должен фильтровать ложные срабатывания', () => {
      const falsePositive = 'undefined';
      const isFalsePositive = checker.isFalsePositive(falsePositive);
      expect(isFalsePositive).toBe(true);
    });
  });

  describe('SecretRotator', () => {
    let rotator;

    beforeEach(() => {
      rotator = new SecretRotator();
      rotator.backupDir = backupDir;
    });

    test('должен генерировать новые секреты', async () => {
      const currentSecrets = {
        DATABASE_URL: 'postgresql://old:pass@host:5432/db',
        API_KEY: 'old_api_key'
      };
      
      const newSecrets = await rotator.generateNewSecrets('production', currentSecrets);
      
      expect(newSecrets).toBeDefined();
      expect(typeof newSecrets).toBe('object');
      expect(Object.keys(newSecrets).length).toBeGreaterThan(0);
      
      // Проверяем, что секреты изменились
      expect(newSecrets.DATABASE_URL).not.toBe(currentSecrets.DATABASE_URL);
      expect(newSecrets.API_KEY).not.toBe(currentSecrets.API_KEY);
    });

    test('должен создавать бэкап', async () => {
      const secrets = {
        DATABASE_URL: 'postgresql://user:pass@host:5432/db',
        API_KEY: 'test_api_key'
      };
      
      const backup = await rotator.createBackup('production', secrets);
      
      expect(backup).toBeDefined();
      expect(backup.environment).toBe('production');
      expect(backup.secrets).toEqual(secrets);
      expect(backup.timestamp).toBeDefined();
      expect(backup.checksum).toBeDefined();
    });

    test('должен шифровать секреты', () => {
      const value = 'test_secret_value';
      const encrypted = rotator.encryptSecretValue(value);
      
      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(value);
    });

    test('должен рассчитывать контрольную сумму', () => {
      const data = { key: 'value', number: 123 };
      const checksum = rotator.calculateChecksum(data);
      
      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(64); // SHA-256 hash length
    });

    test('должен логировать ротацию', async () => {
      const oldSecrets = { DATABASE_URL: 'old_value' };
      const newSecrets = { DATABASE_URL: 'new_value' };
      
      await rotator.logRotation('production', oldSecrets, newSecrets);
      
      // Проверяем, что лог создан
      const logFile = path.join(__dirname, '../secrets-rotation.log');
      const exists = await fs.access(logFile).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('Интеграция CI/CD', () => {
    test('должен валидировать секреты перед деплоем', async () => {
      const templateManager = new SecretsTemplateManager();
      const requiredSecrets = templateManager.getRequiredSecrets('production');
      
      expect(requiredSecrets).toBeDefined();
      expect(Array.isArray(requiredSecrets)).toBe(true);
      expect(requiredSecrets.length).toBeGreaterThan(0);
      
      // Проверяем, что все обязательные секреты имеют конфигурацию
      for (const secret of requiredSecrets) {
        const template = templateManager.getTemplate('production');
        expect(template.secrets[secret]).toBeDefined();
      }
    });

    test('должен проверять соответствие стандартов', async () => {
      const monitor = new SecurityMonitor();
      const compliance = await monitor.checkNISTCompliance('production');
      
      expect(compliance).toBeDefined();
      expect(compliance.issues).toBeDefined();
      expect(compliance.deduction).toBeDefined();
      expect(compliance.status).toBeDefined();
    });

    test('должен генерировать отчеты для CI/CD', async () => {
      const monitor = new SecurityMonitor();
      const report = await monitor.monitorEnvironment('production');
      
      expect(report).toBeDefined();
      expect(report.environment).toBe('production');
      expect(report.score).toBeDefined();
      expect(report.issues).toBeDefined();
      
      // Генерируем отчет в формате JSON
      const jsonReport = monitor.generateComprehensiveReport([report], 'json');
      const parsedReport = JSON.parse(jsonReport);
      
      expect(parsedReport).toBeDefined();
      expect(Array.isArray(parsedReport)).toBe(true);
      expect(parsedReport[0].environment).toBe('production');
    });
  });

  describe('Обработка ошибок', () => {
    test('должен обрабатывать ошибки при добавлении секретов', async () => {
      const manager = new SecretsManager();
      
      // Попытка добавить секрет с пустым значением
      const result = await manager.addSecret('development', 'EMPTY_SECRET', '');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('должен обрабатывать ошибки при получении несуществующих секретов', async () => {
      const manager = new SecretsManager();
      const secret = await manager.getSecret('development', 'NONEXISTENT_SECRET');
      expect(secret).toBeNull();
    });

    test('должен обрабатывать ошибки при проверке безопасности', async () => {
      const monitor = new SecurityMonitor();
      
      // Попытка проверить неизвестное окружение
      const report = await monitor.monitorEnvironment('unknown');
      expect(report).toBeDefined();
      expect(report.issues).toBeDefined();
    });

    test('должен обрабатывать ошибки при сканировании файлов', async () => {
      const checker = new HardcodedSecretsChecker();
      
      // Попытка просканировать несуществующий файл
      const results = await checker.scanFile('nonexistent.js', '');
      expect(results).toEqual([]);
    });
  });

  describe('Производительность', () => {
    test('должен быстро валидировать секреты', async () => {
      const manager = new SecretsManager();
      const startTime = Date.now();
      
      await manager.validateSecret('production', 'DATABASE_URL', 'valid_value');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Должен быть быстрее 1 секунды
    });

    test('должен быстро генерировать отчеты', async () => {
      const monitor = new SecurityMonitor();
      const startTime = Date.now();
      
      const report = await monitor.monitorEnvironment('production');
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Должен быть быстрее 5 секунд
      expect(report).toBeDefined();
    });

    test('должен быстро сканировать файлы', async () => {
      const checker = new HardcodedSecretsChecker();
      
      // Создаем большой тестовый файл
      const largeContent = 'const apiKey = "sk_test_' + 'a'.repeat(100) + '";'.repeat(1000);
      const startTime = Date.now();
      
      const results = await checker.scanFile('test.js', largeContent);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000); // Должен быть быстрее 3 секунд
      expect(results).toBeDefined();
    });
  });
});

// Дополнительные тесты для покрытия крайних случаев
describe('Крайние случаи', () => {
  test('должен обрабатывать пустые шаблоны', () => {
    const templateManager = new SecretsTemplateManager();
    const template = templateManager.getTemplate('unknown');
    expect(template).toBeNull();
  });

  test('должен обрабатывать пустые секреты', async () => {
    const manager = new SecretsManager();
    const result = await manager.validateSecret('production', 'EMPTY_KEY', '');
    expect(result.valid).toBe(false);
  });

  test('должен обрабатывать специальные символы в секретах', async () => {
    const manager = new SecretsManager();
    const specialSecret = 'Special@Secret#123$%^&*()';
    const result = await manager.validateSecret('production', 'SPECIAL_SECRET', specialSecret);
    expect(result.valid).toBe(true);
  });

  test('должен обрабатывать длинные секреты', async () => {
    const manager = new SecretsManager();
    const longSecret = 'a'.repeat(1000);
    const result = await manager.validateSecret('production', 'LONG_SECRET', longSecret);
    expect(result.valid).toBe(true);
  });

  test('должен обрабатывать международные символы', async () => {
    const manager = new SecretsManager();
    const internationalSecret = 'Пароль123@пароль';
    const result = await manager.validateSecret('production', 'INTERNATIONAL_SECRET', internationalSecret);
    expect(result.valid).toBe(true);
  });
});
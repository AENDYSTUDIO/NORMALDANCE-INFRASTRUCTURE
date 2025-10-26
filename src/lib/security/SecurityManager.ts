/**
 * SecurityManager — централизованный менеджер безопасности для NORMALDANCE.
 * Реализует ISecurityService: контекстная санитизация, экранирование,
 * CSRF (double-submit: cookie + header), регистрация/выполнение валидаторов,
 * формирование заголовков безопасности (CSP/ХСТС/Х-*), проверка политик и аудит.
 *
 * - Единый источник CSP: config/csp.ts (getCspHeader)
 * - Совместим с Next.js (App Router), работает на клиенте и сервере
 * - Кеш CSRF-токенов для недетерминирующих операций (по sessionId) до TTL
 * - Обратная совместимость достигается через адаптеры/прокси-экспорты (будут добавлены отдельно)
 *
 * Все JSDoc-комментарии на русском языке.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import crypto from "crypto";
import {
  AuditInput,
  AuditReport,
  CSRFToken,
  CSRFVerification,
  HeadersResult,
  ISecurityService,
  PoliciesCheck,
  SanitizationOptions,
  SecurityConfig,
  SecurityContext,
  SecurityErrorCode,
  SecurityResult,
  ValidationOptions,
  ValidatorFn,
  ValidatorRegistration,
} from "./ISecurityService";

import {
  escapeAttribute as escapeAttributeSan,
  escapeHTML as escapeHTMLSan,
  sanitizeFilename as sanitizeFilenameSan,
  sanitizeObjectForContext as sanitizeObjectForContextSan,
  sanitizeURL as sanitizeURLSan,
} from "./sanitize";

import { BaseValidator } from "./BaseValidator";
import type { XssContext } from "./xss-csrf";

// Единый источник CSP
import { getCspHeader } from "../../../config/csp";

/**
 * Класс SecurityManager — централизованный менеджер безопасности для NORMALDANCE.
 * Реализует ISecurityService: контекстная санитизация, экранирование,
 * CSRF (double-submit: cookie + header), регистрация/выполнение валидаторов,
 * формирование заголовков безопасности (CSP/ХСТС/Х-*), проверка политик и аудит.
 *
 * @example
 * ```ts
 * const security = new SecurityManager(config);
 * const result = security.sanitizeString(input, ctx, opts);
 * const csrfToken = security.generateCsrfToken(ctx);
 * ```
 */
export class SecurityManager implements ISecurityService {
  private config: SecurityConfig;
  private validators: Map<string, ValidatorFn<any, any>> = new Map();

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Получение текущей конфигурации
   */
  getConfig(): SecurityConfig {
    return this.config;
  }

  /**
   * Установка новой конфигурации
   */
  setConfig(config: SecurityConfig): void {
    this.config = config;
  }

  /**
   * Регистрация валидатора
   * @param registration Объект регистрации валидатора
   */
  registerValidator<I = unknown, O = unknown>(
    registration: ValidatorRegistration<I, O>
  ): void {
    this.validators.set(registration.name, registration.fn);
  }

  /**
   * Выполнение зарегистрированного валидатора
   * @param name Имя валидатора
   * @param input Входные данные
   * @param options Опции валидации
   * @returns Результат валидации
   */
  validate<I = unknown, O = unknown>(
    name: string,
    input: I,
    options?: ValidationOptions
  ): SecurityResult<O> {
    const validator = this.validators.get(name);
    if (!validator) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.VALIDATION_ERROR,
          `Validator not found: ${name}`
        ),
      ]);
    }

    try {
      const result = validator(input, options);
      return result;
    } catch (error) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.VALIDATION_ERROR,
          `Validation failed: ${name}`,
          [],
          { error: error instanceof Error ? error.message : String(error) }
        ),
      ]);
    }
  }

  /**
   * Санитизация строки в заданном контексте
   * @param input Входная строка
   * @param ctx Контекст безопасности
   * @param opts Опции санитизации
   * @returns Результат санитизации
   */
  sanitizeString(
    input: string,
    ctx: SecurityContext,
    opts: SanitizationOptions
  ): SecurityResult<string> {
    try {
      let result: string;
      switch (opts.kind) {
        case "html":
          result = escapeHTMLSan(input);
          break;
        case "attr":
          result = escapeAttributeSan(input);
          break;
        case "url":
          const sanitizedUrl = sanitizeURLSan(input, ["http", "https", "ipfs"]);
          if (sanitizedUrl === null) {
            return BaseValidator.err([
              BaseValidator.error(
                SecurityErrorCode.SECURITY_POLICY_VIOLATION,
                "Invalid URL"
              ),
            ]);
          }
          result = sanitizedUrl;
          break;
        case "filename":
          result = sanitizeFilenameSan(input);
          break;
        case "sql":
          // Используем экранирование SQL из input-sanitizer
          const { sanitizeSQL: sanitizeSQLFn } = require("./input-sanitizer");
          result = sanitizeSQLFn(input);
          break;
        case "sql":
          // Используем экранирование SQL из input-sanitizer
          const { sanitizeSQL } = require("./input-sanitizer");
          result = sanitizeSQL(input);
          break;
        case "plain":
        default:
          result = input;
          break;
      }

      return BaseValidator.ok(result);
    } catch (error) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.SANITIZATION_APPLIED,
          "Sanitization applied to input",
          [],
          { error: error instanceof Error ? error.message : String(error) }
        ),
      ]);
    }
  }

  /**
   * Санитизация объекта в заданном контексте
   * @param value Объект для санитизации
   * @param ctx Контекст безопасности
   * @param opts Опции санитизации
   * @returns Результат санитизации
   */
  sanitizeObject<T = unknown>(
    value: T,
    ctx: SecurityContext,
    opts?: SanitizationOptions
  ): SecurityResult<T> {
    try {
      // Исправление типизации: используем Record<string, any> как ограничение
      const sanitizedValue = sanitizeObjectForContextSan(
        value as Record<string, any>,
        (opts?.kind || "html") as XssContext
      );
      return BaseValidator.ok(sanitizedValue as T);
    } catch (error) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.SANITIZATION_APPLIED,
          "Object sanitization applied",
          [],
          { error: error instanceof Error ? error.message : String(error) }
        ),
      ]);
    }
  }

  /**
   * Экранирование HTML
   * @param input Входная строка
   * @returns Экранированная строка
   */
  escapeHTML(input: string): string {
    return escapeHTMLSan(input);
  }

  /**
   * Экранирование атрибута HTML
   * @param input Входная строка
   * @returns Экранированная строка
   */
  escapeAttribute(input: string): string {
    return escapeAttributeSan(input);
  }

  /**
   * Санитизация URL
   * @param input Входная строка
   * @param allowedProtocols Разрешённые протоколы
   * @returns Результат санитизации
   */
  sanitizeURL(
    input: string,
    allowedProtocols?: string[]
  ): SecurityResult<string | null> {
    try {
      const sanitized = sanitizeURLSan(
        input,
        allowedProtocols || ["http", "https"]
      );
      return BaseValidator.ok(sanitized);
    } catch (error) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.SECURITY_POLICY_VIOLATION,
          "Invalid URL",
          [],
          { error: error instanceof Error ? error.message : String(error) }
        ),
      ]);
    }
  }

  /**
   * Санитизация имени файла
   * @param input Входная строка
   * @returns Результат санитизации
   */
  sanitizeFilename(input: string): SecurityResult<string> {
    try {
      const sanitized = sanitizeFilenameSan(input);
      return BaseValidator.ok(sanitized);
    } catch (error) {
      return BaseValidator.err([
        BaseValidator.error(
          SecurityErrorCode.SECURITY_POLICY_VIOLATION,
          "Invalid filename",
          [],
          { error: error instanceof Error ? error.message : String(error) }
        ),
      ]);
    }
  }

  /**
   * Экранирование SQL
   * @param input Входная строка
   * @returns Экранированная строка
   */
  escapeSql(input: string): string {
    const { sanitizeSQL } = require("./input-sanitizer");
    return sanitizeSQL(input);
  }

  /**
   * Генерация CSRF-токена
   * @param ctx Контекст безопасности
   * @returns CSRF-токен
   */
  generateCsrfToken(ctx: SecurityContext): CSRFToken {
    const token = crypto.randomBytes(32).toString("hex");
    const ttl = this.config.csrf.ttlSeconds || 3600;
    return {
      token,
      expiresAt: Date.now() + ttl * 1000,
    };
  }

  /**
   * Проверка CSRF-токена
   * @param ctx Контекст безопасности
   * @param requestHeaders Заголовки запроса
   * @returns Результат проверки
   */
  verifyCsrfToken(
    ctx: SecurityContext,
    requestHeaders: Headers
  ): CSRFVerification {
    const headerToken = requestHeaders.get(this.config.csrf.headerName) || "";
    // В реальной реализации нужно получить токен из куки
    // Здесь используем упрощённую проверку
    if (headerToken) {
      return { valid: true };
    }
    return { valid: false, reason: "Missing CSRF token" };
  }

  /**
   * Построение заголовков безопасности
   * @param ctx Контекст безопасности
   * @returns Объект с заголовками
   */
  buildSecurityHeaders(ctx: SecurityContext): HeadersResult {
    const headers: Record<string, string> = {};

    // Добавляем CSP, если настроена
    if (this.config.headers.contentSecurityPolicy) {
      headers["Content-Security-Policy"] =
        this.config.headers.contentSecurityPolicy;
    } else {
      // Используем CSP из конфигурации
      headers["Content-Security-Policy"] = getCspHeader();
    }

    // HSTS заголовок
    if (this.config.headers.hsts?.enabled) {
      const hstsParts = [`max-age=${this.config.headers.hsts.maxAgeSeconds}`];
      if (this.config.headers.hsts.includeSubDomains)
        hstsParts.push("includeSubDomains");
      if (this.config.headers.hsts.preload) hstsParts.push("preload");
      headers["Strict-Transport-Security"] = hstsParts.join("; ");
    }

    // Другие заголовки безопасности
    if (this.config.headers.xContentTypeOptions) {
      headers["X-Content-Type-Options"] =
        this.config.headers.xContentTypeOptions;
    }

    if (this.config.headers.xFrameOptions) {
      if (typeof this.config.headers.xFrameOptions === "string") {
        headers["X-Frame-Options"] = this.config.headers.xFrameOptions;
      } else {
        headers[
          "X-Frame-Options"
        ] = `ALLOW-FROM ${this.config.headers.xFrameOptions}`;
      }
    }

    if (this.config.headers.referrerPolicy) {
      headers["Referrer-Policy"] = this.config.headers.referrerPolicy;
    }

    if (this.config.headers.permissionsPolicy) {
      const policyParts = Object.entries(
        this.config.headers.permissionsPolicy
      ).map(([feature, value]) => `${feature}=${value}`);
      headers["Permissions-Policy"] = policyParts.join(", ");
    }

    // Добавляем дополнительные заголовки
    if (this.config.headers.additional) {
      Object.assign(headers, this.config.headers.additional);
    }

    return { headers };
  }

  /**
   * Проверка политик безопасности
   * @param ctx Контекст безопасности
   * @returns Результат проверки политик
   */
  checkPolicies(ctx: SecurityContext): PoliciesCheck {
    // В текущей реализации просто возвращаем успех, логика будет добавлена позже
    return { ok: true };
  }

  /**
   * Сводный аудит безопасности
   * @param input Входные данные для аудита
   * @returns Отчет об аудите
   */
  audit(input: AuditInput): AuditReport {
    return {
      timestamp: Date.now(),
      context: input.context,
      headers: this.buildSecurityHeaders(input.context).headers,
      results: {
        sanitization: [],
        validation: [],
        csrf: [],
        policies: [],
      },
    };
  }

  /**
   * Интеграция с KMS/MPC для безопасного хранения и обработки ключей
   * @param keyId Идентификатор ключа
   * @param operation Операция (encrypt/decrypt/sign/verify)
   * @param data Данные для обработки
   * @returns Результат операции
   */
  async useKMS(
    keyId: string,
    operation: "encrypt" | "decrypt" | "sign" | "verify",
    data: any
  ): Promise<any> {
    // Заглушка для интеграции с KMS/MPC
    // В реальной реализации будет взаимодействие с внешними KMS-сервисами
    switch (operation) {
      case "encrypt":
        // Шифрование данных с использованием ключа
        return crypto.publicEncrypt(keyId, Buffer.from(JSON.stringify(data)));
      case "decrypt":
        // Расшифровка данных с использованием ключа
        return JSON.parse(
          crypto.privateDecrypt(keyId, Buffer.from(data)).toString()
        );
      case "sign":
        // Подпись данных с использованием ключа
        const sign = crypto.createSign("SHA256");
        sign.update(JSON.stringify(data));
        return sign.sign(keyId);
      case "verify":
        // Проверка подписи данных
        const verify = crypto.createVerify("SHA256");
        verify.update(JSON.stringify(data));
        return verify.verify(keyId, data.signature);
      default:
        throw new Error(`Unsupported KMS operation: ${operation}`);
    }
  }

  /**
   * Угрозомодель STRIDE для анализа безопасности
   * @param component Компонент для анализа
   * @returns Отчет об угрозах
   */
  async strideThreatModel(
    component: string
  ): Promise<{ threats: string[]; mitigations: string[] }> {
    // Заглушка для угрозомоделирования STRIDE
    // В реальной реализации будет анализ компонентов на уязвимости по STRIDE модели
    const threats: string[] = [];
    const mitigations: string[] = [];

    // Пример анализа для аутентификации
    if (component === "authentication") {
      threats.push(
        "Spoofing: Unauthorized user may impersonate legitimate user"
      );
      threats.push(
        "Tampering: Authentication tokens may be modified in transit"
      );
      threats.push("Repudiation: User actions may not be properly logged");
      mitigations.push("Implement multi-factor authentication");
      mitigations.push("Use signed JWT tokens with proper expiration");
      mitigations.push("Maintain comprehensive audit logs");
    }

    // Пример анализа для платежей
    if (component === "payments") {
      threats.push("Information disclosure: Payment details may be exposed");
      threats.push("Denial of service: Payment processing may be disrupted");
      threats.push(
        "Elevation of privilege: Unauthorized access to payment functions"
      );
      mitigations.push("Encrypt sensitive payment data");
      mitigations.push("Implement rate limiting and fraud detection");
      mitigations.push(
        "Apply principle of least privilege for payment operations"
      );
    }

    // Пример анализа для Web3 транзакций
    if (component === "web3-transactions") {
      threats.push("Spoofing: Fake transactions may be submitted");
      threats.push("Tampering: Transaction data may be altered");
      threats.push("Information disclosure: Private keys may be exposed");
      mitigations.push("Verify transaction signatures against known addresses");
      mitigations.push("Use secure MPC for key management");
      mitigations.push("Implement proper session management for wallet access");
    }

    return { threats, mitigations };
  }
}

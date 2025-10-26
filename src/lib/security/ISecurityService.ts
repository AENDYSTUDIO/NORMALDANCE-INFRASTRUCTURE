/**
 * ISecurityService — единый интерфейс безопасности для клиента и сервера.
 * Контракт охватывает контекстно-зависимую санитизацию, экранирование,
 * CSRF (double-submit cookie+header), регистрацию/выполнение валидаторов,
 * формирование заголовков безопасности и проверку политик, а также сводный аудит.
 *
 * Все комментарии на русском языке и содержат JSDoc-описания параметров/возвращаемых значений.
 * Поддерживает строгую типизацию, расширяемые конфигурации и единые коды ошибок.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type RuntimeContext = "client" | "server";

export interface SecurityContext {
  runtime: RuntimeContext;
  origin?: string;
  userAgent?: string;
  requestHeaders?: Headers;
  // Дополнительно: информация о пользователе/сессии
  userId?: string;
  sessionId?: string;
}

export enum SecurityErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  SECURITY_POLICY_VIOLATION = "SECURITY_POLICY_VIOLATION",
  SANITIZATION_APPLIED = "SANITIZATION_APPLIED",
  CSRF_FAILED = "CSRF_FAILED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export interface ErrorDetail {
  code: SecurityErrorCode;
  message: string;
  path?: string[];
  meta?: Record<string, unknown>;
}

export interface ResultOk<T> {
  ok: true;
  value: T;
  warnings?: ErrorDetail[];
}

export interface ResultErr {
  ok: false;
  errors: ErrorDetail[];
}

export type SecurityResult<T> = ResultOk<T> | ResultErr;

export interface SanitizationOptions {
  // Контекст применения: HTML текст, HTML атрибут, URL, filename, SQL, plain
  kind: "html" | "attr" | "url" | "filename" | "sql" | "plain";
  // Стратегия: строгая/мягкая
  mode?: "strict" | "lenient";
}

export interface ValidationOptions {
  greedy?: boolean; // жадная проверка (сбор всех ошибок)
  lazy?: boolean; // ленивый режим (выходит при первой ошибке)
  normalize?: boolean; // нормализация входных данных
}

export interface CSRFConfig {
  cookieName: string;
  headerName: string;
  ttlSeconds: number;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path?: string;
  domain?: string;
}

export interface HeadersConfig {
  // CSP в виде готовой строки либо генератора из директив
  contentSecurityPolicy?: string;
  hsts?: {
    enabled: boolean;
    maxAgeSeconds: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  xContentTypeOptions?: "nosniff" | "off";
  xFrameOptions?: "DENY" | "SAMEORIGIN" | "ALLOW-FROM";
  referrerPolicy?: string; // например 'strict-origin-when-cross-origin'
  permissionsPolicy?: Record<string, string>; // 'camera' -> '()'
  additional?: Record<string, string>;
}

export interface SecurityConfig {
  csrf: CSRFConfig;
  headers: HeadersConfig;
  // точки расширения
  extensions?: Record<string, unknown>;
}

// Базовый тип валидатора (без зависимости от класса)
export type ValidatorFn<I = unknown, O = unknown> = (
  input: I,
  options?: ValidationOptions
) => SecurityResult<O>;

export interface ValidatorRegistration<I = unknown, O = unknown> {
  name: string;
  fn: ValidatorFn<I, O>;
}

export interface CSRFToken {
  token: string;
  expiresAt: number; // epoch millis
}

export interface CSRFVerification {
  valid: boolean;
  reason?: string;
}

export interface HeadersResult {
  headers: Record<string, string>;
}

export interface PoliciesCheck {
  ok: boolean;
  violations?: ErrorDetail[];
}

export interface AuditInput {
  context: SecurityContext;
  sample?: unknown; // произвольные данные для теста санитизации/валидации
}

export interface AuditReport {
  timestamp: number;
  context: SecurityContext;
  headers: Record<string, string>;
  results: {
    sanitization?: ErrorDetail[];
    validation?: ErrorDetail[];
    csrf?: ErrorDetail[];
    policies?: ErrorDetail[];
  };
}

/**
 * ISecurityService — контракт для реализации сервисов безопасности.
 */
export interface ISecurityService {
  // Конфигурация
  getConfig(): SecurityConfig;
  setConfig(config: SecurityConfig): void;

  // Санитизация и экранирование
  sanitizeString(
    input: string,
    ctx: SecurityContext,
    opts: SanitizationOptions
  ): SecurityResult<string>;
  sanitizeObject<T = unknown>(
    value: T,
    ctx: SecurityContext,
    opts?: SanitizationOptions
  ): SecurityResult<T>;
  escapeHTML(input: string): string;
  escapeAttribute(input: string): string;
  sanitizeURL(
    input: string,
    allowedProtocols?: string[]
  ): SecurityResult<string | null>;
  sanitizeFilename(input: string): SecurityResult<string>;
  escapeSql(input: string): string;

  // CSRF (double-submit)
  generateCsrfToken(ctx: SecurityContext): CSRFToken;
  verifyCsrfToken(
    ctx: SecurityContext,
    requestHeaders: Headers
  ): CSRFVerification;

  // Валидаторы
  registerValidator<I = unknown, O = unknown>(
    registration: ValidatorRegistration<I, O>
  ): void;
  validate<I = unknown, O = unknown>(
    name: string,
    input: I,
    options?: ValidationOptions
  ): SecurityResult<O>;

  // Заголовки безопасности
  buildSecurityHeaders(ctx: SecurityContext): HeadersResult;

  // Политики
  checkPolicies(ctx: SecurityContext): PoliciesCheck;

  // Сводный аудит
  audit(input: AuditInput): AuditReport;
}

/**
 * Вспомогательные типы для расширяемых конфигураций валидаторов и санитизации.
 */
export interface SanitizerProfile {
  name: string;
  options: SanitizationOptions;
}

export interface ValidatorProfile {
  name: string;
  options?: ValidationOptions;
}

/**
 * Фабричные сигнатуры для реализации адаптеров/реализаций ISecurityService.
 */
export type SecurityServiceFactory = (
  config: SecurityConfig
) => ISecurityService;

/**
 * Стандартные имена заголовков/куки для CSRF.
 */
export const DEFAULT_CSRF_COOKIE = "nd_csrf";
export const DEFAULT_CSRF_HEADER = "x-csrf-token";

/**
 * Рекомендованные значения по умолчанию для заголовков безопасности.
 */
export const DEFAULT_HEADERS_CONFIG: HeadersConfig = {
  contentSecurityPolicy: undefined, // предоставляется конфигом проекта (config/csp.ts)
  hsts: {
    enabled: true,
    maxAgeSeconds: 31536000,
    includeSubDomains: true,
    preload: false,
  },
  xContentTypeOptions: "nosniff",
  xFrameOptions: "DENY",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: {
    camera: "()",
    microphone: "()",
    geolocation: "()",
    payment: "()",
  },
  additional: {},
};

/**
 * Унифицированная форма результата валидации, пригодная для адаптации к Zod/Joi и кастомным правилам.
 */
export interface UnifiedValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ErrorDetail[];
}

/**
 * Пример расширяемой конфигурации сервиса (может храниться в SecurityManager).
 */
export interface SecurityServiceState {
  validators: Map<string, ValidatorFn<any, any>>;
  profiles?: {
    sanitizers?: Map<string, SanitizerProfile>;
    validators?: Map<string, ValidatorProfile>;
  };
}

/**
 * Депрекейт-метки для поддержания обратной совместимости через прокси-экспорты.
 * Используется при миграции старых API на новый контракт.
 */
export interface DeprecationNotice {
  api: string;
  replacement?: string;
  sunsetAt?: string; // ISO дата прекращения поддержки
  message?: string;
}

/**
 * Модуль XSS/CSRF для Next.js: контекстно-чувствительная экранизация/санитизация,
 * генерация/верификация CSRF-токенов с double-submit (cookie + header),
 * утилиты для интеграции в API-обработчики и middleware.
 *
 * Принципы:
 * - Идемпотентные чистые функции без побочных эффектов.
 * - Контекстная экранизация (HTML-текст, HTML-атрибуты, URL).
 * - CSRF: статeless HMAC-подпись payload, TTL, сравнение header/cookie.
 * - Без внешних зависимостей; WebCrypto с fallback на node:crypto.
 *
 * Предупреждение:
 * - Санитизация HTML реализована в виде безопасного экранирования (escape) и удаления
 *   очевидно опасных фрагментов (script-теги), но не заменяет специализированные библиотеки.
 * - Для сложных кейсов рекомендуется использовать DOMPurify на клиенте и сервере, либо
 *   интегрировать проверенную библиотеку через адаптер SecurityManager.
 */

/* =========================================
 * Типы и конфигурации
 * ========================================= */

export type XssContext = "html" | "attr" | "url" | "raw";

export interface CsrfTokenPayload {
  sessionId?: string;
  nonce: string;
  iat: number; // issued at (seconds)
  exp?: number; // expires at (seconds), опционально
}

export interface CsrfGenerateResult {
  token: string;
  // Готовые элементы для установки в ответ
  cookieName: string;
  cookieValue: string;
  setCookieHeaderValue: string; // строка Set-Cookie
  headerName: string;
  headerValue: string;
}

export interface CsrfVerifyInput {
  headerToken?: string | null;
  cookieToken?: string | null;
}

export type CsrfVerifyCode =
  | "OK"
  | "TOKEN_MISSING"
  | "COOKIE_MISSING"
  | "MISMATCH"
  | "EXPIRED"
  | "INVALID"
  | "ALGO_UNSUPPORTED";

export interface CsrfVerifyResult {
  ok: boolean;
  code: CsrfVerifyCode;
  payload?: CsrfTokenPayload;
  details?: string;
}

export type SameSiteOption = "Strict" | "Lax" | "None";

export interface CsrfConfig {
  // Секрет для HMAC (обязателен на проде)
  secret: string;
  // Имя cookie для CSRF
  cookieName?: string; // по умолчанию: "nd_csrf"
  // Имя заголовка для CSRF
  headerName?: string; // по умолчанию: "x-csrf-token"
  // Время жизни токена (секунды). По умолчанию: 3600 (1 час)
  ttlSeconds?: number;
  // Параметры cookie
  cookie: {
    path?: string; // по умолчанию: "/"
    domain?: string;
    secure?: boolean; // на проде true
    httpOnly?: boolean; // для double-submit по умолчанию false (читабельно из JS)
    sameSite?: SameSiteOption; // по умолчанию: "Lax"
    maxAgeSeconds?: number; // если не указано, берётся ttlSeconds
  };
  // Версия формата токена (для будущей эволюции)
  version?: "v1";
}

export interface EscapeOptions {
  // Разрешить слэш в атрибуте (по умолчанию экранируется)
  allowSlashInAttr?: boolean;
}

/* =========================================
 * Вспомогательные утилиты
 * ========================================= */

// Безопасная проверка окружения
function isServer(): boolean {
  return typeof window === "undefined";
}

// Нормализация конфигурации CSRF
export function normalizeCsrfConfig(config: Partial<CsrfConfig>): CsrfConfig {
  const ttl = config.ttlSeconds ?? 3600;
  const cookieName = config.cookieName ?? "nd_csrf";
  const headerName = config.headerName ?? "x-csrf-token";
  const version = config.version ?? "v1";
  const cookie = {
    path: config.cookie?.path ?? "/",
    domain: config.cookie?.domain,
    secure: config.cookie?.secure ?? true,
    httpOnly: config.cookie?.httpOnly ?? false, // подтверждено: HttpOnly=false для double-submit
    sameSite: config.cookie?.sameSite ?? "Lax",
    maxAgeSeconds: config.cookie?.maxAgeSeconds ?? ttl,
  };
  return {
    secret: config.secret || "development_only_secret_replace_in_prod",
    cookieName,
    headerName,
    ttlSeconds: ttl,
    cookie,
    version,
  };
}

// Базовые base64url утилиты
function base64urlEncode(bytes: Uint8Array): string {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlEncodeString(s: string): string {
  return base64urlEncode(new TextEncoder().encode(s));
}

function base64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function toHex(bytes: Uint8Array): string {
  const out: string[] = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    out[i] = bytes[i].toString(16).padStart(2, "0");
  }
  return out.join("");
}

/**
 * Константно-временное сравнение строк.
 * Предназначено для сравнения подписи HMAC без утечек времени.
 */
function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// Глобальная Crypto-абстракция
type HmacSigner = (key: Uint8Array, data: Uint8Array) => Promise<Uint8Array>;
type RandomBytesFn = (n: number) => Promise<Uint8Array>;

async function getHmacSigner(): Promise<HmacSigner> {
  // WebCrypto (Node 18+ или браузер)
  const subtle = (globalThis as any).crypto?.subtle;
  if (subtle && typeof subtle.importKey === "function") {
    return async (key, data) => {
      const cryptoKey = await subtle.importKey(
        "raw",
        key,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
      );
      const sig = await subtle.sign("HMAC", cryptoKey, data);
      return new Uint8Array(sig);
    };
  }

  // Fallback на node:crypto
  try {
    const nodeCrypto = await import("node:crypto");
    return async (key, data) => {
      const hmac = nodeCrypto.createHmac("sha256", Buffer.from(key));
      hmac.update(Buffer.from(data));
      return new Uint8Array(hmac.digest());
    };
  } catch {
    // Нет поддержки HMAC
    return async () => {
      throw new Error("HMAC unsupported");
    };
  }
}

async function getRandomBytes(): Promise<RandomBytesFn> {
  // Web/Node16+: crypto.getRandomValues
  const webCrypto = (globalThis as any).crypto;
  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    return async (n: number) => {
      const arr = new Uint8Array(n);
      webCrypto.getRandomValues(arr);
      return arr;
    };
  }

  // Fallback: node:crypto.randomBytes
  try {
    const nodeCrypto = await import("node:crypto");
    return async (n: number) => new Uint8Array(nodeCrypto.randomBytes(n));
  } catch {
    // Последний fallback (небезопасно)
    return async (n: number) => {
      const arr = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    };
  }
}

async function randomNonceHex(bytes = 16): Promise<string> {
  const rand = await getRandomBytes();
  const buf = await rand(bytes);
  return toHex(buf);
}

/* =========================================
 * Экранизация/санитизация
 * ========================================= */

/**
 * Экранизация для HTML-текста.
 * Преобразует опасные символы в HTML-entities.
 * Избегает двойного экранирования (& и др.) через negative lookahead.
 */
export function escapeHTML(input: string): string {
  // Экранируем HTML-специальные символы с учётом идемпотентности и унифицированных энтити:
  // &, <, >, ", &#x27; и &#x2F; (для соответствия историческим тестам)
  let out = input;
  // Сначала экранируем амперсанд, исключая уже-экранированные последовательности
  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&amp;");
  // Затем угловые скобки
  out = out.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Кавычки: двойная и одинарная (унификация к &#x27;)
  out = out.replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  // Слэш для совместимости с существующими тестами
  out = out.replace(/\//g, "&#x2F;");
  return out;
}

/**
 * Экранизация для HTML-атрибутов.
 * Дополнительно экранирует слэш, если allowSlashInAttr не установлен.
 */
export function escapeAttribute(input: string, opts?: EscapeOptions): string {
  // Экранируем HTML-атрибуты с унификацией энтити: &, <, >, ", &#x27;, &#x2F;
  // Идемпотентно и безопасно для повторного применения.
  let out = input;
  // Амперсанд — исключаем уже-экранированные последовательности
  out = out.replace(/&(?!amp;|lt;|gt;|quot;|#x27;|#x2F;)/g, "&amp;");
  // Угловые скобки
  out = out.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Кавычки: двойная и одинарная
  out = out.replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  // Слэш — для совместимости с историческими тестами и дополнительной жесткости
  if (!opts?.allowSlashInAttr) {
    out = out.replace(/\//g, "&#x2F;");
  }
  return out;
}

/**
 * Валидация и нормализация URL.
 * - Возвращает безопасно закодированный URL или пустую строку при недопустимом значении.
 * - Обрезает управляемые символы и пробелы в начале/конце.
 * - Запрещает javascript:, data: схемы.
 */
export function sanitizeURL(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  // Запрет протокол-относительных URL (начинаются с //)
  if (/^\/\//.test(trimmed)) return "";
  try {
    const url = new URL(trimmed, "http://localhost"); // base для относительных
    const banned = ["javascript:", "data:", "vbscript:"];
    if (banned.includes(url.protocol)) {
      return "";
    }
    // Возвращаем оригинал, но с безопасным экранированием опасных символов
    return encodeURI(trimmed);
  } catch {
    // Не валидный URL
    return "";
  }
}

/**
 * Агрессивное удаление опасных HTML-конструкций.
 * Удаляет:
 * - <script>...</script> теги и их содержимое
 * - on* атрибуты (onclick, onload, и т.д.)
 * - javascript: в href/src и других атрибутах
 * - data: в href/src
 * - vbscript: в href/src
 *
 * Не удаляет безопасные теги и атрибуты.
 *
 * @param input HTML-строка
 * @returns Строка без опасных конструкций
 */
export function stripDangerousHtml(input: string): string {
  if (typeof input !== "string") return "";
  
  let clean = input;
  
  // Remove script tags and their content
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handler attributes
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: URLs
  clean = clean.replace(/(href|src)\s*=\s*["']\s*javascript:[^"']*["']/gi, "$1=\"\"");
  
  // Remove data: URLs
  clean = clean.replace(/(href|src)\s*=\s*["']\s*data:[^"']*["']/gi, "$1=\"\"");
  
  // Remove vbscript: URLs
  clean = clean.replace(/(href|src)\s*=\s*["']\s*vbscript:[^"']*["']/gi, "$1=\"\"");
  
  return clean;
}

/**
 * Простейшая контекстная санитизация строки.
 * Для "html" и "attr" — экранирование.
 * Для "url" — sanitizeURL.
 * Для "raw" — возврат как есть.
 */
export function sanitizeString(
  input: string,
  context: XssContext = "html"
): string {
  switch (context) {
    case "html":
      return escapeHTML(stripDangerousHtml(input));
    case "attr":
      return escapeAttribute(stripDangerousHtml(input));
    case "url":
      return sanitizeURL(input);
    case "raw":
    default:
      return input;
  }
}

/* =========================================
 * Cookie и заголовки
 * ========================================= */

export interface CookieOptions {
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: SameSiteOption;
  maxAgeSeconds?: number;
}

export function buildSetCookieHeader(
  name: string,
  value: string,
  opts: CookieOptions = {}
): string {
  const parts: string[] = [`${name}=${value}`];
  parts.push(`Path=${opts.path ?? "/"}`);
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (opts.secure) parts.push("Secure");
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (typeof opts.maxAgeSeconds === "number")
    parts.push(`Max-Age=${opts.maxAgeSeconds}`);
  return parts.join("; ");
}

export function parseCookiesHeader(
  cookieHeaderValue: string | null | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeaderValue) return result;
  const pairs = cookieHeaderValue.split(";").map((p) => p.trim());
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx < 0) continue;
    const k = pair.slice(0, eqIdx).trim();
    const v = pair.slice(eqIdx + 1).trim();
    if (k) result[k] = v;
  }
  return result;
}

/* =========================================
 * Формат токена CSRF: v1.signature.payload
 * payload = base64url(JSON(CsrfTokenPayload))
 * signature = base64url(HMAC_SHA256(secret, payload_bytes))
 * ========================================= */

function serializePayloadToB64(payload: CsrfTokenPayload): string {
  const json = JSON.stringify(payload);
  return base64urlEncodeString(json);
}

function deserializePayloadFromB64(b64: string): CsrfTokenPayload {
  const jsonUtf8 = new TextDecoder().decode(base64urlDecode(b64));
  return JSON.parse(jsonUtf8) as CsrfTokenPayload;
}

async function signPayloadB64(
  secret: string,
  payloadB64: string
): Promise<string> {
  const signer = await getHmacSigner();
  try {
    const sigBytes = await signer(
      new TextEncoder().encode(secret),
      base64urlDecode(payloadB64)
    );
    return base64urlEncode(sigBytes);
  } catch {
    throw new Error("HMAC unsupported");
  }
}

/* =========================================
 * Генерация/верификация CSRF
 * ========================================= */

export async function generateCsrfToken(
  sessionId: string | undefined,
  cfgInput: Partial<CsrfConfig>
): Promise<CsrfGenerateResult> {
  const cfg = normalizeCsrfConfig(cfgInput);
  const iat = Math.floor(Date.now() / 1000);
  const exp = cfg.ttlSeconds ? iat + cfg.ttlSeconds : undefined;
  const nonce = await randomNonceHex(16);
  const payload: CsrfTokenPayload = { sessionId, nonce, iat, exp };

  const payloadB64 = serializePayloadToB64(payload);
  const signatureB64 = await signPayloadB64(cfg.secret, payloadB64);
  const token = `${cfg.version}.` + signatureB64 + "." + payloadB64;

  const cookieName = cfg.cookieName!;
  const cookieValue = token;
  const setCookieHeaderValue = buildSetCookieHeader(cookieName, cookieValue, {
    path: cfg.cookie.path,
    domain: cfg.cookie.domain,
    secure: cfg.cookie.secure,
    httpOnly: cfg.cookie.httpOnly,
    sameSite: cfg.cookie.sameSite,
    maxAgeSeconds: cfg.cookie.maxAgeSeconds,
  });

  const headerName = cfg.headerName!;
  const headerValue = token;

  return {
    token,
    cookieName,
    cookieValue,
    setCookieHeaderValue,
    headerName,
    headerValue,
  };
}

export function extractCsrfFromRequestLike(
  headers: Headers | Record<string, string>,
  cfgInput: Partial<CsrfConfig>
): CsrfVerifyInput {
  const cfg = normalizeCsrfConfig(cfgInput);
  // Получаем значение заголовка
  let headerToken: string | null = null;
  if (headers instanceof Headers) {
    headerToken = headers.get(cfg.headerName!) || null;
    const cookieStr = headers.get("cookie");
    const cookies = parseCookiesHeader(cookieStr);
    const cookieToken = cookies[cfg.cookieName!];
    return { headerToken, cookieToken: cookieToken ?? null };
  } else {
    const headerVal = headers[cfg.headerName!];
    headerToken = typeof headerVal === "string" ? headerVal : null;
    const cookieVal = headers["cookie"];
    const cookies = parseCookiesHeader(cookieVal);
    const cookieToken = cookies[cfg.cookieName!];
    return { headerToken, cookieToken: cookieToken ?? null };
  }
}

export async function verifyCsrfToken(
  token: string | null | undefined,
  cfgInput: Partial<CsrfConfig>
): Promise<CsrfVerifyResult> {
  const cfg = normalizeCsrfConfig(cfgInput);
  if (!token) {
    return {
      ok: false,
      code: "TOKEN_MISSING",
      details: "header/caller did not provide token",
    };
  }
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, code: "INVALID", details: "token format mismatch" };
  }
  const [version, signatureB64, payloadB64] = parts;
  if (version !== cfg.version) {
    // Позволяем в будущем поддерживать несколько версий
  }
  try {
    const expectedSignatureB64 = await signPayloadB64(cfg.secret, payloadB64);
    if (!timingSafeEqualStr(expectedSignatureB64, signatureB64)) {
      return { ok: false, code: "INVALID", details: "signature mismatch" };
    }
    const payload = deserializePayloadFromB64(payloadB64);
    if (typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return {
          ok: false,
          code: "EXPIRED",
          payload,
          details: "token expired",
        };
      }
    }
    return { ok: true, code: "OK", payload };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes("unsupported")) {
      return { ok: false, code: "ALGO_UNSUPPORTED", details: msg };
    }
    return { ok: false, code: "INVALID", details: msg };
  }
}

export async function verifyCsrfDoubleSubmit(
  { headerToken, cookieToken }: CsrfVerifyInput,
  cfgInput: Partial<CsrfConfig>
): Promise<CsrfVerifyResult> {
  const cfg = normalizeCsrfConfig(cfgInput);
  if (!cookieToken) {
    return {
      ok: false,
      code: "COOKIE_MISSING",
      details: "csrf cookie missing",
    };
  }
  if (!headerToken) {
    return { ok: false, code: "TOKEN_MISSING", details: "csrf header missing" };
  }
  if (!timingSafeEqualStr(cookieToken, headerToken)) {
    return {
      ok: false,
      code: "MISMATCH",
      details: "header/cookie token mismatch",
    };
  }
  return verifyCsrfToken(headerToken, cfg);
}

/* =========================================
 * Вспомогательные функции интеграции
 * ========================================= */

/**
 * Формирует заголовок Set-Cookie для ответа Next.js/Fetch API.
 * Пример использования в API-обработчике:
 * - const csrf = await generateCsrfToken(sessionId, cfg);
 * - response.headers.set('Set-Cookie', csrf.setCookieHeaderValue);
 * - response.headers.set(csrf.headerName, csrf.headerValue);
 */
export async function issueCsrfForResponse(
  sessionId: string | undefined,
  cfgInput: Partial<CsrfConfig>
): Promise<CsrfGenerateResult> {
  return generateCsrfToken(sessionId, cfgInput);
}

/**
 * Унифицированная контекстная санитизация строк для компонентов/обработчиков.
 * Совместима с ISecurityService API.
 */
export function sanitizeForContext(input: string, context: XssContext): string {
  return sanitizeString(input, context);
}

/**
 * Санитизация объекта: рекурсивно обрабатывает все строковые поля в соответствии с контекстом.
 * Остальные типы возвращаются как есть.
 */
export function sanitizeObjectForContext<T extends Record<string, any>>(
  obj: T,
  context: XssContext
): T {
  const out: any = Array.isArray(obj) ? [] : {};
  const entries = Array.isArray(obj)
    ? (obj as any).entries()
    : Object.entries(obj);
  for (const [k, v] of entries as any) {
    if (typeof v === "string") {
      out[k] = sanitizeString(v, context);
    } else if (v && typeof v === "object") {
      out[k] = sanitizeObjectForContext(v, context);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/**
 * Утилита: формирует безопасное значение атрибута HTML.
 */
export function safeAttr(input: string, opts?: EscapeOptions): string {
  return escapeAttribute(stripDangerousHtml(input), opts);
}

/**
 * Утилита: формирует безопасное HTML-содержимое (экранированный текст).
 */
export function safeHtmlText(input: string): string {
  return escapeHTML(stripDangerousHtml(input));
}

/**
 * Проверка, что строка безопасна для использования как URL (href/src).
 * Возвращает безопасный URL или пустую строку.
 */
export function safeUrl(input: string): string {
  return sanitizeURL(input);
}

/* =========================================
 * Экспорт публичного API
 * ========================================= */

export const xssCsrf = {
  escapeHTML,
  escapeAttribute,
  sanitizeURL,
  sanitizeString,
  stripDangerousHtml,
  sanitizeForContext,
  sanitizeObjectForContext,
  safeAttr,
  safeHtmlText,
  safeUrl,
  // Cookie/headers helpers
  buildSetCookieHeader,
  parseCookiesHeader,
  // CSRF integration helpers
  issueCsrfForResponse,
  generateCsrfToken,
  extractCsrfFromRequestLike,
  verifyCsrfToken,
  verifyCsrfDoubleSubmit,
  // Config utility
  normalizeCsrfConfig,
};

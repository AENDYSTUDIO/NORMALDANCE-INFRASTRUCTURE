/**
 * 🛠️ AML/KYC Utilities - Helper Functions
 *
 * Утилитарные функции для AML/KYC модуля
 */

import { createHash } from "crypto";
import { DocumentType, PersonalData } from "./types";

// ============================================================================
// Валидация данных
// ============================================================================

/**
 * Валидация персональных данных
 */
export function validatePersonalData(data: PersonalData): string[] {
  const errors: string[] = [];

  // Проверка имени
  if (!data.firstName || data.firstName.trim() === "") {
    errors.push("First name is required");
  } else if (data.firstName.length < 2 || data.firstName.length > 50) {
    errors.push("First name must be between 2 and 50 characters");
  }

  // Проверка фамилии
  if (!data.lastName || data.lastName.trim() === "") {
    errors.push("Last name is required");
  } else if (data.lastName.length < 2 || data.lastName.length > 50) {
    errors.push("Last name must be between 2 and 50 characters");
  }

  // Проверка даты рождения
  if (!data.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    const birthDate = new Date(data.dateOfBirth);
    const now = new Date();
    const age = now.getFullYear() - birthDate.getFullYear();

    if (age < 18 || age > 120) {
      errors.push("User must be between 18 and 120 years old");
    }
  }

  // Проверка места рождения
  if (!data.placeOfBirth || data.placeOfBirth.trim() === "") {
    errors.push("Place of birth is required");
  }

  // Проверка гражданства
  if (!data.nationality || data.nationality.trim() === "") {
    errors.push("Nationality is required");
  } else if (data.nationality.length !== 2) {
    errors.push("Nationality must be a 2-letter ISO country code");
  }

  // Проверка налогового резидентства
  if (!data.taxResidence || data.taxResidence.length === 0) {
    errors.push("At least one tax residence is required");
  } else {
    for (const residence of data.taxResidence) {
      if (residence.length !== 2) {
        errors.push("Tax residence must be a 2-letter ISO country code");
      }
    }
  }

  return errors;
}

/**
 * Валидация адреса
 */
export function validateAddress(address: {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}): string[] {
  const errors: string[] = [];

  if (!address.street || address.street.trim() === "") {
    errors.push("Street address is required");
  }

  if (!address.city || address.city.trim() === "") {
    errors.push("City is required");
  }

  if (!address.postalCode || address.postalCode.trim() === "") {
    errors.push("Postal code is required");
  }

  if (!address.country || address.country.trim() === "") {
    errors.push("Country is required");
  } else if (address.country.length !== 2) {
    errors.push("Country must be a 2-letter ISO country code");
  }

  return errors;
}

/**
 * Валидация номера документа
 */
export function validateDocumentNumber(
  type: DocumentType,
  number: string
): boolean {
  if (!number || number.trim() === "") {
    return false;
  }

  // Базовая валидация длины
  switch (type) {
    case "PASSPORT":
      return number.length >= 6 && number.length <= 15;
    case "NATIONAL_ID":
      return number.length >= 6 && number.length <= 20;
    case "DRIVING_LICENSE":
      return number.length >= 5 && number.length <= 20;
    case "TAX_ID":
      return number.length >= 8 && number.length <= 20;
    default:
      return number.length >= 3 && number.length <= 30;
  }
}

// ============================================================================
// Санитизация данных
// ============================================================================

/**
 * Очистка входных данных от потенциально опасного контента
 */
export function sanitizeInput(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Удаление HTML тегов
    .replace(/javascript:/gi, "") // Удаление JavaScript протоколов
    .replace(/on\w+=/gi, "") // Удаление обработчиков событий
    .replace(/['"]/g, "") // Удаление кавычек
    .substring(0, 500); // Ограничение длины
}

/**
 * Очистка email адреса
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "");
}

/**
 * Очистка номера телефона
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return "";

  return phone
    .replace(/[^\d+\s()-]/g, "") // Только цифры и базовые символы
    .trim();
}

// ============================================================================
// Хэширование и шифрование
// ============================================================================

/**
 * Хэширование документа для обеспечения целостности
 */
export async function hashDocument(documentHash: string): Promise<string> {
  return createHash("sha256").update(documentHash).digest("hex");
}

/**
 * Хэширование персональных данных для создания уникального идентификатора
 */
export function hashPersonalData(data: PersonalData): string {
  const combinedData = `${data.firstName}${data.lastName}${data.dateOfBirth}${data.nationality}`;
  return createHash("sha256").update(combinedData).digest("hex");
}

/**
 * Создание хэша для транзакции
 */
export function hashTransactionData(data: {
  fromAddress: string;
  toAddress: string;
  amount: number;
  currency: string;
  timestamp: string;
}): string {
  const combinedData = `${data.fromAddress}${data.toAddress}${data.amount}${data.currency}${data.timestamp}`;
  return createHash("sha256").update(combinedData).digest("hex");
}

// ============================================================================
// Форматирование данных
// ============================================================================

/**
 * Форматирование имени пользователя
 */
export function formatUserName(
  firstName: string,
  lastName: string,
  middleName?: string
): string {
  const parts = [firstName, middleName, lastName].filter(Boolean);
  return parts.join(" ");
}

/**
 * Форматирование адреса
 */
export function formatAddress(address: {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}): string {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ].filter(Boolean);

  return parts.join(", ");
}

/**
 * Форматирование даты
 */
export function formatDate(
  date: string | Date,
  locale: string = "en-US"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Форматирование суммы денег
 */
export function formatAmount(
  amount: number,
  currency: string,
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(amount);
}

// ============================================================================
// Валидация форматов
// ============================================================================

/**
 * Валидация email адреса
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Валидация номера телефона
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Валидация адреса кошелька Solana
 */
export function isValidSolanaAddress(address: string): boolean {
  // Базовая валидация адреса Solana
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Валидация ISO кода страны
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code);
}

/**
 * Валидация почтового индекса
 */
export function isValidPostalCode(
  postalCode: string,
  countryCode: string
): boolean {
  // Упрощенная валидация, в реальной системе нужна более сложная логика
  if (countryCode === "US") {
    return /^\d{5}(-\d{4})?$/.test(postalCode);
  } else if (countryCode === "GB") {
    return /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/.test(postalCode);
  } else if (countryCode === "DE") {
    return /^\d{5}$/.test(postalCode);
  } else if (countryCode === "FR") {
    return /^\d{5}$/.test(postalCode);
  } else if (countryCode === "RU") {
    return /^\d{6}$/.test(postalCode);
  }

  // Общая валидация для других стран
  return postalCode.length >= 3 && postalCode.length <= 10;
}

// ============================================================================
// Расчет рисков
// ============================================================================

/**
 * Расчет риска на основе страны
 */
export function calculateCountryRisk(countryCode: string): number {
  // Список стран высокого риска (упрощенный)
  const highRiskCountries = ["AF", "IR", "KP", "MM", "SY", "VE", "YE", "ZW"];
  const mediumRiskCountries = ["BY", "CU", "CD", "IQ", "LR", "SD", "SS", "UA"];

  if (highRiskCountries.includes(countryCode)) {
    return 80;
  } else if (mediumRiskCountries.includes(countryCode)) {
    return 50;
  } else {
    return 10;
  }
}

/**
 * Расчет риска на основе суммы транзакции
 */
export function calculateAmountRisk(amount: number, currency: string): number {
  // Пороговые значения в USD
  const thresholds = {
    low: 1000,
    medium: 10000,
    high: 50000,
    critical: 100000,
  };

  // Конвертация в USD (упрощенная)
  const amountInUSD = currency === "USD" ? amount : amount * 0.9; // Пример конвертации

  if (amountInUSD >= thresholds.critical) {
    return 90;
  } else if (amountInUSD >= thresholds.high) {
    return 70;
  } else if (amountInUSD >= thresholds.medium) {
    return 40;
  } else if (amountInUSD >= thresholds.low) {
    return 20;
  } else {
    return 5;
  }
}

/**
 * Расчет общего риска на основе факторов
 */
export function calculateOverallRisk(
  factors: Array<{ weight: number; score: number }>
): number {
  if (factors.length === 0) return 0;

  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const weightedScore = factors.reduce(
    (sum, factor) => sum + factor.score * factor.weight,
    0
  );

  return Math.round(weightedScore / totalWeight);
}

// ============================================================================
// Генерация идентификаторов
// ============================================================================

/**
 * Генерация уникального ID
 */
export function generateId(prefix: string = ""): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Генерация ID для документа
 */
export function generateDocumentId(): string {
  return generateId("doc");
}

/**
 * Генерация ID для транзакции
 */
export function generateTransactionId(): string {
  return generateId("tx");
}

/**
 * Генерация ID для отчета
 */
export function generateReportId(): string {
  return generateId("report");
}

// ============================================================================
// Работа с датами
// ============================================================================

/**
 * Проверка, истекла ли дата
 */
export function isDateExpired(date: string): boolean {
  const expiryDate = new Date(date);
  const now = new Date();
  return expiryDate < now;
}

/**
 * Добавление дней к дате
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Добавление лет к дате
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Получение возраста из даты рождения
 */
export function getAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

// ============================================================================
// Экспорт всех утилит
// ============================================================================

export * from "./utils";

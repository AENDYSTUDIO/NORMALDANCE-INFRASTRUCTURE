/**
 * Функции для работы с JWT-токенами
 *
 * Этот модуль предоставляет функции для создания и проверки
 * JWT-токенов, используемых для аутентификации пользователей.
 */

import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET =
  process.env.JWT_SECRET || "fallback_secret_key_for_development";

// Ключ для подписи токенов
const encoder = new TextEncoder();
const SIGNING_KEY = encoder.encode(JWT_SECRET);

/**
 * Создает JWT-токен для пользователя
 */
export async function signJWT(payload: any): Promise<string> {
  try {
    const iat = Math.floor(Date.now() / 1000); // issued at
    const exp = iat + 7 * 24 * 60 * 60; // 7 дней

    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(SIGNING_KEY);
  } catch (error) {
    console.error("Error signing JWT:", error);
    throw new Error("Failed to create JWT token");
  }
}

/**
 * Проверяет JWT-токен и возвращает payload
 */
export async function verifyJWT(token: string): Promise<any> {
  try {
    const verified = await jwtVerify(token, SIGNING_KEY);
    return verified.payload;
  } catch (error) {
    console.error("Error verifying JWT:", error);
    throw new Error("Invalid or expired token");
  }
}

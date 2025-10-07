/**
 * Функции для аутентификации через Telegram Web App
 *
 * Этот модуль предоставляет функции для валидации данных,
 * полученных от Telegram Web App, чтобы обеспечить безопасную
 * аутентификацию пользователей.
 */

import { createHmac } from "crypto";

export async function verifyTelegramWebAppData(
  initData: string,
  botToken: string
): Promise<boolean> {
  try {
    // Парсим initData
    const urlParams = new URLSearchParams(initData);
    const authDate = urlParams.get("auth_date");
    const hash = urlParams.get("hash");
    const user = urlParams.get("user");
    const chat = urlParams.get("chat");
    const start_param = urlParams.get("start_param");
    const can_send_after = urlParams.get("can_send_after");

    // Проверяем обязательные параметры
    if (!authDate || !hash || (!user && !chat)) {
      return false;
    }

    // Проверяем, что данные не слишком старые (не старше 1 часа)
    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    if (currentTimestamp - authTimestamp > 3600) {
      return false;
    }

    // Удаляем hash из параметров для проверки подписи
    urlParams.delete("hash");

    // Сортируем параметры по алфавиту и объединяем в строки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");

    // Создаем ключ шифрования из токена бота
    const secretKey = createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    // Вычисляем хеш данных
    const calculatedHash = createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    // Сравниваем вычисленный хеш с полученным
    return calculatedHash === hash;
  } catch (error) {
    console.error("Error verifying Telegram WebApp data:", error);
    return false;
  }
}

// Функция для извлечения данных пользователя из initData
export function parseTelegramUserData(initData: string) {
  try {
    const urlParams = new URLSearchParams(initData);
    const user = urlParams.get("user");

    if (user) {
      return JSON.parse(decodeURIComponent(user));
    }

    return null;
  } catch (error) {
    console.error("Error parsing Telegram user data:", error);
    return null;
  }
}

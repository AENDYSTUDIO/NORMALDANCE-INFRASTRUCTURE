/**
 * Библиотека для отправки метрик через Telegram Bot API
 *
 * Этот модуль предоставляет функции для отправки событий и метрик
 * через Telegram Bot API, что позволяет собирать аналитику без
 * использования сторонних сервисов, которые могут быть запрещены
 * в Telegram Mini App.
 */

// Получаем токен бота из переменных окружения
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Проверяем, что токен бота установлен
if (!TELEGRAM_BOT_TOKEN) {
  console.warn("TELEGRAM_BOT_TOKEN is not set. Metrics will not be sent.");
}

/**
 * Отправляет событие через Telegram Bot API
 *
 * @param chatId - ID чата пользователя
 * @param event - Объект события для отправки
 * @returns Promise<boolean> - Успешность отправки события
 */
export async function sendEvent(
  chatId: number | string,
  event: Record<string, any>
): Promise<boolean> {
  // Если токен бота не установлен, просто возвращаем true
  if (!TELEGRAM_BOT_TOKEN) {
    return true;
  }

  try {
    // Формируем URL для отправки события
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    // Формируем текст сообщения
    const messageText = JSON.stringify(event, null, 2);

    // Ограничиваем длину сообщения до 4096 символов (ограничение Telegram)
    const truncatedText =
      messageText.length > 4096
        ? messageText.substring(0, 4093) + "..."
        : messageText;

    // Отправляем событие через Bot API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Event: ${truncatedText}`,
        disable_notification: true,
      }),
    });

    // Проверяем успешность запроса
    if (!response.ok) {
      console.error(
        "Failed to send event to Telegram Bot API:",
        response.statusText
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending event to Telegram Bot API:", error);
    return false;
  }
}

/**
 * Отправляет событие просмотра страницы
 *
 * @param chatId - ID чата пользователя
 * @param page - Название страницы
 * @param additionalData - Дополнительные данные о странице
 * @returns Promise<boolean> - Успешность отправки события
 */
export async function sendPageView(
  chatId: number | string,
  page: string,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  const event = {
    type: "page_view",
    page,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  return sendEvent(chatId, event);
}

/**
 * Отправляет событие клика
 *
 * @param chatId - ID чата пользователя
 * @param element - Название элемента, по которому кликнули
 * @param additionalData - Дополнительные данные о клике
 * @returns Promise<boolean> - Успешность отправки события
 */
export async function sendClickEvent(
  chatId: number | string,
  element: string,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  const event = {
    type: "click",
    element,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  return sendEvent(chatId, event);
}

/**
 * Отправляет событие покупки
 *
 * @param chatId - ID чата пользователя
 * @param productId - ID продукта
 * @param amount - Сумма покупки
 * @param currency - Валюта покупки
 * @param additionalData - Дополнительные данные о покупке
 * @returns Promise<boolean> - Успешность отправки события
 */
export async function sendPurchaseEvent(
  chatId: number | string,
  productId: string,
  amount: number,
  currency: string,
  additionalData: Record<string, any> = {}
): Promise<boolean> {
  const event = {
    type: "purchase",
    product_id: productId,
    amount,
    currency,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  return sendEvent(chatId, event);
}

/**
 * Отправляет пользовательские события
 *
 * @param chatId - ID чата пользователя
 * @param eventType - Тип события
 * @param eventData - Данные события
 * @returns Promise<boolean> - Успешность отправки события
 */
export async function sendCustomEvent(
  chatId: number | string,
  eventType: string,
  eventData: Record<string, any> = {}
): Promise<boolean> {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  return sendEvent(chatId, event);
}

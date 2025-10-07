/**
 * API спецификация для Telegram Mini App
 *
 * Этот файл описывает все endpoints, необходимые для интеграции с Telegram Mini App
 */

import { NextResponse } from "next/server";

// GET /api/telegram/specification - Возвращает OpenAPI спецификацию для Telegram Mini App
export async function GET(request: NextRequest) {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "NormalDance Telegram Mini App API",
      description:
        "API для интеграции с Telegram Mini App платформы NormalDance",
      version: "1.0.0",
    },
    servers: [
      {
        url: "https://normaldance.com/api",
        description: "Production server",
      },
    ],
    paths: {
      "/telegram/auth": {
        post: {
          summary: "Авторизация через Telegram",
          description: "Аутентификация пользователя через Telegram Web App",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    initData: {
                      type: "string",
                      description:
                        "Инициализационные данные от Telegram Web App",
                    },
                  },
                  required: ["initData"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Успешная аутентификация",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                      token: {
                        type: "string",
                        description: "JWT токен для дальнейших запросов",
                      },
                      user: {
                        $ref: "#/components/schemas/TelegramUser",
                      },
                    },
                  },
                },
              },
            },
            "401": {
              description: "Неавторизованный доступ",
            },
          },
        },
      },
      "/telegram/sync-user": {
        post: {
          summary: "Синхронизация пользователя",
          description:
            "Синхронизация данных пользователя Telegram с платформой",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: {
                      type: "string",
                      description: "ID пользователя в системе",
                    },
                    telegramUser: {
                      $ref: "#/components/schemas/TelegramUser",
                    },
                    authToken: {
                      type: "string",
                      description: "Токен авторизации",
                    },
                  },
                  required: ["userId", "telegramUser", "authToken"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Пользователь успешно синхронизирован",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                      telegramUserId: {
                        type: "number",
                        description: "ID пользователя в Telegram",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Некорректные данные",
            },
          },
        },
      },
      "/telegram/stars/purchase": {
        post: {
          summary: "Покупка через Telegram Stars",
          description: "Выполнение покупки с использованием Telegram Stars",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    amount: {
                      type: "number",
                      description: "Количество Stars",
                    },
                    description: {
                      type: "string",
                      description: "Описание покупки",
                    },
                    userId: {
                      type: "string",
                      description: "ID пользователя",
                    },
                  },
                  required: ["amount", "description", "userId"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Покупка успешно выполнена",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                      transactionId: {
                        type: "string",
                        description: "ID транзакции",
                      },
                    },
                  },
                },
              },
            },
            "402": {
              description: "Недостаточно средств",
            },
          },
        },
      },
      "/telegram/send-notification": {
        post: {
          summary: "Отправка уведомления",
          description: "Отправка уведомления пользователю через Telegram",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: {
                      type: "number",
                      description: "ID пользователя в Telegram",
                    },
                    message: {
                      type: "string",
                      description: "Текст уведомления",
                    },
                    options: {
                      type: "object",
                      properties: {
                        parse_mode: {
                          type: "string",
                          enum: ["HTML", "Markdown"],
                        },
                        disable_web_page_preview: {
                          type: "boolean",
                        },
                        disable_notification: {
                          type: "boolean",
                        },
                      },
                    },
                  },
                  required: ["userId", "message"],
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Уведомление успешно отправлено",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Некорректные данные",
            },
          },
        },
      },
      "/telegram/metrics": {
        get: {
          summary: "Получение метрик",
          description:
            "Получение статистики по использованию Telegram Mini App",
          responses: {
            "200": {
              description: "Метрики успешно получены",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TelegramMetrics",
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Обновление метрик",
          description:
            "Обновление статистики по использованию Telegram Mini App",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/TelegramMetrics",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Метрики успешно обновлены",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/telegram/webhook": {
        post: {
          summary: "Webhook от Telegram",
          description: "Обработка входящих сообщений и событий от Telegram",
          responses: {
            "200": {
              description: "Событие успешно обработано",
            },
          },
        },
        get: {
          summary: "Информация о webhook",
          description: "Получение информации о текущем состоянии webhook",
          responses: {
            "200": {
              description: "Информация о webhook",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: {
                        type: "string",
                        description: "URL текущего webhook",
                      },
                      pending_update_count: {
                        type: "number",
                        description: "Количество ожидающих обновлений",
                      },
                      features: {
                        type: "array",
                        items: {
                          type: "string",
                        },
                        description: "Поддерживаемые функции",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        TelegramUser: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "Уникальный ID пользователя в Telegram",
            },
            first_name: {
              type: "string",
              description: "Имя пользователя",
            },
            last_name: {
              type: "string",
              description: "Фамилия пользователя",
            },
            username: {
              type: "string",
              description: "Имя пользователя в Telegram",
            },
            language_code: {
              type: "string",
              description: "Код языка пользователя",
            },
            is_premium: {
              type: "boolean",
              description: "Является ли пользователь Telegram Premium",
            },
            photo_url: {
              type: "string",
              description: "URL фото пользователя",
            },
          },
        },
        TelegramMetrics: {
          type: "object",
          properties: {
            totalUsers: {
              type: "number",
              description: "Общее количество пользователей",
            },
            activeUsers: {
              type: "number",
              description: "Количество активных пользователей",
            },
            revenue: {
              type: "number",
              description: "Доход в Telegram Stars",
            },
            starsEarned: {
              type: "number",
              description: "Заработано Stars",
            },
            conversionRate: {
              type: "number",
              description: "Конверсия",
            },
            retentionRate: {
              type: "number",
              description: "Удержание пользователей",
            },
            averageSessionTime: {
              type: "number",
              description: "Среднее время сессии в минутах",
            },
            userSatisfaction: {
              type: "number",
              description: "Уровень удовлетворенности пользователей",
            },
          },
        },
      },
    },
  };

  return NextResponse.json(spec);
}

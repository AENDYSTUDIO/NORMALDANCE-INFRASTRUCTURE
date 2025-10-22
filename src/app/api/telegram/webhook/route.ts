import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { telegramIntegration2025 } from '@/lib/telegram-integration-2025'
import { z } from 'zod'
import { 
  TelegramUpdateSchema, 
  TelegramMessageSchema, 
  TelegramUserSchema, 
  TelegramCallbackQuerySchema, 
  TelegramInlineQuerySchema, 
  TelegramPreCheckoutQuerySchema 
} from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'
import { logger } from '@/lib/utils/logger'

// POST /api/telegram/webhook - Telegram webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = TelegramUpdateSchema.parse(await request.json())
    
    // Обработка различных типов обновлений
    if (body.message) {
      await handleMessage(body.message)
    } else if (body.callback_query) {
      await handleCallbackQuery(body.callback_query)
    } else if (body.inline_query) {
      await handleInlineQuery(body.inline_query)
    } else if (body.pre_checkout_query) {
      await handlePreCheckoutQuery(body.pre_checkout_query)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/telegram/webhook - Webhook info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    integration: 'Telegram 2025',
    features: [
      'mini_app',
      'social_payments',
      'notifications',
      'analytics',
      'quick_swap'
    ],
    timestamp: Date.now()
  })
}

/**
 * 📱 Обработка сообщений
 */
async function handleMessage(message: z.infer<typeof TelegramMessageSchema>) {
  const chatId = message.chat.id
  const userId = message.from.id
  const text = message.text

  // Обработка команд
  if (text?.startsWith('/')) {
    await handleCommand(chatId, userId, text, message.from)
  }
  
  // Обработка обычных сообщений
  else if (text) {
    await handleTextMessage(chatId, userId, text, message.from)
  }
}

/**
 * 🎯 Обработка команд
 */
async function handleCommand(chatId: number, userId: number, command: string, user: z.infer<typeof TelegramUserSchema>) {
  switch (command) {
    case '/start':
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `🚀 *Добро пожаловать в NormalDance DEX!*\n\n` +
              `Продвинутый DEX с гибридными алгоритмами AMM и защитой от волатильности.\n\n` +
              `*Доступные команды:*\n` +
              `/dex - Открыть DEX интерфейс\n` +
              `/analytics - Просмотр аналитики\n` +
              `/orders - Управление ордерами\n` +
              `/help - Справка\n\n` +
              `*Особенности 2025:*\n` +
              `🤖 ИИ-прогнозы\n` +
              `🛡️ Защита от волатильности\n` +
              `⚡ Гибридные алгоритмы AMM\n` +
              `💧 Умные ордера\n` +
              `📊 Продвинутая аналитика`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 Открыть DEX',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex` }
              }
            ],
            [
              {
                text: '📊 Аналитика',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/analytics` }
              },
              {
                text: '🎯 Ордера',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=orders` }
              }
            ]
          ]
        }
      })
      break

    case '/dex':
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `💎 *NormalDance DEX*\n\n` +
              `Откройте интерфейс для торговли TON ↔ NDT с продвинутыми функциями:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '💱 Быстрый своп',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?action=swap` }
              }
            ],
            [
              {
                text: '💧 Ликвидность',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=liquidity` }
              },
              {
                text: '🎯 Умные ордера',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=orders` }
              }
            ],
            [
              {
                text: '📊 Advanced Dashboard',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=advanced` }
              }
            ]
          ]
        }
      })
      break

    case '/analytics':
      // Здесь можно добавить получение реальных данных аналитики
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `📊 *Аналитика NormalDance DEX*\n\n` +
              `Загружаем актуальные данные...`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📊 Открыть Dashboard',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/analytics` }
              }
            ]
          ]
        }
      })
      break

    case '/orders':
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `🎯 *Умные ордера*\n\n` +
              `Управляйте автоматическими ордерами с ИИ-оптимизацией:`,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '📋 Мои ордера',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=orders` }
              }
            ],
            [
              {
                text: '➕ Создать ордер',
                web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?tab=orders&action=create` }
              }
            ]
          ]
        }
      })
      break

    case '/help':
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `❓ *Справка NormalDance DEX*\n\n` +
              `*Основные функции:*\n` +
              `• Торговля TON ↔ NDT\n` +
              `• Предоставление ликвидности\n` +
              `• Умные лимит-ордера\n` +
              `• Защита от волатильности\n` +
              `• ИИ-прогнозы\n\n` +
              `*Команды:*\n` +
              `/start - Начать работу\n` +
              `/dex - Открыть DEX\n` +
              `/analytics - Аналитика\n` +
              `/orders - Ордера\n` +
              `/help - Эта справка\n\n` +
              `*Поддержка:* @normaldance_support`,
        parse_mode: 'Markdown'
      })
      break

    default:
      await telegramIntegration2025.sendTelegramMessage(chatId, {
        text: `❓ Неизвестная команда. Используйте /help для справки.`
      })
  }
}

/**
 * 💬 Обработка текстовых сообщений
 */
async function handleTextMessage(chatId: number, userId: number, text: string, user: z.infer<typeof TelegramUserSchema>) {
  // Простой анализ сообщения для определения намерений
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('цена') || lowerText.includes('курс')) {
    await telegramIntegration2025.sendTelegramMessage(chatId, {
      text: `💎 *Текущий курс NDT/TON*\n\n` +
            `Загружаем актуальные данные...`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📊 Посмотреть в DEX',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex` }
            }
          ]
        ]
      }
    })
  }
  
  else if (lowerText.includes('торговать') || lowerText.includes('своп')) {
    await telegramIntegration2025.sendTelegramMessage(chatId, {
      text: `💱 *Готовы торговать?*\n\n` +
            `Откройте DEX для быстрого свопа TON ↔ NDT:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '💱 Быстрый своп',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?action=swap` }
            }
          ]
        ]
      }
    })
  }
  
  else {
    // Общий ответ с предложением открыть DEX
    await telegramIntegration2025.sendTelegramMessage(chatId, {
      text: `🤖 *NormalDance DEX Assistant*\n\n` +
            `Я помогу вам с торговлей TON ↔ NDT. Используйте команды или откройте DEX:`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Открыть DEX',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex` }
            }
          ],
          [
            {
              text: '📊 Аналитика',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/analytics` }
            },
            {
              text: '❓ Справка',
              callback_data: 'help'
            }
          ]
        ]
      }
    })
  }
}

/**
 * 🔘 Обработка callback query
 */
async function handleCallbackQuery(callbackQuery: z.infer<typeof TelegramCallbackQuerySchema>) {
  const chatId = callbackQuery.message.chat.id
  const userId = callbackQuery.from.id
  const data = callbackQuery.data

  // Ответ на callback query
  await telegramIntegration2025.sendTelegramMessage(chatId, {
    text: `✅ Обработано: ${data}`,
    reply_to_message_id: callbackQuery.message.message_id
  })

  // Обработка конкретных callback'ов
  if (data === 'help') {
    await handleCommand(chatId, userId, '/help', callbackQuery.from)
  }
  
  else if (data.startsWith('accept_payment_')) {
    const paymentId = data.replace('accept_payment_', '')
    // Обработка принятия платежа
    console.log(`Payment ${paymentId} accepted by user ${userId}`)
  }
  
  else if (data.startsWith('decline_payment_')) {
    const paymentId = data.replace('decline_payment_', '')
    // Обработка отклонения платежа
    console.log(`Payment ${paymentId} declined by user ${userId}`)
  }
}

/**
 * 🔍 Обработка inline query
 */
async function handleInlineQuery(inlineQuery: z.infer<typeof TelegramInlineQuerySchema>) {
  const queryId = inlineQuery.id
  const query = inlineQuery.query.toLowerCase()
  const userId = inlineQuery.from.id

  const results = []

  // Поиск по запросу
  if (query.includes('swap') || query.includes('своп')) {
    results.push({
      type: 'article',
      id: 'swap_ton_ndt',
      title: '💱 Своп TON ↔ NDT',
      description: 'Быстрый обмен TON на NDT и обратно',
      input_message_content: {
        message_text: `💱 *Своп TON ↔ NDT*\n\nОткройте DEX для обмена:`,
        parse_mode: 'Markdown'
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🚀 Открыть DEX',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/dex?action=swap` }
            }
          ]
        ]
      }
    })
  }

  if (query.includes('analytics') || query.includes('аналитика')) {
    results.push({
      type: 'article',
      id: 'analytics_dashboard',
      title: '📊 Аналитика DEX',
      description: 'Просмотр рыночной аналитики и прогнозов',
      input_message_content: {
        message_text: `📊 *Аналитика NormalDance DEX*\n\nПросмотр рыночных данных:`,
        parse_mode: 'Markdown'
      },
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📊 Открыть Dashboard',
              web_app: { url: `${process.env.TELEGRAM_WEB_APP_URL}/analytics` }
            }
          ]
        ]
      }
    })
  }

  // Отправка результатов
  await telegramIntegration2025.sendTelegramMessage('', {
    method: 'answerInlineQuery',
    inline_query_id: queryId,
    results: JSON.stringify(results)
  })
}

/**
 * 💳 Обработка pre-checkout query
 */
async function handlePreCheckoutQuery(preCheckoutQuery: z.infer<typeof TelegramPreCheckoutQuerySchema>) {
  const queryId = preCheckoutQuery.id
  const userId = preCheckoutQuery.from.id
  const currency = preCheckoutQuery.currency
  const totalAmount = preCheckoutQuery.total_amount

  // Валидация платежа
  const isValid = currency === 'TON' && totalAmount > 0

  // Ответ на pre-checkout query
  await telegramIntegration2025.sendTelegramMessage('', {
    method: 'answerPreCheckoutQuery',
    pre_checkout_query_id: queryId,
    ok: isValid
  })
}

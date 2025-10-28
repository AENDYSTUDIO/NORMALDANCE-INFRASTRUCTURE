// API маршрут для покупки токенов за Telegram Stars

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { TelegramStarsBridge } from '@/lib/wallet/telegram-stars-bridge';
import { StarsPaymentManager } from '@/lib/wallet/stars-payment-manager';

// Создаем экземпляры сервисов
const starsBridge = new TelegramStarsBridge();
const paymentManager = new StarsPaymentManager(starsBridge);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, userId } = body;

    // Валидация входных данных
    if (!amount || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Amount and userId are required' 
      }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    // Создание платежной сессии
    const session = await paymentManager.createPaymentSession(
      userId, 
      amount, 
      0 // ndtAmount будет рассчитан внутри
    );

    // В реальном приложении здесь будет интеграция с Telegram API
    // для инициации платежа через Stars
    
    // Для демонстрации сразу подтверждаем платеж
    const success = await paymentManager.approvePaymentSession(session.id);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          transactionId: session.id,
          starsAmount: session.starsAmount,
          ndtAmount: session.ndtAmount,
          status: session.status
        } 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to process payment' 
      }, { status: 500 });
    }
  } catch (error) {
    logger.error('Error processing Stars purchase', error as Error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process Stars purchase' 
    }, { status: 500 });
  }
}
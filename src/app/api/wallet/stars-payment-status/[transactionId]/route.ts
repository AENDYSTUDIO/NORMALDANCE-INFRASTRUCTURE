// API маршрут для проверки статуса платежа через Telegram Stars

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { StarsPaymentManager } from '@/lib/wallet/stars-payment-manager';
import { TelegramStarsBridge } from '@/lib/wallet/telegram-stars-bridge';

// Создаем экземпляры сервисов
const starsBridge = new TelegramStarsBridge();
const paymentManager = new StarsPaymentManager(starsBridge);

export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const { transactionId } = params;

    if (!transactionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction ID is required' 
      }, { status: 400 });
    }

    // В реальном приложении здесь будет проверка статуса транзакции
    // через Telegram API или нашу внутреннюю систему отслеживания
    
    // Для демонстрации возвращаем фиктивный статус
    // В реальности, мы бы использовали paymentManager для отслеживания статуса
    const session = paymentManager.getPaymentSession(transactionId);
    
    if (session) {
      return NextResponse.json({ 
        success: true, 
        data: { 
          transactionId,
          status: session.status,
          starsAmount: session.starsAmount,
          ndtAmount: session.ndtAmount,
          timestamp: session.createdAt.toISOString()
        } 
      });
    } else {
      // Если сессия не найдена в локальной системе, проверяем в Telegram API
      // или возвращаем статус, полученный из внешней системы
      
      return NextResponse.json({ 
        success: false, 
        error: 'Transaction not found' 
      }, { status: 404 });
    }
  } catch (error) {
    logger.error('Error checking Stars payment status', error as Error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check payment status' 
    }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramInitData } from '@/lib/security/telegram-validator'
import { sanitizeHTML } from '@/lib/security/input-sanitizer'

// 🔐 SECURITY: Rate limiting map (in-memory for now)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 5): boolean {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + oneMinute });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

// POST /api/grave/donations - Сделать пожертвование в мемориал
export async function POST(request: NextRequest) {
  try {
    // 🔐 SECURITY 1: Telegram authentication
    const initData = request.headers.get('x-telegram-init-data');
    
    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing Telegram authentication' },
        { status: 401 }
      );
    }
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('[Security] TELEGRAM_BOT_TOKEN not configured!');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    const validation = validateTelegramInitData(initData, botToken, 3600);
    
    if (!validation.valid) {
      console.warn('[Security] Invalid Telegram initData:', validation.error);
      return NextResponse.json(
        { success: false, error: `Authentication failed: ${validation.error}` },
        { status: 401 }
      );
    }
    
    const userId = validation.userId || 'anonymous';
    
    // 🔐 SECURITY 2: Rate limiting (5 donations per minute per user)
    if (!checkRateLimit(`donation:${userId}`, 5)) {
      const response = NextResponse.json(
        { success: false, error: 'Too many requests. Please wait before donating again.' },
        { status: 429 }
      );
      response.headers.set('Retry-After', '60');
      return response;
    }
    
    const body = await request.json()
    const { memorialId, amount, message } = body

    // 🔐 SECURITY 3: Input validation
    if (!memorialId || typeof memorialId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid memorial ID' },
        { status: 400 }
      )
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation amount' },
        { status: 400 }
      )
    }
    
    // 🔐 SECURITY 4: Amount limits (prevent abuse)
    const MIN_DONATION = 0.01; // SOL
    const MAX_DONATION = 1000; // SOL
    
    if (amount < MIN_DONATION) {
      return NextResponse.json(
        { success: false, error: `Minimum donation is ${MIN_DONATION} SOL` },
        { status: 400 }
      )
    }
    
    if (amount > MAX_DONATION) {
      return NextResponse.json(
        { success: false, error: `Maximum donation is ${MAX_DONATION} SOL` },
        { status: 400 }
      )
    }
    
    // 🔐 SECURITY 5: Sanitize message (prevent XSS)
    const sanitizedMessage = message ? sanitizeHTML(message.substring(0, 500)) : '';

    // В реальном приложении здесь будет:
    // 1. Проверка существования мемориала
    // 2. Создание транзакции на блокчейне
    // 3. Обновление мемориального фонда
    // 4. Уведомление наследников

    const donation = {
      id: Date.now().toString(),
      memorialId,
      amount,
      message: sanitizedMessage,
      donor: userId, // Use authenticated Telegram user ID
      timestamp: new Date().toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64), // Мок-хеш (TODO: real transaction)
      status: 'PENDING'
    }

    // 🔐 SECURITY 6: Log security event
    console.log('[Security] Donation processed:', {
      userId,
      memorialId,
      amount,
      timestamp: donation.timestamp
    })

    // В реальном приложении здесь будет вызов smart-contract
    // await contract.donate(memorialId, message, { value: ethers.utils.parseEther(amount.toString()) })

    return NextResponse.json({
      success: true,
      data: { donation },
      message: 'Donation processed successfully'
    })

  } catch (error) {
    console.error('Error processing donation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process donation' },
      { status: 500 }
    )
  }
}

// GET /api/grave/donations?memorialId=123 - Получить пожертвования для мемориала
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const memorialId = searchParams.get('memorialId')

    if (!memorialId) {
      return NextResponse.json(
        { success: false, error: 'Memorial ID required' },
        { status: 400 }
      )
    }

    // В реальном приложении загружаем с блокчейна
    const mockDonations = [
      {
        id: '1',
        memorialId,
        amount: 0.05,
        message: 'Спасибо за музыку! 🎵',
        donor: '0x1234567890abcdef1234567890abcdef12345678',
        timestamp: '2024-12-01T10:30:00Z',
        transactionHash: '0x456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789',
        status: 'COMPLETED'
      },
      {
        id: '2',
        memorialId,
        amount: 0.025,
        message: 'Твоя музыка живет в наших сердцах',
        donor: '0xabcdef1234567890abcdef1234567890abcdef12',
        timestamp: '2024-12-02T15:45:00Z',
        transactionHash: '0x789abcdef123456789abcdef123456789abcdef123456789abcdef123456789',
        status: 'COMPLETED'
      }
    ]

    return NextResponse.json({
      success: true,
      data: mockDonations
    })

  } catch (error) {
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}
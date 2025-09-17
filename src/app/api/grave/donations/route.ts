import { NextRequest, NextResponse } from 'next/server'

// POST /api/grave/donations - Сделать пожертвование в мемориал
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memorialId, amount, message } = body

    // Валидация
    if (!memorialId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid donation data' },
        { status: 400 }
      )
    }

    // В реальном приложении здесь будет:
    // 1. Проверка существования мемориала
    // 2. Создание транзакции на блокчейне
    // 3. Обновление мемориального фонда
    // 4. Уведомление наследников

    const donation = {
      id: Date.now().toString(),
      memorialId,
      amount,
      message: message || '',
      donor: '0x' + Math.random().toString(16).substr(2, 40), // Мок-адрес
      timestamp: new Date().toISOString(),
      transactionHash: '0x' + Math.random().toString(16).substr(2, 64), // Мок-хеш
      status: 'PENDING'
    }

    // Сохраняем пожертвование
    console.log('Пожертвование:', donation)

    // В реальном приложении здесь будет вызов smart-contract
    // await contract.donate(memorialId, message, { value: ethers.utils.parseEther(amount.toString()) })

    return NextResponse.json({
      success: true,
      data: donation,
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
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { filecoinService } from '@/lib/filecoin-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ipfsCid, options } = body

    if (!action || !ipfsCid) {
      return NextResponse.json(
        { error: 'Action and IPFS CID are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create-deal':
        // Создание Filecoin сделки
        const deal = await filecoinService.createDeal(ipfsCid, options)
        return NextResponse.json({
          success: true,
          data: deal
        })

      case 'calculate-cost':
        // Расчет стоимости хранения
        const { sizeInBytes, durationInDays } = options
        if (!sizeInBytes || !durationInDays) {
          return NextResponse.json(
            { error: 'Size in bytes and duration in days are required' },
            { status: 400 }
          )
        }

        const cost = await filecoinService.calculateStorageCost(
          sizeInBytes,
          durationInDays
        )
        return NextResponse.json({
          success: true,
          data: cost
        })

      case 'check-availability':
        // Проверка доступности файла
        const availability = await filecoinService.checkFileAvailability(ipfsCid)
        return NextResponse.json({
          success: true,
          data: availability
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Filecoin API error:', error)
    return NextResponse.json(
      { error: 'Failed to process Filecoin request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    if (dealId) {
      // Получение информации о конкретной сделке
      const deal = await filecoinService.getDeal(dealId)
      if (!deal) {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: deal
      })
    } else {
      // Получение списка активных сделок
      const deals = await filecoinService.listActiveDeals()
      return NextResponse.json({
        success: true,
        data: deals
      })
    }

  } catch (error) {
    console.error('Filecoin GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get Filecoin data' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      )
    }

    // Отмена сделки
    const success = await filecoinService.cancelDeal(dealId)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel deal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Deal canceled successfully'
    })

  } catch (error) {
    console.error('Filecoin DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel Filecoin deal' },
      { status: 500 }
    )
  }
}
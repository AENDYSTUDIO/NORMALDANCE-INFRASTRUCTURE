import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { filecoinService } from '@/lib/filecoin-service'
import { filecoinPostSchema, filecoinGetSchema, filecoinDeleteSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ipfsCid, options } = filecoinPostSchema.parse(body)

    switch (action) {
      case 'create-deal':
        // Создание Filecoin сделки
        const deal = await filecoinService.createDeal(ipfsCid!, options)
        return NextResponse.json({
          success: true,
          data: deal
        })

      case 'calculate-cost':
        // Расчет стоимости хранения
        const cost = await filecoinService.calculateStorageCost(
          options!.sizeInBytes!,
          options!.durationInDays!
        )
        return NextResponse.json({
          success: true,
          data: cost
        })

      case 'check-availability':
        // Проверка доступности файла
        const availability = await filecoinService.checkFileAvailability(ipfsCid!)
        return NextResponse.json({
          success: true,
          data: availability
        })

      default:
        // This case should ideally not be reached due to Zod enum validation
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { dealId, ipfsCid } = filecoinGetSchema.parse(query)

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
    } else if (ipfsCid) {
      // Получение информации о сделках по IPFS CID
      const deals = await filecoinService.getDealsByIpfsCid(ipfsCid)
      return NextResponse.json({
        success: true,
        data: deals
      })
    }
    else {
      // Получение списка активных сделок
      const deals = await filecoinService.listActiveDeals()
      return NextResponse.json({
        success: true,
        data: deals
      })
    }

  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { dealId } = filecoinDeleteSchema.parse(query)

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
    return handleApiError(error)
  }
}
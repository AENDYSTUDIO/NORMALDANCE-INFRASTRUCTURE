import { NextRequest, NextResponse } from 'next/server'

// GET /api/grave/memorials - Получить все мемориалы
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // В реальном приложении здесь будет запрос к блокчейну
    // Пока возвращаем мок-данные для быстрого старта
    const mockMemorials = [
      {
        id: '1',
        artistName: 'DJ Eternal',
        ipfsHash: 'QmDemoMemorial123',
        fundBalance: 1.25,
        heirs: ['0x1234567890abcdef1234567890abcdef12345678'],
        isActive: true,
        createdAt: '2024-12-01T00:00:00Z',
        totalDonations: 15,
        visitors: 1250
      },
      {
        id: '2',
        artistName: 'Producer Ghost',
        ipfsHash: 'QmDemoMemorial456',
        fundBalance: 0.89,
        heirs: ['0xabcdef1234567890abcdef1234567890abcdef12'],
        isActive: true,
        createdAt: '2024-11-15T00:00:00Z',
        totalDonations: 8,
        visitors: 890
      },
      {
        id: '3',
        artistName: 'Synth Master',
        ipfsHash: 'QmDemoMemorial789',
        fundBalance: 2.15,
        heirs: [
          '0x1111111111111111111111111111111111111111',
          '0x2222222222222222222222222222222222222222'
        ],
        isActive: true,
        createdAt: '2024-10-20T00:00:00Z',
        totalDonations: 22,
        visitors: 2100
      }
    ]

    // Фильтрация по поиску
    let filteredMemorials = mockMemorials
    if (search) {
      filteredMemorials = mockMemorials.filter(memorial =>
        memorial.artistName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Пагинация
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedMemorials = filteredMemorials.slice(startIndex, endIndex)

    return NextResponse.json({
      success: true,
      data: {
        memorials: paginatedMemorials,
        pagination: {
          page,
          limit,
          total: filteredMemorials.length,
          totalPages: Math.ceil(filteredMemorials.length / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error fetching memorials:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch memorials' },
      { status: 500 }
    )
  }
}

// POST /api/grave/memorials - Создать новый мемориал
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistName, ipfsHash, heirs, message } = body

    // Валидация
    if (!artistName || !ipfsHash) {
      return NextResponse.json(
        { success: false, error: 'Artist name and IPFS hash are required' },
        { status: 400 }
      )
    }

    if (!heirs || heirs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one heir is required' },
        { status: 400 }
      )
    }

    // В реальном приложении здесь будет:
    // 1. Создание NFT-мемориала на блокчейне
    // 2. Сохранение в базу данных
    // 3. Загрузка медиа на IPFS

    const newMemorial = {
      id: Date.now().toString(),
      artistName,
      ipfsHash,
      fundBalance: 0,
      heirs: heirs.filter((heir: string) => heir.trim() !== ''),
      isActive: true,
      createdAt: new Date().toISOString(),
      totalDonations: 0,
      visitors: 0
    }

    // Сохраняем в "базу данных" (в реальном приложении - Prisma)
    console.log('Создан мемориал:', newMemorial)

    return NextResponse.json({
      success: true,
      data: newMemorial,
      message: 'Memorial created successfully'
    })

  } catch (error) {
    console.error('Error creating memorial:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create memorial' },
      { status: 500 }
    )
  }
}
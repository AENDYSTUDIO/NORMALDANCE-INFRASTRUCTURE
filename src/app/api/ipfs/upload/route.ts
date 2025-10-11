import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { uploadWithReplication, checkFileAvailabilityOnMultipleGateways } from '@/lib/ipfs-enhanced'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Валидация метаданных
    const requiredFields = ['title', 'artist', 'genre', 'duration', 'releaseDate']
    for (const field of requiredFields) {
      if (!metadata[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Добавляем стандартные поля
    const enhancedMetadata = {
      ...metadata,
      fileSize: file.size,
      mimeType: file.type,
      isExplicit: metadata.isExplicit || false,
      timestamp: new Date().toISOString()
    }

    // Опции для загрузки
    const options = {
      replicateToGateways: [
        'https://ipfs.io',
        'https://gateway.pinata.cloud',
        'https://cloudflare-ipfs.com'
      ],
      enableFilecoin: process.env.ENABLE_FILECOIN === 'true',
      chunkSize: 10 * 1024 * 1024 // 10MB chunks
    }

    // Загружаем файл с репликацией
    const result = await uploadWithReplication(file, enhancedMetadata, options)

    return NextResponse.json({
      success: true,
      data: {
        cid: result.cid,
        size: result.size,
        gateways: result.gateways,
        replicationStatus: result.replicationStatus,
        metadata: result.metadata,
        timestamp: result.timestamp
      }
    })

  } catch (error) {
    console.error('IPFS upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload file to IPFS' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cid = searchParams.get('cid')

    if (!cid) {
      return NextResponse.json({ error: 'CID is required' }, { status: 400 })
    }

    // Проверяем доступность файла на нескольких шлюзах
    const availability = await checkFileAvailabilityOnMultipleGateways(cid)

    return NextResponse.json({
      success: true,
      data: {
        cid,
        availability,
        gateways: [
          'https://ipfs.io/ipfs/' + cid,
          'https://gateway.pinata.cloud/ipfs/' + cid,
          'https://cloudflare-ipfs.com/ipfs/' + cid
        ]
      }
    })

  } catch (error) {
    console.error('IPFS check error:', error)
    return NextResponse.json(
      { error: 'Failed to check file availability' },
      { status: 500 }
    )
  }
}
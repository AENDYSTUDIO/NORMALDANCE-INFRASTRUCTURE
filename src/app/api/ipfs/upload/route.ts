import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { uploadWithReplication, checkFileAvailabilityOnMultipleGateways } from '@/lib/ipfs-enhanced'
import { ipfsUploadPostSchema, ipfsUploadGetSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = JSON.parse(formData.get('metadata') as string)

    const { file: validatedFile, metadata: validatedMetadata } = ipfsUploadPostSchema.parse({ file, metadata });

    if (!validatedFile) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Добавляем стандартные поля
    const enhancedMetadata = {
      ...validatedMetadata,
      fileSize: validatedFile.size,
      mimeType: validatedFile.type,
      isExplicit: validatedMetadata.isExplicit || false,
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
    const result = await uploadWithReplication(validatedFile, enhancedMetadata, options)

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
    return handleApiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { cid } = ipfsUploadGetSchema.parse(query)

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
    return handleApiError(error)
  }
}
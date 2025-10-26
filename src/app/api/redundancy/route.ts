import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { redundancyService } from '@/lib/redundancy-service'
import { redundancyPostSchema, redundancyGetSchema, redundancyDeleteSchema } from '@/lib/schemas'
import { handleApiError } from '@/lib/errors/errorHandler'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { action, nodeId, jobId, sourceCid } = redundancyGetSchema.parse(query)

    switch (action) {
      case 'get-all-nodes':
        // Получение списка всех узлов
        const allNodes = Array.from(redundancyService['nodes'].values())
        return NextResponse.json({
          success: true,
          data: allNodes
        })

      case 'get-available-nodes':
        // Получение доступных узлов
        const availableNodes = redundancyService.getAvailableNodes()
        return NextResponse.json({
          success: true,
          data: availableNodes
        })

      case 'get-statistics':
        // Получение статистики
        const stats = redundancyService.getStatistics()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'check-node-health':
        // Проверка здоровья конкретного узла
        const isHealthy = await redundancyService.checkNodeHealth(nodeId!) // nodeId is guaranteed by superRefine
        return NextResponse.json({
          success: true,
          data: {
            nodeId,
            healthy: isHealthy
          }
        })

      case 'get-file-replicas':
        // Получение реплик файла
        const replicas = await redundancyService.getFileReplicas(sourceCid!) // sourceCid is guaranteed by superRefine
        return NextResponse.json({
          success: true,
          data: {
            sourceCid,
            replicas,
            count: replicas.length
          }
        })

      case 'get-replication-status':
        // Получение статуса задания репликации
        const job = redundancyService.getReplicationStatus(jobId!) // jobId is guaranteed by superRefine
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          data: job
        })

      case 'get-active-jobs':
        // Получение активных заданий
        const activeJobs = redundancyService.getActiveJobs()
        return NextResponse.json({
          success: true,
          data: activeJobs
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, nodeId, sourceCid, options } = redundancyPostSchema.parse(body)

    switch (action) {
      case 'add-node':
        // Добавление нового узла
        redundancyService.addNode({
          id: nodeId!, // nodeId is guaranteed by superRefine
          name: options?.name || `Node ${nodeId}`,
          type: options?.type || 'ipfs',
          endpoint: options?.endpoint,
          status: 'online',
          reliability: options?.reliability || 0.8,
          lastChecked: new Date(),
          region: options?.region
        })

        return NextResponse.json({
          success: true,
          message: 'Node added successfully'
        })

      case 'remove-node':
        // Удаление узла
        const removed = redundancyService.removeNode(nodeId!) // nodeId is guaranteed by superRefine
        if (!removed) {
          return NextResponse.json(
            { error: 'Node not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Node removed successfully'
        })

      case 'replicate-file':
        // Запуск репликации файла
        const job = await redundancyService.replicateFile(sourceCid!, options) // sourceCid is guaranteed by superRefine
        return NextResponse.json({
          success: true,
          data: job
        })

      case 'check-all-nodes-health':
        // Проверка здоровья всех узлов
        await redundancyService.checkAllNodesHealth()
        return NextResponse.json({
          success: true,
          message: 'Health check completed for all nodes'
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const { action, nodeId } = redundancyDeleteSchema.parse(query)

    // Assuming action is always 'remove-node' for DELETE based on schema
    const removed = redundancyService.removeNode(nodeId)
    if (!removed) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Node removed successfully'
    })

  } catch (error) {
    return handleApiError(error)
  }
}
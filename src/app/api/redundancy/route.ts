import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { redundancyService } from '@/lib/redundancy-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const nodeId = searchParams.get('nodeId')
    const jobId = searchParams.get('jobId')
    const sourceCid = searchParams.get('sourceCid')

    switch (action) {
      case 'nodes':
        // Получение списка всех узлов
        const allNodes = Array.from(redundancyService['nodes'].values())
        return NextResponse.json({
          success: true,
          data: allNodes
        })

      case 'available-nodes':
        // Получение доступных узлов
        const availableNodes = redundancyService.getAvailableNodes()
        return NextResponse.json({
          success: true,
          data: availableNodes
        })

      case 'statistics':
        // Получение статистики
        const stats = redundancyService.getStatistics()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'node-health':
        // Проверка здоровья конкретного узла
        if (!nodeId) {
          return NextResponse.json(
            { error: 'Node ID is required' },
            { status: 400 }
          )
        }

        const isHealthy = await redundancyService.checkNodeHealth(nodeId)
        return NextResponse.json({
          success: true,
          data: {
            nodeId,
            healthy: isHealthy
          }
        })

      case 'file-replicas':
        // Получение реплик файла
        if (!sourceCid) {
          return NextResponse.json(
            { error: 'Source CID is required' },
            { status: 400 }
          )
        }

        const replicas = await redundancyService.getFileReplicas(sourceCid)
        return NextResponse.json({
          success: true,
          data: {
            sourceCid,
            replicas,
            count: replicas.length
          }
        })

      case 'job-status':
        // Получение статуса задания репликации
        if (!jobId) {
          return NextResponse.json(
            { error: 'Job ID is required' },
            { status: 400 }
          )
        }

        const job = redundancyService.getReplicationStatus(jobId)
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

      case 'active-jobs':
        // Получение активных заданий
        const activeJobs = redundancyService.getActiveJobs()
        return NextResponse.json({
          success: true,
          data: activeJobs
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Redundancy API error:', error)
    return NextResponse.json(
      { error: 'Failed to process redundancy request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, nodeId, sourceCid, options } = body

    switch (action) {
      case 'add-node':
        // Добавление нового узла
        if (!nodeId || !options) {
          return NextResponse.json(
            { error: 'Node ID and options are required' },
            { status: 400 }
          )
        }

        redundancyService.addNode({
          id: nodeId,
          name: options.name || `Node ${nodeId}`,
          type: options.type || 'ipfs',
          endpoint: options.endpoint,
          status: 'online',
          reliability: options.reliability || 0.8,
          lastChecked: new Date(),
          region: options.region
        })

        return NextResponse.json({
          success: true,
          message: 'Node added successfully'
        })

      case 'remove-node':
        // Удаление узла
        if (!nodeId) {
          return NextResponse.json(
            { error: 'Node ID is required' },
            { status: 400 }
          )
        }

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

      case 'replicate-file':
        // Запуск репликации файла
        if (!sourceCid) {
          return NextResponse.json(
            { error: 'Source CID is required' },
            { status: 400 }
          )
        }

        const job = await redundancyService.replicateFile(sourceCid, options)
        return NextResponse.json({
          success: true,
          data: job
        })

      case 'check-all-nodes':
        // Проверка здоровья всех узлов
        await redundancyService.checkAllNodesHealth()
        return NextResponse.json({
          success: true,
          message: 'Health check completed for all nodes'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Redundancy POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process redundancy request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const nodeId = searchParams.get('nodeId')

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      )
    }

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
    console.error('Redundancy DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to remove node' },
      { status: 500 }
    )
  }
}
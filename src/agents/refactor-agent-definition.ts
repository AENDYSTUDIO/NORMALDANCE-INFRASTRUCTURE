import type { AgentDefinition, ToolCall } from '../../types/agent-definition'

const definition: AgentDefinition = {
  id: 'refactor-agent',
  displayName: 'Refactor Agent',
  model: 'openai/gpt-4o',
  
  spawnerPrompt: 
    'Агент для автоматического рефакторинга кода в проекте NORMALDANCE с учетом специфических архитектурных паттернов',
  
  includeMessageHistory: true,
  toolNames: ['execute_refactor', 'analyze_code', 'apply_changes', 'set_output'],
  
  inputSchema: {
    prompt: {
      description: 'Описание задачи рефакторинга',
      type: 'string',
    },
    params: {
      type: 'object',
      properties: {
        targetFiles: {
          description: 'Список файлов для рефакторинга',
          type: 'array',
          items: {
            type: 'string',
          },
        },
        refactorType: {
          description: 'Тип рефакторинга',
          type: 'string',
          enum: ['rename', 'extract-function', 'inline-function', 'move-class', 'convert-ts-js', 'optimize-imports', 'simplify-logic', 'improve-performance', 'security-fix', 'pattern-update']
        },
        projectContext: {
          description: 'Контекст проекта с архитектурными особенностями',
          type: 'object',
          properties: {
            usesSocketIO: { type: 'boolean' },
            usesWalletAdapter: { type: 'boolean' },
            usesDeflationaryModel: { type: 'boolean' },
            usesPrisma: { type: 'boolean' },
            customTypeScriptConfig: { type: 'boolean' }
          }
        }
      },
      required: ['targetFiles', 'refactorType'],
      additionalProperties: false,
    },
  },
  outputMode: 'structured_output',
  outputSchema: {
    type: 'object',
    properties: {
      results: {
        type: 'string',
        description: 'Результаты рефакторинга'
      },
      changes: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Список изменений'
      }
    },
    required: ['results'],
    additionalProperties: false,
  },

  handleSteps: function* ({ prompt, params }) {
    const targetFiles = params?.targetFiles ?? []
    const refactorType = params?.refactorType ?? 'rename'
    const projectContext = params?.projectContext ?? {}
    
    // Анализируем код перед рефакторингом
    const { toolResult: analysisResult } = yield {
      toolName: 'analyze_code',
      input: {
        files: targetFiles,
        context: projectContext
      },
    } satisfies ToolCall
    
    // Выполняем рефакторинг
    const { toolResult: refactorResult } = yield {
      toolName: 'execute_refactor',
      input: {
        files: targetFiles,
        type: refactorType,
        context: projectContext,
        analysis: analysisResult
      },
    } satisfies ToolCall
    
    // Применяем изменения
    const { toolResult: applyResult } = yield {
      toolName: 'apply_changes',
      input: {
        changes: refactorResult.changes
      },
    } satisfies ToolCall
    
    yield {
      toolName: 'set_output',
      input: {
        results: `Рефакторинг типа ${refactorType} завершен для ${targetFiles.length} файлов`,
        changes: refactorResult.changes
      },
    } satisfies ToolCall
  },
}

export default definition
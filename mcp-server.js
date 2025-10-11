#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class NormalDanceMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "normaldance-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // Инструменты для работы с музыкой
    this.server.setRequestHandler('tools/list', async () => ({
      tools: [
        {
          name: "get_track_info",
          description: "Получить информацию о треке",
          inputSchema: {
            type: "object",
            properties: {
              trackId: { type: "string", description: "ID трека" }
            },
            required: ["trackId"]
          }
        },
        {
          name: "get_recommendations",
          description: "Получить AI рекомендации",
          inputSchema: {
            type: "object",
            properties: {
              userId: { type: "string", description: "ID пользователя" },
              limit: { type: "number", description: "Количество рекомендаций" }
            },
            required: ["userId"]
          }
        },
        {
          name: "stake_tokens",
          description: "Стейкинг NDT токенов",
          inputSchema: {
            type: "object",
            properties: {
              amount: { type: "number", description: "Количество токенов" },
              type: { type: "string", enum: ["fixed", "flexible"], description: "Тип стейкинга" }
            },
            required: ["amount", "type"]
          }
        },
        {
          name: "deploy_to_vercel",
          description: "Деплой NormalDance на Vercel",
          inputSchema: {
            type: "object",
            properties: {
              environment: { type: "string", enum: ["production", "preview", "development"], description: "Окружение деплоя" },
              domain: { type: "string", description: "Кастомный домен (например, normaldance.online)" },
              force: { type: "boolean", description: "Принудительный деплой даже при ошибках" }
            }
          }
        },
        {
          name: "check_deployment_status",
          description: "Проверить статус деплоя",
          inputSchema: {
            type: "object",
            properties: {
              deploymentId: { type: "string", description: "ID деплоя" }
            }
          }
        },
        {
          name: "setup_environment_variables",
          description: "Настроить environment переменные для Vercel",
          inputSchema: {
            type: "object",
            properties: {
              environment: { type: "string", enum: ["production", "preview", "development"], description: "Окружение" }
            }
          }
        }
      ]
    }));

    // Обработчик вызова инструментов
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "get_track_info":
          return this.getTrackInfo(args.trackId);
        case "get_recommendations":
          return this.getRecommendations(args.userId, args.limit || 10);
        case "stake_tokens":
          return this.stakeTokens(args.amount, args.type);
        case "deploy_to_vercel":
          return this.deployToVercel(args.environment, args.domain, args.force);
        case "check_deployment_status":
          return this.checkDeploymentStatus(args.deploymentId);
        case "setup_environment_variables":
          return this.setupEnvironmentVariables(args.environment);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async getTrackInfo(trackId) {
    return {
      content: [
        {
          type: "text",
          text: `Информация о треке ${trackId}:\n- Название: Sample Track\n- Артист: Sample Artist\n- Длительность: 3:45\n- Жанр: Electronic`
        }
      ]
    };
  }

  async getRecommendations(userId, limit) {
    return {
      content: [
        {
          type: "text",
          text: `AI рекомендации для пользователя ${userId}:\n1. Track A - Artist X\n2. Track B - Artist Y\n3. Track C - Artist Z`
        }
      ]
    };
  }

  async stakeTokens(amount, type) {
    const apy = type === 'fixed' ? '12%' : '8-15%';
    return {
      content: [
        {
          type: "text",
          text: `Стейкинг ${amount} NDT токенов (${type}):\n- APY: ${apy}\n- Статус: Активен\n- Период: ${type === 'fixed' ? '30 дней' : 'Гибкий'}`
        }
      ]
    };
  }

  async deployToVercel(environment, domain, force = false) {
    const { execSync } = require('child_process');
    
    try {
      console.log(`🚀 Начинаем деплой NormalDance на Vercel...`);
      
      // Проверяем Vercel CLI
      try {
        execSync('vercel --version', { stdio: 'pipe' });
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: "❌ Vercel CLI не установлен. Пожалуйста установите: npm install -g vercel"
          }]
        };
      }

      // Обновляем package.json версию если нужно
      const buildCommand = environment === 'production' ? 'vercel --prod' : 'vercel';
      const domainFlag = domain ? `--domain ${domain}` : '';
      
      let deploymentResult;
      
      if (force) {
        // Принудительный деплой с игнорированием ошибок
        deploymentResult = execSync(`${buildCommand} ${domainFlag} --force`, { 
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 300000 // 5 минут
        });
      } else {
        deploymentResult = execSync(`${buildCommand} ${domainFlag}`, { 
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 300000
        });
      }

      // Парсим результат для получения URL
      const deploymentUrl = this.extractDeploymentUrl(deploymentResult);

      return {
        content: [{
          type: "text",
          text: `✅ Деплой успешно выполнен!\n\n📊 Детали:\n- Окружение: ${environment}\n- Домен: ${domain || 'Vercel URL'}\n- URL: ${deploymentUrl}\n- Статус: Активен\n\n🔗 Ссылки:\n- Приложение: ${deploymentUrl}\n- Health Check: ${deploymentUrl}/api/health\n- Telegram Mini App: ${deploymentUrl}/telegram-app\n\n⚡ Следующие шаги:\n1. Проверьте health endpoint\n2. Настройте environment переменные в Vercel\n3. Протестируйте основную функциональность`
        }]
      };

    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Ошибка деплоя: ${error.message}\n\n🔧 Возможные решения:\n1. Проверьте подключение к интернету\n2. Убедитесь что Vercel CLI авторизован\n3. Проверьте наличие环境 переменных\n4. Попробуйте с флагом --force`
        }]
      };
    }
  }

  async checkDeploymentStatus(deploymentId) {
    const { execSync } = require('child_process');
    
    try {
      const result = execSync(`vercel inspect ${deploymentId}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });

      return {
        content: [{
          type: "text",
          text: `📊 Статус деплоя ${deploymentId}:\n\n${result}\n\n✅ Проверьте URL для доступа к приложению`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Не удалось получить статус деплоя: ${error.message}`
        }]
      };
    }
  }

  async setupEnvironmentVariables(environment) {
    const fs = require('fs');
    const path = require('path');

    // Читаем environment переменные из файла
    const envFilePath = path.join(process.cwd(), 'VERCEL_ENV_PRODUCTION_OPTIMIZED.txt');
    
    try {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const envVars = this.parseEnvFile(envContent);

      let instructions = `🔧 Environment переменные для ${environment}:\n\n`;
      
      envVars.forEach((envVar, index) => {
        instructions += `${index + 1}. ${envVar.name}\n`;
        instructions += `   Значение: ${envVar.value}\n\n`;
      });

      instructions += `📋 Инструкции:\n`;
      instructions += `1. Откройте Vercel Dashboard → Project Settings\n`;
      instructions += `2. Перейдите в Environment Variables\n`;
      instructions += `3. Добавьте переменные выше\n`;
      instructions += `4. Выберите окружения: Production, Preview, Development\n`;
      instructions += `5. Сохраните и redeploy\n\n`;
      instructions += `⚠️ Важно: Используйте реальные значения для production!`;

      return {
        content: [{
          type: "text",
          text: instructions
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Не удалось прочитать environment переменные: ${error.message}`
        }]
      };
    }
  }

  extractDeploymentUrl(output) {
    const urlMatch = output.match(/https:\/\/[a-zA-Z0-9.-]+\.vercel\.app/);
    return urlMatch ? urlMatch[0] : 'URL not found';
  }

  parseEnvFile(content) {
    const lines = content.split('\n');
    const envVars = [];
    let currentValue = '';

    lines.forEach(line => {
      if (line.trim().startsWith('#') || line.trim() === '') {
        return;
      }

      if (line.includes('=')) {
        if (currentValue) {
          envVars.push({ name: currentValue.split('=')[0], value: currentValue.split('=')[1] });
        }
        currentValue = line.trim();
      } else if (currentValue) {
        currentValue += ' ' + line.trim();
      }
    });

    if (currentValue) {
      envVars.push({ name: currentValue.split('=')[0], value: currentValue.split('=')[1] });
    }

    return envVars;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("NORMAL DANCE MCP Server запущен");
  }
}

const server = new NormalDanceMCPServer();
server.run().catch(console.error);
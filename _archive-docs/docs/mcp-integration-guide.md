# 🔗 MCP Integration Guide - NORMAL DANCE

Руководство по интеграции Model Context Protocol (MCP) в децентрализованную музыкальную платформу NORMAL DANCE.

## 🎯 Обзор интеграции

MCP позволит создать унифицированный интерфейс для взаимодействия AI-агентов с различными компонентами платформы:
- Рекомендательная система
- Аналитика пользователей
- NFT маркетплейс
- Стейкинг интерфейс
- Музыкальный контент

## 🏗️ Архитектура MCP

### 1. MCP Server Components

```typescript
// src/mcp/server.ts
interface MCPServer {
  // Музыкальные данные
  music: MusicContextProvider;
  // Пользовательские данные
  users: UserContextProvider;
  // NFT данные
  nft: NFTContextProvider;
  // Стейкинг данные
  staking: StakingContextProvider;
  // Аналитика
  analytics: AnalyticsContextProvider;
}
```

### 2. Context Providers

#### Music Context Provider
```typescript
// src/mcp/providers/music.ts
export class MusicContextProvider {
  async getTracks(filters: TrackFilters): Promise<Track[]> {
    return await prisma.track.findMany({
      where: filters,
      include: { artist: true, genre: true }
    });
  }

  async getRecommendations(userId: string): Promise<Track[]> {
    return await aiRecommendationService.getPersonalized(userId);
  }

  async getAudioFeatures(trackId: string): Promise<AudioFeatures> {
    return await audioAnalysisService.analyze(trackId);
  }
}
```

#### User Context Provider
```typescript
// src/mcp/providers/user.ts
export class UserContextProvider {
  async getUserProfile(userId: string): Promise<UserProfile> {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        achievements: true,
        stakingPositions: true,
        nftCollection: true 
      }
    });
  }

  async getListeningHistory(userId: string): Promise<PlayHistory[]> {
    return await prisma.playHistory.findMany({
      where: { userId },
      orderBy: { playedAt: 'desc' },
      take: 100
    });
  }
}
```

## 🛠️ Реализация MCP Server

### 1. Основной MCP Server

```typescript
// src/mcp/index.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class NormalDanceMCPServer {
  private server: Server;
  
  constructor() {
    this.server = new Server({
      name: 'normaldance-mcp',
      version: '1.0.0'
    }, {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {}
      }
    });
    
    this.setupHandlers();
  }

  private setupHandlers() {
    // Ресурсы
    this.server.setRequestHandler('resources/list', this.listResources);
    this.server.setRequestHandler('resources/read', this.readResource);
    
    // Инструменты
    this.server.setRequestHandler('tools/list', this.listTools);
    this.server.setRequestHandler('tools/call', this.callTool);
    
    // Промпты
    this.server.setRequestHandler('prompts/list', this.listPrompts);
    this.server.setRequestHandler('prompts/get', this.getPrompt);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 2. Resources Implementation

```typescript
// src/mcp/resources.ts
export const resources = {
  // Музыкальные треки
  'track://': {
    name: 'Music Tracks',
    description: 'Access to music tracks and metadata',
    mimeType: 'application/json'
  },
  
  // Пользовательские данные
  'user://': {
    name: 'User Profiles',
    description: 'User profiles and activity data',
    mimeType: 'application/json'
  },
  
  // NFT коллекции
  'nft://': {
    name: 'NFT Collections',
    description: 'NFT marketplace data',
    mimeType: 'application/json'
  },
  
  // Стейкинг данные
  'staking://': {
    name: 'Staking Data',
    description: 'Staking pools and positions',
    mimeType: 'application/json'
  }
};

export async function readResource(uri: string): Promise<any> {
  const [protocol, path] = uri.split('://');
  
  switch (protocol) {
    case 'track':
      return await musicProvider.getTrack(path);
    case 'user':
      return await userProvider.getUser(path);
    case 'nft':
      return await nftProvider.getNFT(path);
    case 'staking':
      return await stakingProvider.getPosition(path);
    default:
      throw new Error(`Unknown protocol: ${protocol}`);
  }
}
```

### 3. Tools Implementation

```typescript
// src/mcp/tools.ts
export const tools = {
  // Поиск музыки
  search_music: {
    name: 'search_music',
    description: 'Search for music tracks',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        genre: { type: 'string' },
        limit: { type: 'number', default: 10 }
      }
    }
  },
  
  // Получение рекомендаций
  get_recommendations: {
    name: 'get_recommendations',
    description: 'Get personalized music recommendations',
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        count: { type: 'number', default: 20 }
      }
    }
  },
  
  // Анализ NFT рынка
  analyze_nft_market: {
    name: 'analyze_nft_market',
    description: 'Analyze NFT market trends',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string' },
        timeframe: { type: 'string', default: '7d' }
      }
    }
  }
};

export async function callTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'search_music':
      return await musicService.search(args.query, args);
    case 'get_recommendations':
      return await aiService.getRecommendations(args.userId, args.count);
    case 'analyze_nft_market':
      return await nftAnalytics.analyze(args.collection, args.timeframe);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

## 🎵 Специализированные MCP Компоненты

### 1. AI Recommendation MCP

```typescript
// src/mcp/ai-recommendations.ts
export class AIRecommendationMCP {
  async getPersonalizedPrompt(userId: string): Promise<string> {
    const user = await userProvider.getProfile(userId);
    const history = await userProvider.getListeningHistory(userId);
    
    return `
User Profile: ${user.name}
Favorite Genres: ${user.favoriteGenres.join(', ')}
Recent Listening: ${history.slice(0, 10).map(h => h.track.title).join(', ')}
Mood Preference: ${user.currentMood || 'neutral'}
    `;
  }

  async generateRecommendations(context: string): Promise<Track[]> {
    // Интеграция с AI моделью через MCP
    const recommendations = await this.callAIModel(context);
    return recommendations;
  }
}
```

### 2. NFT Market MCP

```typescript
// src/mcp/nft-market.ts
export class NFTMarketMCP {
  async getMarketContext(): Promise<string> {
    const stats = await nftService.getMarketStats();
    const trending = await nftService.getTrendingCollections();
    
    return `
Market Volume (24h): ${stats.volume24h} SOL
Active Collections: ${stats.activeCollections}
Trending: ${trending.map(c => c.name).join(', ')}
Average Price: ${stats.averagePrice} SOL
    `;
  }

  async analyzeTrends(timeframe: string): Promise<MarketAnalysis> {
    return await nftAnalytics.getTrends(timeframe);
  }
}
```

## 🔧 Конфигурация и настройка

### 1. MCP Configuration

```json
// mcp.config.json
{
  "server": {
    "name": "normaldance-mcp",
    "version": "1.0.0",
    "capabilities": {
      "resources": true,
      "tools": true,
      "prompts": true
    }
  },
  "providers": {
    "music": {
      "enabled": true,
      "cache_ttl": 300
    },
    "users": {
      "enabled": true,
      "privacy_mode": true
    },
    "nft": {
      "enabled": true,
      "real_time": true
    },
    "staking": {
      "enabled": true,
      "update_interval": 60
    }
  },
  "security": {
    "rate_limit": 100,
    "auth_required": true,
    "allowed_origins": ["localhost:3000", "dnb1st.ru"]
  }
}
```

### 2. Environment Variables

```bash
# .env.mcp
MCP_SERVER_PORT=3001
MCP_AUTH_SECRET=your-mcp-secret
MCP_CACHE_REDIS_URL=redis://localhost:6379
MCP_LOG_LEVEL=info
MCP_ENABLE_METRICS=true
```

## 🚀 Deployment и интеграция

### 1. Docker Configuration

```dockerfile
# Dockerfile.mcp
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY src/mcp ./src/mcp
COPY mcp.config.json ./

EXPOSE 3001
CMD ["node", "src/mcp/index.js"]
```

### 2. Kubernetes Deployment

```yaml
# k8s/mcp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: normaldance-mcp
spec:
  replicas: 2
  selector:
    matchLabels:
      app: normaldance-mcp
  template:
    metadata:
      labels:
        app: normaldance-mcp
    spec:
      containers:
      - name: mcp-server
        image: normaldance/mcp:latest
        ports:
        - containerPort: 3001
        env:
        - name: MCP_SERVER_PORT
          value: "3001"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## 📊 Мониторинг и метрики

### 1. MCP Metrics

```typescript
// src/mcp/metrics.ts
export class MCPMetrics {
  private metrics = {
    requests_total: 0,
    requests_by_resource: new Map(),
    response_time: [],
    errors_total: 0
  };

  recordRequest(resource: string, responseTime: number) {
    this.metrics.requests_total++;
    this.metrics.requests_by_resource.set(
      resource, 
      (this.metrics.requests_by_resource.get(resource) || 0) + 1
    );
    this.metrics.response_time.push(responseTime);
  }

  recordError() {
    this.metrics.errors_total++;
  }

  getMetrics() {
    return {
      ...this.metrics,
      avg_response_time: this.metrics.response_time.reduce((a, b) => a + b, 0) / this.metrics.response_time.length
    };
  }
}
```

### 2. Health Checks

```typescript
// src/mcp/health.ts
export class MCPHealthCheck {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkProviders()
    ]);

    return {
      status: checks.every(c => c.status === 'fulfilled') ? 'healthy' : 'unhealthy',
      checks: checks.map((c, i) => ({
        name: ['database', 'redis', 'providers'][i],
        status: c.status,
        message: c.status === 'rejected' ? c.reason : 'OK'
      }))
    };
  }
}
```

## 🔐 Безопасность

### 1. Authentication

```typescript
// src/mcp/auth.ts
export class MCPAuth {
  async validateToken(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, process.env.MCP_AUTH_SECRET);
      return !!decoded;
    } catch {
      return false;
    }
  }

  async authorize(userId: string, resource: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(resource);
  }
}
```

### 2. Rate Limiting

```typescript
// src/mcp/rate-limit.ts
export class MCPRateLimit {
  private limits = new Map<string, { count: number; resetTime: number }>();

  async checkLimit(clientId: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.limits.get(clientId);

    if (!limit || now > limit.resetTime) {
      this.limits.set(clientId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (limit.count >= 100) {
      return false;
    }

    limit.count++;
    return true;
  }
}
```

## 🧪 Тестирование

### 1. Unit Tests

```typescript
// tests/mcp/providers.test.ts
describe('MCP Providers', () => {
  test('Music provider returns tracks', async () => {
    const provider = new MusicContextProvider();
    const tracks = await provider.getTracks({ genre: 'electronic' });
    
    expect(tracks).toHaveLength(10);
    expect(tracks[0]).toHaveProperty('title');
  });

  test('User provider handles privacy', async () => {
    const provider = new UserContextProvider();
    const profile = await provider.getUserProfile('user-123');
    
    expect(profile.email).toBeUndefined();
    expect(profile.publicData).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
// tests/mcp/integration.test.ts
describe('MCP Integration', () => {
  test('Full recommendation flow', async () => {
    const server = new NormalDanceMCPServer();
    await server.start();

    const recommendations = await server.callTool('get_recommendations', {
      userId: 'test-user',
      count: 5
    });

    expect(recommendations).toHaveLength(5);
    expect(recommendations[0]).toHaveProperty('confidence');
  });
});
```

## 📚 Использование

### 1. Client Integration

```typescript
// Client example
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'normaldance-client',
  version: '1.0.0'
});

// Получение рекомендаций
const recommendations = await client.request('tools/call', {
  name: 'get_recommendations',
  arguments: { userId: 'user-123', count: 10 }
});

// Чтение ресурса
const track = await client.request('resources/read', {
  uri: 'track://track-456'
});
```

### 2. AI Agent Integration

```typescript
// AI Agent example
class MusicAIAgent {
  constructor(private mcpClient: Client) {}

  async generatePlaylist(userPrompt: string): Promise<Playlist> {
    // Получаем контекст пользователя
    const userContext = await this.mcpClient.request('prompts/get', {
      name: 'user_context',
      arguments: { userId: this.userId }
    });

    // Генерируем рекомендации
    const tracks = await this.mcpClient.request('tools/call', {
      name: 'search_music',
      arguments: { query: userPrompt, limit: 20 }
    });

    return this.createPlaylist(tracks);
  }
}
```

## 🔄 Roadmap

### Phase 1 (Q1 2025)
- ✅ Базовая MCP архитектура
- ✅ Music и User providers
- ✅ Основные инструменты поиска

### Phase 2 (Q2 2025)
- 🔄 NFT и Staking providers
- 🔄 Расширенная аналитика
- 🔄 Real-time обновления

### Phase 3 (Q3 2025)
- ⏳ AI-агенты для кураторства
- ⏳ Автоматическое создание плейлистов
- ⏳ Предиктивная аналитика

### Phase 4 (Q4 2025)
- ⏳ Мультимодальные возможности
- ⏳ Интеграция с внешними AI
- ⏳ Федеративное обучение

## 📞 Поддержка

- **Документация**: [MCP Official Docs](https://modelcontextprotocol.io)
- **GitHub**: [NORMAL DANCE MCP](https://github.com/normaldance/mcp)
- **Discord**: #mcp-integration канал
- **Email**: mcp-support@normaldance.com

---

*Последнее обновление: January 2025*
*Версия: 1.0.0*
import { PrismaClient } from "@prisma/client";
import { EventEmitter } from "events";

// Тип для глобального объекта с Prisma клиентом
declare global {
  var prisma: PrismaClient | undefined;
}

// Интерфейс для конфигурации шардинга
export interface ShardingConfig {
  enabled: boolean;
  shardCount: number;
  defaultShard: number;
  strategy: "user_id" | "hash" | "range" | "custom";
  customShardFunction?: (data: any) => number;
}

// Интерфейс для шарда
export interface Shard {
  id: number;
  client: PrismaClient;
  connectionString: string;
  status: "active" | "inactive" | "maintenance";
}

// Класс для управления шардингом
export class PrismaShardingManager {
  private shards: Map<number, Shard> = new Map();
  private _config: ShardingConfig;

  // Геттер для получения конфигурации
  get config(): ShardingConfig {
    return this._config;
  }

  // Сеттер для обновления конфигурации
  set config(newConfig: ShardingConfig) {
    this._config = newConfig;
  }
  private logger: EventEmitter = new EventEmitter();

  constructor(config: ShardingConfig) {
    this._config = config;
  }

  // Инициализация шардов
  async initializeShards(connectionStrings: string[]): Promise<void> {
    if (!this.config.enabled) {
      // Если шардинг отключен, создаем один шард с текущим подключением
      const defaultClient = new PrismaClient();
      this.shards.set(this.config.defaultShard, {
        id: this.config.defaultShard,
        client: defaultClient,
        connectionString: process.env.DATABASE_URL || "file:./dev.db",
        status: "active",
      });
      return;
    }

    if (connectionStrings.length !== this.config.shardCount) {
      throw new Error(
        `Количество строк подключения (${connectionStrings.length}) не соответствует shardCount (${this.config.shardCount})`
      );
    }

    for (let i = 0; i < connectionStrings.length; i++) {
      const client = new PrismaClient({
        datasources: {
          db: {
            url: connectionStrings[i],
          },
        },
      });

      this.shards.set(i, {
        id: i,
        client,
        connectionString: connectionStrings[i],
        status: "active",
      });
    }
  }

  // Получение шарда по ID
  getShard(shardId: number): PrismaClient | null {
    const shard = this.shards.get(shardId);
    return shard?.status === "active" ? shard.client : null;
  }

  // Определение ID шарда для конкретной сущности
  getShardId(data: any): number {
    if (!this.config.enabled) {
      return this.config.defaultShard;
    }

    switch (this.config.strategy) {
      case "user_id":
        if (
          typeof data.userId === "number" ||
          typeof data.user_id === "number"
        ) {
          const userId = data.userId || data.user_id;
          return userId % this.config.shardCount;
        }
        throw new Error(
          "Для стратегии user_id требуется поле userId или user_id"
        );

      case "hash":
        const hashInput = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
          const char = hashInput.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % this.config.shardCount;

      case "range":
        if (typeof data.id === "number") {
          return data.id % this.config.shardCount;
        }
        throw new Error("Для стратегии range требуется числовое поле id");

      case "custom":
        if (this.config.customShardFunction) {
          const shardId = this.config.customShardFunction(data);
          if (shardId < 0 || shardId >= this.config.shardCount) {
            throw new Error(
              `ID шарда ${shardId} вне допустимого диапазона 0-${
                this.config.shardCount - 1
              }`
            );
          }
          return shardId;
        }
        throw new Error("Для стратегии custom требуется customShardFunction");

      default:
        return this.config.defaultShard;
    }
  }

  // Получение клиента для конкретной сущности
  getShardClient(data: any): PrismaClient {
    const shardId = this.getShardId(data);
    const shard = this.getShard(shardId);

    if (!shard) {
      throw new Error(`Шард ${shardId} недоступен`);
    }

    return shard;
  }

  // Выполнение транзакции на одном шарде
  async transaction(
    shardId: number,
    fn: (tx: any) => Promise<any>
  ): Promise<any> {
    const shard = this.getShard(shardId);
    if (!shard) {
      throw new Error(`Шард ${shardId} недоступен для транзакции`);
    }

    return await shard.$transaction(fn);
  }

  // Выполнение транзакции между шардами (ограничено)
  async crossShardTransaction(
    shardIds: number[],
    fn: (txs: any[]) => Promise<any>
  ): Promise<any> {
    if (shardIds.length === 1) {
      return await this.transaction(shardIds[0], fn);
    }

    // Для межшардовых транзакций требуются специальные стратегии
    // Пока реализуем упрощенную версию с последовательным выполнением
    const txs = await Promise.all(
      shardIds.map((shardId) => {
        const shard = this.getShard(shardId);
        if (!shard) {
          throw new Error(`Шард ${shardId} недоступен для транзакции`);
        }
        return shard.$transaction((tx: any) => tx);
      })
    );

    // Выполняем пользовательскую функцию с транзакциями
    return await fn(txs);
  }

  // Закрытие всех шардов
  async disconnect(): Promise<void> {
    const disconnectPromises = Array.from(this.shards.values()).map((shard) =>
      shard.client.$disconnect()
    );

    await Promise.all(disconnectPromises);
    this.shards.clear();
  }

  // Получение всех активных шардов
  getActiveShards(): number[] {
    return Array.from(this.shards.values())
      .filter((shard) => shard.status === "active")
      .map((shard) => shard.id);
  }

  // Переключение статуса шарда
  setShardStatus(
    shardId: number,
    status: "active" | "inactive" | "maintenance"
  ): void {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.status = status;
    }
  }
}

// Глобальный экземпляр шардинг менеджера
let shardingManager: PrismaShardingManager | undefined;

// Функция для инициализации шардинга
export function initializeSharding(
  config: ShardingConfig,
  connectionStrings: string[]
): Promise<void> {
  shardingManager = new PrismaShardingManager(config);
  return shardingManager.initializeShards(connectionStrings);
}

// Функция для получения шардинг менеджера
export function getShardingManager(): PrismaShardingManager | undefined {
  return shardingManager;
}

// Функция для получения клиента для конкретной сущности (обратная совместимость)
export function getShardClientFor(data: any): PrismaClient {
  if (!shardingManager) {
    // Если шардинг не инициализирован, возвращаем глобальный клиент
    return (globalThis as any).prisma;
  }

  return shardingManager.getShardClient(data);
}

// Функция для получения клиента по ID шарда
export function getShardClientById(shardId: number): PrismaClient {
  if (!shardingManager) {
    // Если шардинг не инициализирован, возвращаем глобальный клиент
    return (globalThis as any).prisma;
  }

  return shardingManager.getShard(shardId) || (globalThis as any).prisma;
}

// Обертка для обеспечения обратной совместимости
export class PrismaShardingWrapper {
  private manager: PrismaShardingManager | undefined;

  constructor() {
    this.manager = getShardingManager();
  }

  // Методы для работы с конкретными сущностями
  getUserShard(userId: number): PrismaClient {
    if (!this.manager) return (globalThis as any).prisma;

    return this.manager.getShardClient({ userId });
  }

  getModelShard(modelData: any): PrismaClient {
    if (!this.manager) return (globalThis as any).prisma;

    return this.manager.getShardClient(modelData);
  }

  // Методы для выполнения транзакций
  async executeTransaction(shardId: number, fn: (tx: any) => Promise<any>) {
    if (!this.manager) {
      // Если шардинг не включен, используем глобальный клиент
      return await (globalThis as any).prisma.$transaction(fn);
    }

    return await this.manager.transaction(shardId, fn);
  }

  // Метод для получения всех шардов (для миграций и административных задач)
  getAllShards(): PrismaClient[] {
    if (!this.manager) return [(globalThis as any).prisma];

    return this.manager
      .getActiveShards()
      .map((shardId) => this.manager!.getShard(shardId)!);
  }

  // Метод для проверки состояния шардинга
  isShardingEnabled(): boolean {
    return this.manager ? this.manager.config.enabled : false;
  }

  // Метод для включения/выключения шардинга
  enableSharding(enabled: boolean): void {
    if (this.manager) {
      this.manager.config.enabled = enabled;
    }
  }

  // Метод для обновления конфигурации шардинга
  updateConfig(config: ShardingConfig): void {
    if (this.manager) {
      this.manager.config = config;
    }
  }

  // Метод для получения текущей конфигурации шардинга
  getConfig(): ShardingConfig | null {
    if (this.manager) {
      return this.manager.config;
    }
    return null;
  }

  // Метод для получения всех шардов с информацией о них
  getAllShardsInfo(): {
    id: number;
    connectionString: string;
    status: string;
  }[] {
    if (!this.manager) {
      // Возвращаем информацию о глобальном клиенте
      return [
        {
          id: 0,
          connectionString: process.env.DATABASE_URL || "file:./dev.db",
          status: "active",
        },
      ];
    }

    return Array.from(this.manager["shards"].values()).map((shard) => ({
      id: shard.id,
      connectionString: shard.connectionString,
      status: shard.status,
    }));
  }

  // Метод для переподключения к шардам
  async reconnectShards(): Promise<void> {
    if (this.manager) {
      const config = this.manager.config;
      const shardConnections = Array.from(this.manager["shards"].values()).map(
        (shard) => shard.connectionString
      );

      // Отключаем текущие соединения
      await this.manager.disconnect();

      // Инициализируем шарды заново
      await this.manager.initializeShards(shardConnections);
    }
  }
}

// Создание глобального экземпляра обертки для обратной совместимости
export const shardingWrapper = new PrismaShardingWrapper();

// Функция для включения/выключения шардинга
export function enableSharding(enabled: boolean): void {
  if (shardingManager) {
    shardingManager.config.enabled = enabled;
  }
}

// Функция для проверки состояния шардинга
export function isShardingEnabled(): boolean {
  return shardingManager ? shardingManager.config.enabled : false;
}

// Экспорт конфигурации по умолчанию для отключения шардинга
export const DEFAULT_SHARDING_CONFIG: ShardingConfig = {
  enabled: false,
  shardCount: 1,
  defaultShard: 0,
  strategy: "hash",
};

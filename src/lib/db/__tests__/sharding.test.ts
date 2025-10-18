import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_SHARDING_CONFIG,
  PrismaShardingManager,
  PrismaShardingWrapper,
  ShardingConfig,
  getShardingManager,
  initializeSharding,
} from "../sharding";

// Мокаем PrismaClient для тестирования
jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn(() => ({
      $transaction: jest.fn((fn) => fn({})),
      $disconnect: jest.fn(() => Promise.resolve()),
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    })),
  };
});

describe("Prisma Sharding Module", () => {
  let config: ShardingConfig;
  let connectionStrings: string[];

  beforeEach(() => {
    config = {
      ...DEFAULT_SHARDING_CONFIG,
      enabled: true,
      shardCount: 3,
      defaultShard: 0,
      strategy: "user_id",
    };

    connectionStrings = [
      "file:./shard0.db",
      "file:./shard1.db",
      "file:./shard2.db",
    ];
  });

  afterEach(async () => {
    const manager = getShardingManager();
    if (manager) {
      await manager.disconnect();
    }
  });

  describe("Sharding Manager", () => {
    it("should initialize shards correctly", async () => {
      const manager = new PrismaShardingManager(config);
      await manager.initializeShards(connectionStrings);

      expect(manager.getActiveShards().length).toBe(3);
    });

    it("should determine shard ID correctly with user_id strategy", () => {
      const manager = new PrismaShardingManager(config);

      // Тестируем стратегию user_id
      const shardId1 = manager.getShardId({ userId: 10 });
      const shardId2 = manager.getShardId({ userId: 11 });
      const shardId3 = manager.getShardId({ userId: 12 });

      expect(shardId1).toBe(10 % 3); // 1
      expect(shardId2).toBe(11 % 3); // 2
      expect(shardId3).toBe(12 % 3); // 0
    });

    it("should determine shard ID correctly with hash strategy", () => {
      const hashConfig: ShardingConfig = { ...config, strategy: "hash" };
      const manager = new PrismaShardingManager(hashConfig);

      const shardId1 = manager.getShardId({ someData: "data1" });
      const shardId2 = manager.getShardId({ someData: "data2" });

      expect(shardId1).toBeGreaterThanOrEqual(0);
      expect(shardId1).toBeLessThan(3);
      expect(shardId2).toBeGreaterThanOrEqual(0);
      expect(shardId2).toBeLessThan(3);
    });

    it("should return default shard when sharding is disabled", () => {
      const disabledConfig = { ...config, enabled: false };
      const manager = new PrismaShardingManager(disabledConfig);

      const shardId = manager.getShardId({ userId: 10 });

      expect(shardId).toBe(disabledConfig.defaultShard);
    });
  });

  describe("Sharding Wrapper", () => {
    it("should provide backward compatibility", async () => {
      await initializeSharding(config, connectionStrings);

      const wrapper = new PrismaShardingWrapper();

      expect(wrapper.isShardingEnabled()).toBe(true);
      expect(wrapper.getConfig()).toEqual(config);
    });

    it("should allow enabling/disabling sharding", () => {
      const wrapper = new PrismaShardingWrapper();

      wrapper.enableSharding(false);
      expect(wrapper.isShardingEnabled()).toBe(false);

      wrapper.enableSharding(true);
      expect(wrapper.isShardingEnabled()).toBe(true);
    });

    it("should update configuration", () => {
      const wrapper = new PrismaShardingWrapper();
      const newConfig = { ...config, shardCount: 5 };

      wrapper.updateConfig(newConfig);
      expect(wrapper.getConfig()).toEqual(newConfig);
    });
  });

  describe("Integration with existing db.ts", () => {
    it("should maintain backward compatibility with global prisma instance", () => {
      // Имитация существующего глобального экземпляра Prisma
      (globalThis as any).prisma = new PrismaClient();

      const wrapper = new PrismaShardingWrapper();

      // Даже если шардинг не инициализирован, обертка должна корректно работать
      const client = wrapper.getUserShard(123);
      expect(client).toBeDefined();
    });
  });
});

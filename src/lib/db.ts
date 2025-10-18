import { PrismaClient } from "@prisma/client";
import { DEFAULT_SHARDING_CONFIG, initializeSharding } from "./db/sharding";

// Тип для глобального объекта с флагом инициализации шардинга
declare global {
  var shardingInitialized: boolean;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Инициализация шардинг менеджера с конфигурацией по умолчанию
if (!globalThis.shardingInitialized) {
  initializeSharding(DEFAULT_SHARDING_CONFIG, [
    process.env.DATABASE_URL || "file:./dev.db",
  ]);
  globalThis.shardingInitialized = true;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    errorFormat: "minimal",
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

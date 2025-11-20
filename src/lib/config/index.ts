import { z } from "zod";

// Environment schema validation
const envSchema = z.object({
  // Node.js
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default("normaldance"),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("24h"),

  // Redis
  REDIS_URL: z.string().url().default("redis://localhost:6379"),

  // API Keys
  REGRU_API_KEY: z.string(),
  REGRU_USERNAME: z.string(),
  PRIVATE_KEY: z.string(),

  // Domains
  DOMAIN: z.string().default("example.com"),
  FRONTEND_DOMAIN: z.string(),
  API_DOMAIN: z.string(),
  PROMETHEUS_DOMAIN: z.string().optional(),
  GRAFANA_DOMAIN: z.string().optional(),

  // Next.js
  NEXT_PUBLIC_API_URL: z.string().url(),

  // Monitoring
  GRAFANA_ADMIN_PASSWORD: z.string().default("admin"),

  // IPFS
  IPFS_PATH: z.string().default("/data/ipfs"),

  // Hardhat
  HARDHAT_NETWORK: z.string().default("localhost"),

  // Debug
  DEBUG: z.string().optional(),
});

// Parse and validate environment variables
function parseEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join(".")}: ${err.message}`);
      });
    }
    throw error;
  }
}

// Configuration object
export const config = {
  // Environment
  env: parseEnv(),

  // Application
  app: {
    name: "NormalDance",
    version: process.env.npm_package_version || "1.0.0",
    port: 4000,
    isDevelopment: parseEnv().NODE_ENV === "development",
    isProduction: parseEnv().NODE_ENV === "production",
    isTest: parseEnv().NODE_ENV === "test",
  },

  // Database
  database: {
    url: parseEnv().DATABASE_URL,
    host: parseEnv().DB_HOST,
    port: parseEnv().DB_PORT,
    name: parseEnv().DB_NAME,
    user: parseEnv().DB_USER,
    password: parseEnv().DB_PASSWORD,
  },

  // JWT
  jwt: {
    secret: parseEnv().JWT_SECRET,
    expiresIn: parseEnv().JWT_EXPIRES_IN,
  },

  // Redis
  redis: {
    url: parseEnv().REDIS_URL,
  },

  // External APIs
  apis: {
    regru: {
      apiKey: parseEnv().REGRU_API_KEY,
      username: parseEnv().REGRU_USERNAME,
    },
    smartContracts: {
      privateKey: parseEnv().PRIVATE_KEY,
      network: parseEnv().HARDHAT_NETWORK,
    },
  },

  // Domains
  domains: {
    main: parseEnv().DOMAIN,
    frontend: parseEnv().FRONTEND_DOMAIN,
    api: parseEnv().API_DOMAIN,
    prometheus: parseEnv().PROMETHEUS_DOMAIN,
    grafana: parseEnv().GRAFANA_DOMAIN,
  },

  // Monitoring
  monitoring: {
    grafana: {
      adminPassword: parseEnv().GRAFANA_ADMIN_PASSWORD,
    },
  },

  // IPFS
  ipfs: {
    path: parseEnv().IPFS_PATH,
  },

  // Debug
  debug: parseEnv().DEBUG,
};

// Type exports
export type Config = typeof config;
export type Env = z.infer<typeof envSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Utility function for runtime validation
export function validateConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          (err) => `${err.path.join(".")}: ${err.message}`
        ),
      };
    }
    return { success: false, errors: ["Unknown validation error"] };
  }
}

// Export for easy access
export default config;

# План улучшения тестового покрытия

## Обзор

В этом документе описывается план реализации полноценной системы тестирования проекта NormalDance. Это улучшение имеет средний приоритет для Q2-Q3 2025 года, так как обеспечивает гарантию качества кода и более надежные релизы.

## Текущая ситуация

### Существующая система тестирования

- Ограниченное количество unit-тестов
- Отсутствие интеграционных тестов
- Нет E2E-тестов
- Нет автоматического тестирования в CI

### Проблемы текущей реализации

- Низкое тестовое покрытие
- Отсутствие автоматизированного тестирования
- Нет тестирования Web3-функциональности
- Нет тестирования безопасности

## Цели реализации

### Основные цели

- Добавить unit-тесты для основных компонентов
- Реализовать интеграционные тесты
- Создать E2E-тесты с Playwright
- Настроить автоматическое тестирование в CI

### Технические цели

- Покрытие основных функций тестами
- Автоматизированное тестирование
- Тестирование Web3-функциональности
- Тестирование безопасности

## План реализации

### Этап 1: Подготовка инфраструктуры (Неделя 1-2)

- Настройка Jest для unit-тестов
- Настройка Playwright для E2E-тестов
- Настройка тестовой базы данных
- Создание фикстур и моков

### Этап 2: Unit-тесты (Неделя 3-5)

- Тестирование основных утилит
- Тестирование сервисов
- Тестирование компонентов
- Покрытие бизнес-логики

### Этап 3: Интеграционные тесты (Неделя 6-7)

- Тестирование API-эндпоинтов
- Тестирование базы данных
- Тестирование Web3-интеграций
- Тестирование аутентификации

### Этап 4: E2E-тесты (Неделя 8-9)

- Тестирование пользовательских сценариев
- Тестирование Web3-взаимодействий
- Тестирование покупки NFT
- Тестирование мемориалов

### Этап 5: CI/CD интеграция (Неделя 10)

- Настройка автоматического запуска тестов
- Настройка отчетов о покрытии
- Настройка ограничений по покрытию
- Обновление документации

## Технические детали

### Настройка тестовой инфраструктуры

#### Конфигурация Jest

```javascript
// jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/?(*.)+(spec|test).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/mocks/**/*",
    "!src/types/**/*",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
```

#### Конфигурация Playwright

```javascript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results.json" }],
    ["junit", { outputFile: "junit-results.xml" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run build && npm run start" : "npm run dev",
    url: process.env.BASE_URL || "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Unit-тесты

#### Тестирование утилит

```typescript
// src/lib/__tests__/utils.test.ts
import { formatTime, validateSolanaAddress } from "@/lib/utils";

describe("Utils", () => {
  describe("formatTime", () => {
    it("should format seconds to MM:SS", () => {
      expect(formatTime(65)).toBe("01:05");
      expect(formatTime(3661)).toBe("61:01");
      expect(formatTime(0)).toBe("00:00");
    });
  });

  describe("validateSolanaAddress", () => {
    it("should validate correct Solana address", () => {
      const validAddress = "4UtUBm2DywkBzXjT5WVX5149FGgJTJG7F82PMhJ7ep1o";
      expect(validateSolanaAddress(validAddress)).toBe(true);
    });

    it("should reject invalid Solana address", () => {
      const invalidAddress = "invalid_address";
      expect(validateSolanaAddress(invalidAddress)).toBe(false);
    });
  });
});
```

#### Тестирование сервисов

```typescript
// src/services/__tests__/track-service.test.ts
import { TrackService } from "@/services/track-service";
import { prisma } from "@/lib/db";

// Мок базы данных
jest.mock("@/lib/db", () => ({
  prisma: {
    track: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("TrackService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTracksByArtist", () => {
    it("should return tracks for an artist", async () => {
      const mockTracks = [
        { id: "1", title: "Track 1", artistId: "artist1" },
        { id: "2", title: "Track 2", artistId: "artist1" },
      ];

      (prisma.track.findMany as jest.Mock).mockResolvedValue(mockTracks);

      const tracks = await TrackService.getTracksByArtist("artist1");

      expect(prisma.track.findMany).toHaveBeenCalledWith({
        where: { artistId: "artist1" },
        orderBy: { createdAt: "desc" },
      });
      expect(tracks).toEqual(mockTracks);
    });
  });

  describe("createTrack", () => {
    it("should create a new track", async () => {
      const mockTrack = {
        id: "new-track",
        title: "New Track",
        artistId: "artist1",
      };
      const trackData = {
        title: "New Track",
        artistId: "artist1",
        coverImage: "image.jpg",
      };

      (prisma.track.create as jest.Mock).mockResolvedValue(mockTrack);

      const result = await TrackService.createTrack(trackData);

      expect(prisma.track.create).toHaveBeenCalledWith({
        data: trackData,
      });
      expect(result).toEqual(mockTrack);
    });
  });
});
```

### Интеграционные тесты

#### Тестирование API-эндпоинтов

```typescript
// tests/integration/api/tracks.test.ts
import request from "supertest";
import { app } from "@/app"; // ваше приложение Next.js
import { prisma } from "@/lib/db";

describe("Tracks API", () => {
  beforeEach(async () => {
    // Очистка тестовой базы данных перед каждым тестом
    await prisma.track.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe("GET /api/tracks", () => {
    it("should return tracks", async () => {
      // Создание тестового пользователя
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          username: "testuser",
        },
      });

      // Создание тестового трека
      await prisma.track.create({
        data: {
          title: "Test Track",
          artistId: user.id,
          coverImage: "test-image.jpg",
          audioUrl: "test-audio.mp3",
        },
      });

      const response = await request(app).get("/api/tracks").expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty("title", "Test Track");
    });
  });

  describe("POST /api/tracks", () => {
    it("should create a new track", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          username: "testuser",
        },
      });

      const newTrack = {
        title: "New Track",
        artistId: user.id,
        coverImage: "new-image.jpg",
        audioUrl: "new-audio.mp3",
      };

      const response = await request(app)
        .post("/api/tracks")
        .send(newTrack)
        .expect(201);

      expect(response.body).toHaveProperty("title", "New Track");
      expect(response.body).toHaveProperty("artistId", user.id);
    });
  });
});
```

#### Тестирование Web3-интеграций

```typescript
// tests/integration/web3/nft.test.ts
import { NFTService } from "@/services/nft-service";
import { Connection, Keypair, Transaction } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// Мок Web3-библиотек
jest.mock("@solana/web3.js", () => ({
  ...jest.requireActual("@solana/web3.js"),
  Connection: jest.fn(),
}));

describe("NFT Service", () => {
  let mockConnection: jest.Mocked<Connection>;
  let nftService: NFTService;

  beforeEach(() => {
    mockConnection = new (Connection as any)("http://localhost:8899");
    nftService = new NFTService(mockConnection);
  });

  describe("mintNFT", () => {
    it("should mint a new NFT", async () => {
      // Моки для Solana операций
      const mockMint = Keypair.generate();
      const mockUser = Keypair.generate();

      // Мокаем функции SPL Token
      (createMint as jest.Mock).mockResolvedValue(mockMint.publicKey);
      (getOrCreateAssociatedTokenAccount as jest.Mock).mockResolvedValue({
        address: mockUser.publicKey,
      });
      (mintTo as jest.Mock).mockResolvedValue("transaction-signature");

      const result = await nftService.mintNFT({
        name: "Test NFT",
        symbol: "TNFT",
        uri: "https://example.com/nft.json",
        recipient: mockUser.publicKey.toString(),
      });

      expect(result).toHaveProperty("signature");
      expect(result).toHaveProperty("mintAddress");
    });
  });
});
```

### E2E-тесты

#### Тестирование пользовательского сценария покупки NFT

```typescript
// tests/e2e/nft-purchase.spec.ts
import { test, expect } from "@playwright/test";

test.describe("NFT Purchase Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should allow user to purchase an NFT", async ({ page }) => {
    // Поиск и клик по NFT
    await page.getByText("Digital Art Collection").click();

    // Выбор NFT
    await page.locator(".nft-card").first().click();

    // Проверка деталей NFT
    await expect(page.locator("h1")).toContainText("Digital Art #1");
    await expect(page.locator(".price")).toContainText("0.5 SOL");

    // Клик по кнопке покупки
    await page.getByRole("button", { name: "Купить за 0.5 SOL" }).click();

    // Проверка открытия модального окна
    await expect(page.locator(".payment-modal")).toBeVisible();

    // Выбор метода оплаты
    await page.getByText("Solana Pay").click();

    // Подтверждение покупки
    await page.getByRole("button", { name: "Подтвердить покупку" }).click();

    // Проверка успешного завершения
    await expect(page.locator(".success-message")).toBeVisible();
  });
});

test.describe("Web3 Wallet Integration", () => {
  test("should connect to wallet and show balance", async ({ page }) => {
    await page.goto("/profile");

    // Клик по кнопке подключения кошелька
    await page.getByRole("button", { name: "Подключить кошелек" }).click();

    // Выбор кошелька Phantom (в реальном тесте будет mock)
    await page.getByText("Phantom").click();

    // Проверка подключения
    await expect(page.locator(".wallet-connected")).toBeVisible();
    await expect(page.locator(".balance")).toContainText("SOL");
  });
});
```

#### Тестирование аутентификации

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should allow user to sign in with email", async ({ page }) => {
    await page.goto("/auth/signin");

    // Ввод данных
    await page.locator('input[name="email"]').fill("test@example.com");
    await page.locator('input[name="password"]').fill("password123");

    // Клик по кнопке входа
    await page.getByRole("button", { name: "Войти" }).click();

    // Проверка перенаправления на главную страницу
    await expect(page).toHaveURL("/");
    await expect(page.locator(".user-menu")).toBeVisible();
  });

  test("should allow user to sign up", async ({ page }) => {
    await page.goto("/auth/signup");

    // Заполнение формы регистрации
    await page.locator('input[name="email"]').fill("newuser@example.com");
    await page.locator('input[name="username"]').fill("newuser");
    await page.locator('input[name="password"]').fill("password123");

    // Клик по кнопке регистрации
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    // Проверка успешной регистрации
    await expect(page.locator(".success-message")).toBeVisible();
    await expect(page).toHaveURL("/profile");
  });
});
```

### Тестирование безопасности

#### Тестирование защиты от CSRF

```typescript
// tests/security/csrf.test.ts
import request from "supertest";
import { app } from "@/app";

describe("CSRF Protection", () => {
  it("should reject requests without proper CSRF token", async () => {
    const response = await request(app)
      .post("/api/user/profile")
      .send({ username: "hacker" })
      .expect(403);

    expect(response.body).toHaveProperty(
      "error",
      "CSRF token missing or invalid"
    );
  });

  it("should accept requests with proper CSRF token", async () => {
    // Получение CSRF токена
    const csrfResponse = await request(app).get("/api/csrf-token").expect(200);

    const csrfToken = csrfResponse.body.csrfToken;

    const response = await request(app)
      .post("/api/user/profile")
      .set("X-CSRF-Token", csrfToken)
      .send({ username: "legitimate-user" })
      .expect(20);

    expect(response.body).toHaveProperty("success", true);
  });
});
```

#### Тестирование защиты от XSS

```typescript
// tests/security/xss.test.ts
import request from "supertest";
import { app } from "@/app";

describe("XSS Protection", () => {
  it("should sanitize user input to prevent XSS", async () => {
    const maliciousPayload = '<script>alert("XSS")</script>';

    const response = await request(app)
      .post("/api/comments")
      .send({
        trackId: "test-track",
        content: maliciousPayload,
      })
      .expect(201);

    // Проверка, что возвращаемые данные не содержат скриптов
    expect(response.body.content).not.toContain("<script>");
    expect(response.body.content).toBe('<script>alert("XSS")</script>');
  });
});
```

### CI/CD интеграция

#### GitHub Actions для автоматического тестирования

```yaml
# .github/workflows/test.yml
name: 🧪 Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm run test:unit
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Setup database
        run: |
          npm run db:migrate
          npm run db:seed:test
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Риски и меры по их снижению

### Риск 1: Долгое время выполнения тестов

- **Мера**: Параллельное выполнение тестов
- **Мера**: Оптимизация медленных тестов

### Риск 2: Ложные срабатывания тестов

- **Мера**: Правильная изоляция тестов
- **Мера**: Использование стабильных селекторов

### Риск 3: Сложность поддержки тестов

- **Мера**: Четкая документация тестов
- **Мера**: Использование паттернов Page Object

## Критерии успеха

- Покрытие основного функционала тестами
- Успешное выполнение всех тестов в CI
- Уменьшение количества багов в продакшене
- Быстрое выявление проблем
- Автоматизированное тестирование

## Ресурсы

- 2-3 разработчика на 10 недель
- QA-инженер для настройки тестовой инфраструктуры
- DevOps-инженер для CI/CD интеграции

## Сроки

- Начало: 15 июня 2025
- Завершение: 25 августа 2025
- Общее время: 10 недель

# 🧪 План улучшения покрытия тестами NORMAL DANCE

## 🎯 Цель

Повысить качество и полноту тестового покрытия проекта NORMAL DANCE для обеспечения стабильности, надежности и предотвращения регрессий.

## 📋 Текущее состояние

### Покрытие тестами

- Юнит-тесты: ~60% (базовое покрытие, минимальные тесты)
- Интеграционные тесты: ~40% (частичное покрытие основных сценариев)
- E2E тесты: ~10% (только базовые сценарии)
- Нагрузочные тесты: ~5% (отсутствуют)
- Безопасностные тесты: ~30% (частичное покрытие)

### Проблемы

1. Многие тесты являются "заглушками" без реальной проверки логики
2. Отсутствуют тесты для критических пользовательских сценариев
3. Недостаточное покрытие ошибок и граничных условий
4. Отсутствуют нагрузочные тесты для проверки производительности
5. Недостаточное покрытие безопасности

## 📈 План улучшения

### 1. Юнит-тестирование

#### Проблема

Существующие юнит-тесты проверяют только наличие функций, но не их логику.

#### Решение

Создать полноценные юнит-тесты с моками зависимостей и проверкой логики.

#### Пример улучшения для `ipfs-helia-adapter.test.ts`:

```typescript
// Улучшенные тесты для IPFS Helia адаптера
import { afterEach, beforeEach, describe, expect, it, vi } from "@jest/globals";

// Мокаем Helia и его зависимости
const mockAddBytes = vi.fn();
const mockCat = vi.fn();
const mockPinsAdd = vi.fn();
const mockPinsRm = vi.fn();

vi.mock("helia", () => ({
  createHelia: vi.fn().mockResolvedValue({
    pins: {
      add: mockPinsAdd,
      rm: mockPinsRm,
    },
  }),
}));

vi.mock("@helia/unixfs", () => ({
  unixfs: vi.fn().mockReturnValue({
    addBytes: mockAddBytes,
    cat: mockCat,
  }),
}));

// Импортируем функции для тестирования
import {
  uploadToIPFSHelia,
  getFileFromIPFSHelia,
  pinFileHelia,
  unpinFileHelia,
} from "../../src/lib/ipfs-helia-adapter";

describe("IPFS Helia Adapter Tests", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("uploadToIPFSHelia", () => {
    it("should upload file to IPFS successfully", async () => {
      // Given
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });
      const mockCid = { toString: () => "QmTest123" };
      mockAddBytes.mockResolvedValue(mockCid);

      // When
      const result = await uploadToIPFSHelia(mockFile);

      // Then
      expect(result).toEqual({
        cid: "QmTest123",
        size: 12, // размер "test content"
      });
      expect(mockAddBytes).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it("should reject files larger than 100MB", async () => {
      // Given
      // Создаем большой файл (101MB)
      const largeFile = new File(
        [new ArrayBuffer(101 * 1024 * 1024)],
        "large.txt"
      );

      // When/Then
      await expect(uploadToIPFSHelia(largeFile)).rejects.toThrow("File size");
    });

    it("should handle upload errors gracefully", async () => {
      // Given
      const mockFile = new File(["test content"], "test.txt");
      mockAddBytes.mockRejectedValue(new Error("Network error"));

      // When/Then
      await expect(uploadToIPFSHelia(mockFile)).rejects.toThrow(
        "Failed to upload"
      );
    });
  });

  describe("getFileFromIPFSHelia", () => {
    it("should retrieve file from IPFS successfully", async () => {
      // Given
      const mockCid = "QmTest123";
      const mockData = new TextEncoder().encode("test content");
      mockCat.mockReturnValue([mockData]);

      // When
      const result = await getFileFromIPFSHelia(mockCid);

      // Then
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe("test content");
      expect(mockCat).toHaveBeenCalledWith(mockCid);
    });

    it("should validate CID format", async () => {
      // Given
      const invalidCid = "";

      // When/Then
      await expect(getFileFromIPFSHelia(invalidCid)).rejects.toThrow(
        "Invalid CID"
      );
    });
  });

  describe("pinFileHelia", () => {
    it("should pin file successfully", async () => {
      // Given
      const mockCid = "QmTest123";
      mockPinsAdd.mockResolvedValue(undefined);

      // When
      const result = await pinFileHelia(mockCid);

      // Then
      expect(result).toBe(true);
      expect(mockPinsAdd).toHaveBeenCalledWith(mockCid);
    });

    it("should handle pinning errors", async () => {
      // Given
      const mockCid = "QmTest123";
      mockPinsAdd.mockRejectedValue(new Error("Pin failed"));

      // When
      const result = await pinFileHelia(mockCid);

      // Then
      expect(result).toBe(false);
    });
  });

  describe("unpinFileHelia", () => {
    it("should unpin file successfully", async () => {
      // Given
      const mockCid = "QmTest123";
      mockPinsRm.mockResolvedValue(undefined);

      // When
      const result = await unpinFileHelia(mockCid);

      // Then
      expect(result).toBe(true);
      expect(mockPinsRm).toHaveBeenCalledWith(mockCid);
    });
  });
});
```

### 2. Интеграционные тесты

#### Проблема

Интеграционные тесты охватывают только некоторые сценарии.

#### Решение

Расширить интеграционные тесты для покрытия всех критических пользовательских сценариев.

#### Пример новых интеграционных тестов:

```typescript
// tests/integration/user-workflow.test.ts
import { describe, it, expect } from "@jest/globals";

describe("User Workflow Integration Tests", () => {
  describe("Complete Artist Journey", () => {
    it("should handle artist registration, track upload, and monetization", async () => {
      // 1. Регистрация артиста
      const artistData = {
        email: "artist@test.com",
        username: "test-artist",
        password: "SecurePass123!",
        displayName: "Test Artist",
        bio: "Electronic music producer",
      };

      const registrationResult = await api.auth.register(artistData);
      expect(registrationResult.status).toBe(201);
      expect(registrationResult.data.user.isArtist).toBe(true);

      // 2. Подключение кошелька
      const walletConnection = await api.wallet.connect("phantom");
      expect(walletConnection.status).toBe(200);
      expect(walletConnection.data.connected).toBe(true);

      // 3. Загрузка трека
      const trackData = {
        title: "My First Track",
        genre: "Electronic",
        price: 9.99,
        file: createMockAudioFile(),
        cover: createMockImageFile(),
      };

      const uploadResult = await api.tracks.upload(trackData);
      expect(uploadResult.status).toBe(200);
      expect(uploadResult.data.trackId).toBeDefined();

      // 4. Публикация трека
      const publishResult = await api.tracks.publish(uploadResult.data.trackId);
      expect(publishResult.status).toBe(200);
      expect(publishResult.data.published).toBe(true);

      // 5. Создание NFT для трека
      const nftResult = await api.nft.create(uploadResult.data.trackId);
      expect(nftResult.status).toBe(200);
      expect(nftResult.data.nftId).toBeDefined();
    });
  });

  describe("User Purchase Journey", () => {
    it("should handle user purchase, playback, and royalty distribution", async () => {
      // 1. Пользователь заходит в систему
      const loginResult = await api.auth.login({
        email: "user@test.com",
        password: "UserPass123!",
      });
      expect(loginResult.status).toBe(200);

      // 2. Поиск и покупка трека
      const searchResult = await api.search.tracks({ q: "My First Track" });
      const trackId = searchResult.data.tracks[0].id;

      const purchaseResult = await api.purchases.buy(trackId, {
        paymentMethod: "solana",
        wallet: "user-wallet-address",
      });
      expect(purchaseResult.status).toBe(200);
      expect(purchaseResult.data.transactionId).toBeDefined();

      // 3. Воспроизведение купленного трека
      const playbackResult = await api.playback.start(trackId);
      expect(playbackResult.status).toBe(200);
      expect(playbackResult.data.playing).toBe(true);

      // 4. Проверка распределения роялти
      const royaltyResult = await api.royalties.check(trackId);
      expect(royaltyResult.data.distributed).toBe(true);
      expect(royaltyResult.data.artistShare).toBeGreaterThan(0);
    });
  });
});
```

### 3. E2E тесты

#### Проблема

E2E тесты охватывают только базовые сценарии.

#### Решение

Создать комплексные E2E тесты для всех ключевых пользовательских сценариев.

#### Пример новых E2E тестов:

```typescript
// tests/e2e/full-user-journey.test.ts
import { test, expect } from "@playwright/test";

test.describe("Full User Journey", () => {
  test("should complete artist registration and track upload flow", async ({
    page,
  }) => {
    // 1. Переход на главную страницу
    await page.goto("/");
    await expect(
      page.getByText("Добро пожаловать в NORMAL DANCE")
    ).toBeVisible();

    // 2. Переход к регистрации
    await page.getByRole("button", { name: "Стать артистом" }).click();
    await expect(page).toHaveURL(/.*\/auth\/signup/);

    // 3. Заполнение формы регистрации
    await page.getByLabel("Email").fill("artist@test.com");
    await page.getByLabel("Имя пользователя").fill("test-artist");
    await page.getByLabel("Пароль").fill("SecurePass123!");
    await page.getByLabel("Подтвердите пароль").fill("SecurePass123!");
    await page.getByRole("button", { name: "Зарегистрироваться" }).click();

    // 4. Подтверждение email (мок)
    await page.waitForURL(/.*\/verify-email/);
    await page.getByRole("button", { name: "Подтвердить email" }).click();

    // 5. Заполнение профиля
    await page.waitForURL(/.*\/profile\/setup/);
    await page.getByLabel("Отображаемое имя").fill("Test Artist");
    await page.getByLabel("О себе").fill("Electronic music producer");
    await page.getByRole("button", { name: "Сохранить" }).click();

    // 6. Переход к загрузке трека
    await page.waitForURL(/.*\/dashboard/);
    await page.getByRole("link", { name: "Загрузить трек" }).click();

    // 7. Загрузка трека
    await page.waitForURL(/.*\/upload/);
    await page.getByLabel("Название трека").fill("My First Track");
    await page.getByLabel("Жанр").selectOption("Electronic");
    await page.getByLabel("Цена (NDT)").fill("9.99");

    // Загрузка файлов (мок)
    const audioFileChooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Выбрать аудио" }).click();
    const audioFile = await audioFileChooser;
    await audioFile.setFiles("tests/fixtures/test-track.mp3");

    const imageFileChooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Выбрать обложку" }).click();
    const imageFile = await imageFileChooser;
    await imageFile.setFiles("tests/fixtures/test-cover.jpg");

    await page.getByRole("button", { name: "Загрузить" }).click();

    // 8. Подтверждение загрузки
    await page.waitForURL(/.*\/tracks\/.*/);
    await expect(page.getByText("Трек успешно загружен")).toBeVisible();
  });

  test("should complete user purchase and playback flow", async ({ page }) => {
    // 1. Вход в систему
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill("user@test.com");
    await page.getByLabel("Пароль").fill("UserPass123!");
    await page.getByRole("button", { name: "Войти" }).click();

    // 2. Поиск трека
    await page.waitForURL("/");
    await page
      .getByPlaceholder("Поиск треков, артистов, альбомов...")
      .fill("My First Track");
    await page.keyboard.press("Enter");

    // 3. Переход к треку
    await page.getByText("My First Track").first().click();

    // 4. Покупка трека
    await page.getByRole("button", { name: "Купить за 9.99 NDT" }).click();
    await page.getByRole("button", { name: "Подтвердить покупку" }).click();

    // 5. Подключение кошелька (мок)
    await page.getByRole("button", { name: "Подключить Phantom" }).click();
    await page.getByRole("button", { name: "Подтвердить транзакцию" }).click();

    // 6. Воспроизведение трека
    await page.getByRole("button", { name: "▶️ Воспроизвести" }).click();
    await expect(page.getByText("Сейчас играет")).toBeVisible();
  });
});
```

### 4. Нагрузочные тесты

#### Проблема

Отсутствуют нагрузочные тесты.

#### Решение

Создать нагрузочные тесты с использованием Artillery или k6.

#### Пример нагрузочного теста:

```javascript
// tests/performance/api-load-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 20
      name: "Ramp up load"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  defaults:
    headers:
      content-type: "application/json"

scenarios:
  - name: "User Authentication Flow"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "authToken"
      - get:
          url: "/api/users/me"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Track Search and Playback"
    flow:
      - get:
          url: "/api/tracks?limit=20&page=1"
      - get:
          url: "/api/tracks/12345"
      - post:
          url: "/api/tracks/12345/play"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Playlist Operations"
    flow:
      - post:
          url: "/api/playlists"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "Test Playlist"
            isPublic: true
      - put:
          url: "/api/playlists/67890/tracks"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            trackIds: ["12345", "67890", "11111"]
```

### 5. Безопасностные тесты

#### Проблема

Ограниченное покрытие безопасности.

#### Решение

Расширить безопасностные тесты для проверки уязвимостей.

#### Пример безопасностных тестов:

```typescript
// tests/security/auth-security.test.ts
import { describe, it, expect } from "@jest/globals";

describe("Authentication Security Tests", () => {
  describe("Rate Limiting", () => {
    it("should block excessive login attempts", async () => {
      const credentials = {
        email: "test@example.com",
        password: "wrongpassword",
      };

      // Попытка входа 10 раз подряд
      for (let i = 0; i < 10; i++) {
        await api.auth.login(credentials);
      }

      // 11-я попытка должна быть заблокирована
      const result = await api.auth.login(credentials);
      expect(result.status).toBe(429); // Too Many Requests
      expect(result.error).toContain("rate limit");
    });
  });

  describe("Input Validation", () => {
    it("should reject malicious input", async () => {
      const maliciousInputs = [
        { email: "test@<script>alert(1)</script>.com", password: "password" },
        { email: "test@example.com", password: "a".repeat(1000) },
        { email: "", password: "" },
      ];

      for (const input of maliciousInputs) {
        const result = await api.auth.login(input);
        expect(result.status).toBe(400); // Bad Request
      }
    });
  });

  describe("JWT Security", () => {
    it("should reject expired tokens", async () => {
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const result = await api.users.getProfile("123", expiredToken);
      expect(result.status).toBe(401); // Unauthorized
    });

    it("should reject tampered tokens", async () => {
      const tamperedToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const result = await api.users.getProfile("123", tamperedToken);
      expect(result.status).toBe(401); // Unauthorized
    });
  });
});
```

## 📅 План реализации

### Неделя 1

- [ ] Улучшить существующие юнит-тесты (10 модулей)
- [ ] Создать шаблоны для новых тестов
- [ ] Настроить CI для автоматического запуска тестов

### Неделя 2

- [ ] Добавить интеграционные тесты для критических сценариев (5 сценариев)
- [ ] Создать E2E тесты для основных пользовательских потоков (3 потока)
- [ ] Настроить отчеты о покрытии тестами

### Неделя 3

- [ ] Добавить нагрузочные тесты для API endpoints
- [ ] Создать безопасностные тесты для критических функций
- [ ] Интегрировать тесты в CI/CD pipeline

### Неделя 4

- [ ] Провести аудит покрытия тестами
- [ ] Добавить недостающие тесты на основе результатов аудита
- [ ] Создать документацию по тестированию

## 📊 Метрики успеха

- Увеличение общего покрытия тестами с 40% до 85%
- Снижение количества багов в продакшене на 60%
- Уменьшение времени на проверку PR на 40%
- Повышение оценки качества кода в опросах команды с 6 до 9 баллов

## 🛠️ Инструменты

- Jest для юнит и интеграционных тестов
- Playwright для E2E тестов
- Artillery/k6 для нагрузочного тестирования
- OWASP ZAP для безопасностного тестирования
- Istanbul/nyc для измерения покрытия кода

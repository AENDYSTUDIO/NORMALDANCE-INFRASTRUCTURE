# 🔒 Тестирование безопасности NORMAL DANCE

Этот документ описывает комплексный план тестирования безопасности платформы NormalDance для выявления и устранения уязвимостей перед запуском в продакшн.

## 🎯 Цели тестирования безопасности

### Основные цели

- **Выявление уязвимостей**: Обнаружение слабых мест в системе безопасности

- **Проверка соответствия**: Соответствие стандартам безопасности (OWASP, PCI DSS, GDPR)

- **Защита данных**: Обеспечение защиты пользовательских данных и финансовых транзакций

- **Web3 безопасность**: Проверка безопасности блокчейн-интеграции

- **Инсайдерская угроза**: Защита от внутренних угроз и злоупотреблений

### Ключевые области тестирования

- **Аутентификация и авторизация**
- **Веб-приложение (OWASP Top 10)**
- **API безопасность**
- **База данных**
- **Web3 и криптография**
- **Мобильное приложение**
- **Инфраструктура**
- **Бизнес-логика**

## 🛡️ OWASP Top 10 тестирование

### 1. A01:2021 - Broken Access Control

#### Тестовые сценарии

```javascript
// Тестирование вертикального эскалации привилегий
describe("Vertical Privilege Escalation", () => {
  test("should not allow user to access admin endpoints", async () => {
    // Given
    const userToken = await getUserToken("regular@example.com", "password");

    // When
    const response = await api.get("/api/admin/users", {
      headers: { Authorization: `Bearer ${userToken}` },
    });

    // Then
    expect(response.status).toBe(403);
  });

  test("should not allow user to access other user data", async () => {
    // Given
    const user1Token = await getUserToken("user1@example.com", "password");
    const user2Id = "user2-uuid";

    // When
    const response = await api.get(`/api/users/${user2Id}/profile`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    // Then
    expect(response.status).toBe(403);
  });
});
```

#### Тестирование горизонтального эскалации

```javascript
describe("Horizontal Privilege Escalation", () => {
  test("should not allow user to modify other user playlists", async () => {
    // Given
    const user1Token = await getUserToken("user1@example.com", "password");
    const user2PlaylistId = "playlist-user2-uuid";

    // When
    const response = await api.put(
      `/api/playlists/${user2PlaylistId}`,
      {
        name: "Hacked Playlist",
      },
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );

    // Then
    expect(response.status).toBe(403);
  });
});
```

### 2. A02:2021 - Cryptographic Failures

#### Тестирование шифрования данных

```javascript
describe("Data Encryption", () => {
  test("should encrypt sensitive data at rest", async () => {
    // Given
    const sensitiveData = {
      creditCard: "4111111111111111",
      cvv: "123",
      expiry: "12/25",
    };

    // When
    const response = await api.post("/api/payment-methods", sensitiveData);

    // Then
    const storedData = await database.paymentMethods.findFirst({
      where: { userId: response.data.userId },
    });

    // Проверяем, что данные зашифрованы
    expect(storedData.cardNumber).not.toBe(sensitiveData.creditCard);
    expect(storedData.data).toMatch(/^\$2[ay]\$.{56}$/); // bcrypt hash
  });

  test("should use HTTPS for all communications", async () => {
    // Given
    const endpoints = [
      "/api/auth/login",
      "/api/payment",
      "/api/wallet/transfer",
    ];

    // When & Then
    for (const endpoint of endpoints) {
      const response = await fetch(`https://normaldance.com${endpoint}`, {
        redirect: "manual",
      });

      expect(response.status).not.toBe(307); // Не перенаправлять на HTTP
      expect(response.headers.get("strict-transport-security")).toBeDefined();
    }
  });
});
```

### 3. A03:2021 - Injection

#### SQL Injection тестирование

```javascript
describe("SQL Injection", () => {
  test("should prevent SQL injection in search", async () => {
    // Given
    const maliciousPayload = "'; DROP TABLE users; --";

    // When
    const response = await api.get(
      `/api/search?q=${encodeURIComponent(maliciousPayload)}`
    );

    // Then
    expect(response.status).toBe(200);
    // Проверяем, что база данных не повреждена
    const userCount = await database.users.count();
    expect(userCount).toBeGreaterThan(0);
  });

  test("should prevent NoSQL injection", async () => {
    // Given
    const maliciousPayload = { $where: "function() { return true; }" };

    // When
    const response = await api.post("/api/users/filter", maliciousPayload);

    // Then
    expect(response.status).toBe(400);
    expect(response.error).toContain("invalid query");
  });
});
```

#### XSS тестирование

```javascript
describe("Cross-Site Scripting (XSS)", () => {
  test("should sanitize user input in comments", async () => {
    // Given
    const xssPayload =
      '<script>alert("XSS")</script><img src=x onerror=alert("XSS2")>';

    // When
    const response = await api.post("/api/comments", {
      content: xssPayload,
      trackId: "track123",
    });

    // Then
    expect(response.status).toBe(201);
    const savedComment = await database.comments.findFirst({
      where: { id: response.data.id },
    });

    // Проверяем, что скрипты удалены
    expect(savedComment.content).not.toContain("<script>");
    expect(savedComment.content).not.toContain("onerror=");
  });

  test("should set security headers", async () => {
    // Given
    const page = await browser.newPage();

    // When
    await page.goto("https://normaldance.com");

    // Then
    const headers = await page.evaluate(() => {
      return {
        "x-content-type-options": document.contentType,
        "x-frame-options": document.querySelector(
          'meta[http-equiv="X-Frame-Options"]'
        )?.content,
        "x-xss-protection": document.querySelector(
          'meta[http-equiv="X-XSS-Protection"]'
        )?.content,
      };
    });

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBeDefined();
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
  });
});
```

### 4. A04:2021 - Insecure Design

#### Тестирование бизнес-логики

```javascript
describe("Insecure Business Logic", () => {
  test("should prevent race condition in token transfer", async () => {
    // Given
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    const transferAmount = 1000;

    // Simulate concurrent transfers
    const transferPromises = [
      api.wallet.transfer({
        from: user1.walletAddress,
        to: user2.walletAddress,
        amount: transferAmount,
        token: "ndt",
      }),
      api.wallet.transfer({
        from: user1.walletAddress,
        to: user2.walletAddress,
        amount: transferAmount,
        token: "ndt",
      }),
    ];

    // When
    const results = await Promise.all(transferPromises);

    // Then
    const successfulTransfers = results.filter((r) => r.status === 200);
    expect(successfulTransfers.length).toBeLessThanOrEqual(1);

    // Check final balance
    const finalBalance = await api.wallet.getBalance(user1.walletAddress);
    expect(finalBalance.ndt).toBeGreaterThanOrEqual(0);
  });

  test("should validate transaction amounts", async () => {
    // Given
    const user = await createTestUser();
    const balance = await api.wallet.getBalance(user.walletAddress);

    // When
    const response = await api.wallet.transfer({
      from: user.walletAddress,
      to: "target-wallet",
      amount: balance.ndt + 100, // Больше баланса
      token: "ndt",
    });

    // Then
    expect(response.status).toBe(400);
    expect(response.error).toContain("insufficient balance");
  });
});
```

### 5. A05:2021 - Security Misconfiguration

#### Тестирование конфигурации

```javascript
describe("Security Misconfiguration", () => {
  test("should not expose sensitive information in error messages", async () => {
    // Given
    const invalidEndpoint = "/api/nonexistent-endpoint";

    // When
    const response = await api.get(invalidEndpoint);

    // Then
    expect(response.status).toBe(404);
    expect(response.error).not.toContain("password");
    expect(response.error).not.toContain("database");
    expect(response.error).not.toContain("stack");
  });

  test("should have proper CORS configuration", async () => {
    // Given
    const allowedOrigins = [
      "https://normaldance.com",
      "https://app.normaldance.com",
    ];

    // When
    const responses = await Promise.all(
      allowedOrigins.map((origin) =>
        fetch(`https://api.normaldance.com/health`, {
          headers: { Origin: origin },
        })
      )
    );

    // Then
    responses.forEach((response, index) => {
      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe(
        allowedOrigins[index]
      );
    });
  });
});
```

### 6. A06:2021 - Vulnerable and Outdated Components

#### Тестирование зависимостей

```javascript
describe("Vulnerable Dependencies", () => {
  test("should not have known vulnerabilities in dependencies", async () => {
    // Given
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));

    // When
    const vulnerabilities = await checkDependencies(packageJson.dependencies);

    // Then
    expect(vulnerabilities.length).toBe(0);
  });

  test("should keep dependencies updated", async () => {
    // Given
    const outdatedPackages = await getOutdatedPackages();

    // Then
    expect(outdatedPackages.length).toBe(0);
  });
});
```

### 7. A07:2021 - Identification and Authentication Failures

#### Тестирование аутентификации

```javascript
describe("Authentication Failures", () => {
  test("should implement rate limiting on login", async () => {
    // Given
    const credentials = { email: "test@example.com", password: "wrongpass" };

    // When
    const failedAttempts = [];
    for (let i = 0; i < 6; i++) {
      const response = await api.auth.login(credentials);
      failedAttempts.push(response.status);
    }

    // Then
    // Первые 5 попыток должны быть 401, 6-я должна быть 429
    expect(failedAttempts.slice(0, 5)).every((status) => status === 401);
    expect(failedAttempts[5]).toBe(429);
  });

  test("should implement multi-factor authentication", async () => {
    // Given
    const user = await createTestUser({ requireMFA: true });

    // When
    const loginResponse = await api.auth.login({
      email: user.email,
      password: "password123",
    });

    // Then
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data.requiresMFA).toBe(true);

    // Verify MFA code
    const mfaResponse = await api.auth.verifyMFA({
      userId: user.id,
      code: "123456", // Тестовый код
    });

    expect(mfaResponse.status).toBe(200);
  });
});
```

### 8. A08:2021 - Software and Data Integrity Failures

#### Тестирование целостности данных

```javascript
describe("Data Integrity", () => {
  test("should ensure transaction atomicity", async () => {
    // Given
    const user = await createTestUser();
    const initialBalance = await api.wallet.getBalance(user.walletAddress);

    // When
    const transferResponse = await api.wallet.transfer({
      from: user.walletAddress,
      to: "target-wallet",
      amount: 100,
      token: "ndt",
    });

    // Then
    if (transferResponse.status === 200) {
      const finalBalance = await api.wallet.getBalance(user.walletAddress);
      expect(finalBalance.ndt).toBe(initialBalance.ndt - 100);
    }
  });

  test("should implement data validation", async () => {
    // Given
    const invalidUserData = {
      email: "invalid-email",
      username: "a", // Слишком короткий
      age: -1, // Отрицательный возраст
    };

    // When
    const response = await api.auth.signup(invalidUserData);

    // Then
    expect(response.status).toBe(400);
    expect(response.errors).toBeDefined();
  });
});
```

### 9. A09:2021 - Security Logging and Monitoring Failures

#### Тестирование логирования

```javascript
describe("Security Logging", () => {
  test("should log security events", async () => {
    // Given
    const userId = "test-user-id";

    // When
    const failedLogin = await api.auth.login({
      email: "nonexistent@example.com",
      password: "wrongpass",
    });

    const successfulLogin = await api.auth.login({
      email: "test@example.com",
      password: "password123",
    });

    // Then
    const securityLogs = await database.securityLogs.findMany({
      where: {
        OR: [{ action: "FAILED_LOGIN" }, { action: "SUCCESSFUL_LOGIN" }],
      },
      orderBy: { createdAt: "desc" },
    });

    expect(securityLogs.length).toBeGreaterThanOrEqual(2);
    expect(securityLogs[0].action).toBe("SUCCESSFUL_LOGIN");
    expect(securityLogs[1].action).toBe("FAILED_LOGIN");
  });

  test("should detect brute force attacks", async () => {
    // Given
    const targetUser = "target@example.com";

    // When
    const attackPromises = Array(10)
      .fill()
      .map(() =>
        api.auth.login({
          email: targetUser,
          password: "wrongpass",
        })
      );

    await Promise.all(attackPromises);

    // Then
    const securityAlert = await database.securityAlerts.findFirst({
      where: {
        type: "BRUTE_FORCE",
        targetUser: targetUser,
      },
    });

    expect(securityAlert).toBeDefined();
    expect(securityAlert.status).toBe("ACTIVE");
  });
});
```

### 10. A10:2021 - Server-Side Request Forgery (SSRF)

#### SSRF тестирование

```javascript
describe("SSRF Protection", () => {
  test("should prevent SSRF attacks", async () => {
    // Given
    const ssrfPayloads = [
      "http://localhost:8080/admin",
      "http://127.0.0.1:22",
      "http://169.254.169.254/latest/meta-data/",
    ];

    // When
    const responses = await Promise.all(
      ssrfPayloads.map((payload) => api.post("/api/proxy", { url: payload }))
    );

    // Then
    responses.forEach((response) => {
      expect(response.status).toBe(400);
      expect(response.error).toContain("invalid url");
    });
  });
});
```

## 🔐 Web3 безопасность

### Кошелек и транзакции

```javascript
describe("Web3 Security", () => {
  test("should validate wallet signatures", async () => {
    // Given
    const maliciousWallet = {
      address: "malicious-wallet-address",
      signature: "invalid-signature",
      message: "test-message",
    };

    // When
    const response = await api.wallet.connect(maliciousWallet);

    // Then
    expect(response.status).toBe(400);
    expect(response.error).toContain("invalid signature");
  });

  test("should prevent replay attacks", async () => {
    // Given
    const validTransaction = {
      from: "user-wallet",
      to: "recipient-wallet",
      amount: 100,
      nonce: 1,
      signature: "valid-signature",
    };

    // When
    const firstResponse = await api.wallet.transfer(validTransaction);
    const secondResponse = await api.wallet.transfer(validTransaction);

    // Then
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(400); // Nonce already used
    expect(secondResponse.error).toContain("nonce already used");
  });

  test("should validate smart contract interactions", async () => {
    // Given
    const maliciousContractCall = {
      contractAddress: "malicious-contract",
      data: "malicious-data",
      value: 0,
    };

    // When
    const response = await api.web3.contractCall(maliciousContractCall);

    // Then
    expect(response.status).toBe(400);
    expect(response.error).toContain("contract not allowed");
  });
});
```

## 📱 Мобильное приложение безопасность

### Хранение данных

```javascript
describe("Mobile App Security", () => {
  test("should encrypt sensitive data in storage", async () => {
    // Given
    const appData = {
      authToken: "sensitive-token",
      privateKey: "private-key-data",
      biometricEnabled: true,
    };

    // When
    // Симулируем сохранение в мобильном приложении
    const encryptedData = await mobileApp.encryptData(appData);

    // Then
    expect(encryptedData).not.toBe(appData);
    expect(encryptedData).toMatch(/^\$2[ay]\$.{56}$/); // Encrypted format

    // Проверяем расшифровку
    const decryptedData = await mobileApp.decryptData(encryptedData);
    expect(decryptedData).toEqual(appData);
  });

  test("should implement secure communication", async () => {
    // Given
    const app = await mobileApp.launch();

    // When
    await app.navigateTo("/settings/security");

    // Then
    const certificatePinningEnabled = await app.checkCertificatePinning();
    expect(certificatePinningEnabled).toBe(true);

    const pinningConfig = await app.getCertificatePinningConfig();
    expect(pinningConfig).toBeDefined();
    expect(pinningConfig.hostnames).toContain("api.normaldance.com");
  });
});
```

## 🛠️ Инструменты тестирования безопасности

### Автоматизированные сканеры

| Инструмент     | Тип сканирования | Особенности                             |
| -------------- | ---------------- | --------------------------------------- |
| **OWASP ZAP**  | DAST, SAST       | Автоматическое сканирование уязвимостей |
| **Burp Suite** | DAST             | Ручное тестирование и перехват трафика  |
| **SonarQube**  | SAST             | Статический анализ кода                 |
| **Snyk**       | SCA              | Сканирование зависимостей               |
| **Metasploit** | Пентест          | Тестирование на проникновение           |

### Конфигурация сканирования

```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run OWASP ZAP
        uses: zaproxy/action-full-scan@v0.10.0
        with:
          target: https://normaldance.com
          ruleset: owasp-asi

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run SonarQube scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

## 📊 Отчетность и исправление

### Формат отчета

```json
{
  "scanDate": "2024-01-01T00:00:00Z",
  "scanType": "comprehensive",
  "totalVulnerabilities": 15,
  "severity": {
    "critical": 2,
    "high": 5,
    "medium": 6,
    "low": 2
  },
  "categories": {
    "OWASP Top 10": 12,
    "Web3 Security": 2,
    "Mobile Security": 1
  },
  "vulnerabilities": [
    {
      "id": "CVE-2024-1234",
      "title": "SQL Injection in Search API",
      "severity": "high",
      "description": "The search API is vulnerable to SQL injection attacks",
      "affectedEndpoints": ["/api/search"],
      "remediation": "Use parameterized queries",
      "status": "open",
      "assignedTo": "security-team",
      "dueDate": "2024-01-15"
    }
  ]
}
```

### Процесс исправления

1. **Триаж уязвимостей**: Приоритизация по критичности
2. **Назначение ответственных**: Распределение задач команде
3. **Исправление**: Реализация патчей
4. **Проверка**: Валидация исправлений
5. **Повторное сканирование**: Подтверждение устранения

---

**Последнее обновление:** 2024-01-01
**Версия:** 1.0.0
**Ответственный:** Security Team

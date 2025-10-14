# План модернизации системы аутентификации

## Обзор

В этом документе описывается план модернизации системы аутентификации проекта NormalDance. Это улучшение имеет средний приоритет для Q2 2025 года, так как улучшает безопасность и обеспечивает поддержку Web3-идентичности.

## Текущая ситуация

### Существующая система аутентификации

- Используется NextAuth.js
- Ограниченная поддержка Web3-кошельков
- Базовая система сессий
- Отсутствие двухфакторной аутентификации

### Проблемы текущей реализации

- Ограниченная интеграция с Web3-кошельками
- Нет двухфакторной аутентификации
- Простая система сессий
- Нет безопасного восстановления доступа

## Цели реализации

### Основные цели

- Интеграция поддержки нескольких Web3-кошельков
- Реализация двухфакторной аутентификации
- Улучшение сессионного управления
- Добавление безопасного восстановления доступа

### Технические цели

- Поддержка Web3-идентичности
- Безопасная аутентификация
- Современные методы аутентификации
- Совместимость существующей системой

## План реализации

### Этап 1: Анализ и проектирование (Неделя 1-2)

- Анализ текущей системы аутентификации
- Проектирование новой архитектуры
- Подготовка схемы данных
- Создание тестовой среды

### Этап 2: Интеграция Web3-кошельков (Неделя 3-4)

- Интеграция с Phantom, Solflare, Backpack
- Реализация Web3-аутентификации
- Создание системы связывания кошельков
- Тестирование безопасности

### Этап 3: Двухфакторная аутентификация (Неделя 5-6)

- Реализация TFA с использованием TOTP
- Интеграция с Google Authenticator
- Создание резервных кодов
- Тестирование UX

### Этап 4: Улучшение сессий (Неделя 7)

- Улучшение системы сессий
- Реализация продления сессий
- Добавление мониторинга активности
- Тестирование безопасности

### Этап 5: Внедрение (Неделя 8)

- Постепенное внедрение изменений
- Мониторинг после внедрения
- Обновление документации
- Обучение пользователей

## Технические детали

### Интеграция Web3-кошельков

#### Настройка Web3-аутентификации

```typescript
// src/lib/web3-auth.ts
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { sign, verify } from 'jsonwebtoken';
import nacl from 'tweetnacl';

export interface Web3AuthChallenge {
  challenge: string;
  expiresAt: Date;
}

export interface Web3AuthPayload {
  publicKey: string;
  signature: string;
  message: string;
}

export class Web3Auth {
  static async generateChallenge(publicKey: string): Promise<Web3AuthChallenge> {
    const challenge = `NormalDance Auth: ${Date.now()}-${Math.random()}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 минут

    return {
      challenge,
      expiresAt
    };
  }

  static async verifySignature(payload: Web3AuthPayload): Promise<boolean> {
    try {
      const message = new TextEncoder().encode(payload.message);
      const signature = bs58.decode(payload.signature);
      const publicKey = new PublicKey(payload.publicKey);

      return nacl.sign.detached.verify(message, signature, publicKey.toBytes());
    } catch (error) {
      console.error('Web3 auth verification error:', error);
      return false;
    }

  static async createJWT(publicKey: string): Promise<string> {
    return sign(
      { publicKey, type: 'web3' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
  }
}
```

#### NextAuth.js провайдер для Web3

```typescript
// src/lib/auth/web3-provider.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Web3Auth } from "@/lib/web3-auth";

export const web3AuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Solana Wallet",
      credentials: {
        publicKey: { label: "Public Key", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" },
      },
      async authorize(credentials) {
        if (
          !credentials?.publicKey ||
          !credentials?.signature ||
          !credentials?.message
        ) {
          return null;
        }

        const isValid = await Web3Auth.verifySignature({
          publicKey: credentials.publicKey,
          signature: credentials.signature,
          message: credentials.message,
        });

        if (isValid) {
          // Создание или обновление пользователя
          const user = await upsertWeb3User(credentials.publicKey);
          return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.publicKey = user.publicKey;
        token.walletType = user.walletType;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.publicKey) {
        session.user.publicKey = token.publicKey as string;
        session.user.walletType = token.walletType as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
};

export default NextAuth(web3AuthOptions);
```

### Компонент подключения кошелька

```tsx
// src/components/WalletConnection.tsx
import { useWallet, WalletReadyState } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

const WalletConnection = () => {
  const { wallets, connect, connected, publicKey } = useWallet();
  const { data: session } = useSession();
  const [authChallenge, setAuthChallenge] = useState(null);

  const handleWeb3Auth = async () => {
    if (!publicKey) return;

    try {
      // Запросить вызов для аутентификации
      const response = await fetch("/api/auth/web3/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: publicKey.toBase58() }),
      });

      const { challenge } = await response.json();
      setAuthChallenge(challenge);

      // Подписать сообщение
      const message = new TextEncoder().encode(challenge);
      const signature = await signMessage(message);

      // Отправить подпись на сервер для аутентификации
      const authResponse = await signIn("credentials", {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message: challenge,
        redirect: false,
      });

      if (authResponse?.ok) {
        console.log("Web3 аутентификация успешна");
      }
    } catch (error) {
      console.error("Ошибка Web3 аутентификации:", error);
    }
  };

  return (
    <div className="wallet-connection">
      <WalletModalProvider>
        <WalletMultiButton />
      </WalletModalProvider>

      {connected && !session && (
        <button onClick={handleWeb3Auth}>Войти с кошельком</button>
      )}

      {session?.user?.publicKey && (
        <div className="user-info">
          <span>Подключен: {session.user.publicKey}</span>
          <button onClick={() => signOut()}>Выйти</button>
        </div>
      )}
    </div>
  );
};
```

### Двухфакторная аутентификация

#### Схема для TFA в Prisma

```prisma
// schema.prisma
model User {
  id             String    @id @default(cuid())
  telegramId     String?   @unique
  solanaAddress  String?   @unique
  email          String?   @unique
  username       String?
  avatar         String?
  bio            String?
  // Поля для двухфакторной аутентификации
  twoFactorEnabled Boolean @default(false)
  twoFactorSecret String?
  backupCodes    String[] @default([]) // Хранение хэшей резервных кодов
  createdAt      DateTime  @default(now())
  updatedAt      DateTime @updatedAt

  @@index([telegramId])
  @@index([solanaAddress])
  @@index([email])
}

// Модель для сессий (если используем кастомные сессии)
model UserSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  lastAccessed DateTime @updatedAt

  @@index([userId])
  @@index([expiresAt])
}
```

#### Реализация TFA сервиса

```typescript
// src/lib/tfa.ts
import { authenticator } from "otplib";
import { toDataURL } from "qrcode";
import crypto from "crypto";

export class TFAService {
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  static async generateQRCode(email: string, secret: string): Promise<string> {
    const otpauth = authenticator.keyuri(
      email,
      process.env.TFA_APP_NAME!,
      secret
    );
    return await toDataURL(otpauth);
  }

  static verifyToken(secret: string, token: string): boolean {
    return authenticator.check(token, secret);
  }

  static generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Генерация 16-символьного кода
      const code = crypto.randomBytes(8).toString("hex");
      codes.push(code);
    }
    return codes;
  }

  static hashBackupCode(code: string): string {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  static verifyBackupCode(inputCode: string, hashedCodes: string[]): boolean {
    const inputHash = crypto
      .createHash("sha256")
      .update(inputCode)
      .digest("hex");
    return hashedCodes.includes(inputHash);
  }
}
```

#### API-эндпоинты для TFA

```typescript
// src/app/api/auth/tfa/setup/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TFAService } from "@/lib/tfa";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Генерация секрета для TFA
    const secret = TFAService.generateSecret();

    // Генерация QR-кода
    const qrCode = await TFAService.generateQRCode(session.user.email!, secret);

    // Сохранение секрета в базу данных
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorSecret: secret,
      },
    });

    return new Response(JSON.stringify({ qrCode, secret }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TFA setup error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// src/app/api/auth/tfa/enable/route.ts
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TFAService } from "@/lib/tfa";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { token } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.twoFactorSecret) {
      return new Response(JSON.stringify({ error: "TFA not setup" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Проверка токена
    const isValid = TFAService.verifyToken(user.twoFactorSecret, token);

    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Генерация резервных кодов
    const backupCodes = TFAService.generateBackupCodes();
    const hashedCodes = backupCodes.map((code) =>
      TFAService.hashBackupCode(code)
    );

    // Включение TFA и сохранение резервных кодов
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashedCodes,
      },
    });

    return new Response(JSON.stringify({ backupCodes }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("TFA enable error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
```

### Улучшение сессионного управления

#### Кастомная система сессий

```typescript
// src/lib/session.ts
import { jwtVerify, SignJWT } from "jose";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";

export interface SessionData {
  userId: string;
  publicKey?: string;
  expiresAt: Date;
  lastAccessed: Date;
}

export class SessionManager {
  static async createSession(
    userId: string,
    publicKey?: string
  ): Promise<string> {
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 1000); // 7 дней

    // Создание сессии в базе данных
    await prisma.userSession.create({
      data: {
        id: sessionId,
        userId,
        token: sessionId, // В реальном приложении использовать более безопасный токен
        expiresAt,
      },
    });

    // Создание JWT токена
    const token = await new SignJWT({ userId, publicKey })
      .setProtectedHeader({ alg: "HS256" })
      .setJti(sessionId)
      .setExpirationTime(expiresAt)
      .setIssuedAt()
      .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

    return token;
  }

  static async validateSession(token: string): Promise<SessionData | null> {
    try {
      const verified = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );

      const sessionId = verified.payload.jti;

      // Проверка сессии в базе данных
      const session = await prisma.userSession.findUnique({
        where: { token: sessionId as string },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      // Обновление времени последнего доступа
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastAccessed: new Date() },
      });

      return {
        userId: session.userId,
        expiresAt: session.expiresAt,
        lastAccessed: session.lastAccessed,
      };
    } catch (error) {
      console.error("Session validation error:", error);
      return null;
    }
  }

  static async destroySession(token: string): Promise<boolean> {
    try {
      const verified = await jwtVerify(
        token,
        new TextEncoder().encode(process.env.JWT_SECRET!)
      );

      const sessionId = verified.payload.jti;

      await prisma.userSession.delete({
        where: { token: sessionId as string },
      });

      return true;
    } catch (error) {
      console.error("Session destruction error:", error);
      return false;
    }
  }
}
```

## Риски и меры по их снижению

### Риск 1: Проблемы совместимости с существующей системой

- **Мера**: Постепенная миграция с поддержкой старой системы
- **Мера**: Тщательное тестирование интеграции

### Риск 2: Проблемы безопасности

- **Мера**: Аудит безопасности новой системы
- **Мера**: Тестирование уязвимостей аутентификации

### Риск 3: Низкое принятие пользователями

- **Мера**: Понятный UX для настройки TFA
- **Мера**: Обучающие материалы для пользователей

## Критерии успеха

- Успешная интеграция Web3-кошельков
- Реализация безопасной TFA
- Улучшенная система сессий
- Совместимость с существующей системой
- Удовлетворенность пользователей

## Ресурсы

- 2-3 разработчика на 8 недель
- Специалист по безопасности
- QA-инженер для тестирования

## Сроки

- Начало: 15 апреля 2025
- Завершение: 13 июня 2025
- Общее время: 8 недель

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions, Session } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import SpotifyProvider from "next-auth/providers/spotify";
import { SiweMessage } from "sime";
import { db } from "./db";
import { getNextAuthConfig } from "./nextauth-config";
import { logger } from "./utils/logger";

// Проверяем конфигурацию NextAuth
const authConfig = getNextAuthConfig();

if (!authConfig) {
  logger.error(
    "NextAuth configuration is missing required environment variables"
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    // Web3 аутентификация через Solana кошелек
    CredentialsProvider({
      id: "solana",
      name: "Solana",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        try {
          if (!credentials?.message || !credentials?.signature) {
            return null;
          }

          const siweMessage = new SiweMessage(credentials.message);
          const message = await siweMessage.verify({
            signature: credentials.signature,
          });

          if (message.success) {
            // Проверяем, существует ли пользователь, и создаем при необходимости
            let user = await db.user.findFirst({
              where: {
                wallet: message.data.address,
              },
            });

            if (!user) {
              user = await db.user.create({
                data: {
                  wallet: message.data.address,
                  username: `user_${message.data.address.slice(0, 8)}`,
                  email: `${message.data.address}@solana.local`,
                  isArtist: false,
                  level: "BRONZE",
                },
              });
            }

            return {
              id: user.id,
              wallet: user.wallet,
              username: user.username,
              email: user.email,
              isArtist: user.isArtist,
              level: user.level,
            };
          }

          return null;
        } catch (error) {
          logger.error("Auth error", error as Error);
          return null;
        }
      },
    }),

    // OAuth провайдеры
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "user-read-email user-read-private user-top-read user-library-read",
        },
      },
    }),

    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "name email",
          response_type: "code",
          response_mode: "query",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // Обработка Web3 аутентификации
      if (account?.provider === "solana" && user) {
        token.wallet = (user as any).wallet;
        token.username = (user as any).username;
        token.isArtist = (user as any).isArtist;
        token.level = (user as any).level;
      }

      // Обработка OAuth аутентификации
      if (account?.provider === "spotify" && profile) {
        token.spotifyId = profile.id;
        token.spotifyProfile = profile;
      }

      if (account?.provider === "apple" && profile) {
        token.appleId = profile.sub;
        token.appleProfile = profile;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.wallet = token.wallet as string;
        session.user.username = token.username as string;
        session.user.isArtist = token.isArtist as boolean;
        session.user.level = token.level as string;

        // Добавляем OAuth данные в сессию
        session.user.spotifyId = token.spotifyId as string;
        session.user.spotifyProfile = token.spotifyProfile as any;
        session.user.appleId = token.appleId as string;
        session.user.appleProfile = token.appleProfile as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // Можно добавить кастомные страницы для разных провайдеров
  },
  // Настройка безопасности
  secret: authConfig?.secret || process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export interface AppSessionUser {
  id: string;
  wallet?: string;
  username?: string;
  isArtist?: boolean;
  level?: string;
  spotifyId?: string;
  spotifyProfile?: unknown;
  appleId?: string;
  appleProfile?: unknown;
}

export const getSessionUser = (session: unknown): AppSessionUser | null => {
  const s = session as Session | null | undefined;
  const user = s?.user as AppSessionUser | undefined;
  if (!user?.id) {
    return null;
  }
  return user;
};

// Хелперы для работы с аутентификацией
// В Next.js App Router для получения сессии используем прямой импорт в каждом файле
// export { getServerSession } from 'next-auth/edge'

export async function getCurrentUser() {
  // Функция getCurrentUser должна использоваться в серверных компонентах с напрямую переданной сессией
  // или с использованием вызова в роуте
  logger.warn(
    "getCurrentUser should be used with direct session access in server components"
  );
  return null;
}

// Функция для обновления уровня пользователя на основе активности
export async function updateUserLevel(userId: string) {
  // Получаем количество треков пользователя
  const trackCount = await db.track.count({
    where: { artistId: userId },
  });

  // Получаем количество лайков на треках пользователя
  const likesCount = await db.like.count({
    where: {
      track: {
        artistId: userId,
      },
    },
  });

  // Рассчитываем общий баланс активности
  const totalActivity = trackCount * 10 + likesCount;

  // Определяем уровень на основе активности
  let newLevel: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" = "BRONZE";
  if (totalActivity >= 1000) {
    newLevel = "PLATINUM";
  } else if (totalActivity >= 500) {
    newLevel = "GOLD";
  } else if (totalActivity >= 100) {
    newLevel = "SILVER";
  }

  // Обновляем уровень пользователя
  await db.user.update({
    where: { id: userId },
    data: { level: newLevel },
  });

  return newLevel;
}

// Функция для проверки прав доступа
export async function checkUserPermission(
  userId: string,
  requiredLevel: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM"
) {
  // Получаем уровень пользователя из базы данных
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });

  if (!user) {
    return false;
  }

  // Определяем иерархию уровней
  const levelHierarchy = {
    BRONZE: 1,
    SILVER: 2,
    GOLD: 3,
    PLATINUM: 4,
  };

  // Проверяем, соответствует ли уровень пользователя требуемому
  return (
    levelHierarchy[user.level as keyof typeof levelHierarchy] >=
    levelHierarchy[requiredLevel]
  );
}

// Функция для создания пользователя через OAuth
export async function createOAuthUser(profile: any, provider: string) {
  // Проверяем, существует ли уже пользователь с таким email
  const existingUser = await db.user.findFirst({
    where: {
      email: profile.email,
    },
  });

  if (existingUser) {
    return existingUser;
  }

  // Создаем нового пользователя
  const newUser = await db.user.create({
    data: {
      email: profile.email || "",
      username:
        profile.name || profile.login || profile.id || `user_${profile.id}`,
      displayName:
        profile.name || profile.display_name || profile.login || profile.id,
      isArtist: false,
      level: "BRONZE",
      avatar:
        profile.picture ||
        profile.avatar_url ||
        profile.images?.[0]?.url ||
        null,
    },
  });

  return newUser;
}

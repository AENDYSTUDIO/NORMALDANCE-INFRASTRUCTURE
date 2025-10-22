import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import { telegramIntegration2025 } from "@/lib/telegram-integration-2025";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors/errorHandler";
import {
  telegramMusicFeaturePlaySchema,
  telegramMusicFeatureSearchSchema,
  telegramNftFeatureBuySchema,
  telegramNftFeatureSellSchema,
  telegramStakingFeatureStakeSchema,
  telegramStakingFeatureUnstakeSchema,
  telegramPaymentsFeatureSendSchema,
  telegramNotificationsFeatureSettingsSchema,
} from "@/lib/schemas";

// GET /api/telegram/features - Возвращает список доступных функций платформы для Telegram Mini App
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Получаем токен из заголовка
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);

    // Получаем пользователя из базы данных
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Возвращаем список доступных функций
    const features = {
      musicStreaming: {
        enabled: true,
        description: "Потоковое воспроизведение музыки",
        endpoints: [
          "/api/telegram/music/list",
          "/api/telegram/music/play",
          "/api/telegram/music/search",
        ],
      },
      nftMarketplace: {
        enabled: true,
        description: "Покупка и продажа NFT",
        endpoints: [
          "/api/telegram/nft/list",
          "/api/telegram/nft/buy",
          "/api/telegram/nft/sell",
        ],
      },
      staking: {
        enabled: true,
        description: "Стейкинг токенов NDT",
        endpoints: [
          "/api/telegram/staking/info",
          "/api/telegram/staking/stake",
          "/api/telegram/staking/unstake",
        ],
      },
      analytics: {
        enabled: true,
        description: "Аналитика и статистика",
        endpoints: [
          "/api/telegram/analytics/overview",
          "/api/telegram/analytics/user-stats",
        ],
      },
      socialPayments: {
        enabled: true,
        description: "Социальные платежи через Telegram",
        endpoints: [
          "/api/telegram/payments/send",
          "/api/telegram/payments/receive",
          "/api/telegram/payments/history",
        ],
      },
      notifications: {
        enabled: true,
        description: "Уведомления и оповещения",
        endpoints: [
          "/api/telegram/notifications/list",
          "/api/telegram/notifications/settings",
        ],
      },
    };

  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/telegram/features/:featureName - Вызов конкретной функции платформы
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Получаем токен из заголовка
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);

    // Получаем пользователя из базы данных
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Получаем название функции из URL
    const url = new URL(request.url);
    const featureName = url.pathname.split("/")[3]; // /api/telegram/features/:featureName

    // Получаем тело запроса
    const body = await request.json();

    // Обработка различных функций
    switch (featureName) {
      case "music":
        return await handleMusicFeature(user, body);
      case "nft":
        return await handleNFTFeature(user, body);
      case "staking":
        return await handleStakingFeature(user, body);
      case "analytics":
        return await handleAnalyticsFeature(user, body);
      case "payments":
        return await handlePaymentsFeature(user, body);
      case "notifications":
        return await handleNotificationsFeature(user, body);
      default:
        return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// Обработчики для различных функций

async function handleMusicFeature(user: { id: string; telegramId: number }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "list":
        // Возвращаем список треков
        const tracks = await db.track.findMany({
          where: { status: "published" },
          take: 20,
          include: {
            artist: true,
            album: true,
          },
        });
        return NextResponse.json({ tracks });

      case "play":
        const { trackId } = telegramMusicFeaturePlaySchema.parse(body);
        // Логируем воспроизведение трека
        await db.playHistory.create({
          data: {
            userId: user.id,
            trackId: trackId,
            timestamp: new Date(),
          },
        });

        // Получаем информацию о треке
        const track = await db.track.findUnique({
          where: { id: trackId },
          include: {
            artist: true,
            album: true,
          },
        });

        return NextResponse.json({ track });

      case "search":
        const { query } = telegramMusicFeatureSearchSchema.parse(body);
        // Поиск треков
        const searchTracks = await db.track.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              {
                artist: { name: { contains: query, mode: "insensitive" } },
              },
            ],
          },
          include: {
            artist: true,
          },
          take: 20,
        });
        return NextResponse.json({ tracks: searchTracks });

      default:
        return NextResponse.json(
          { error: "Unknown music action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleNFTFeature(user: { id: string; telegramId: number }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "list":
        // Возвращаем список NFT
        const nfts = await db.nft.findMany({
          where: { status: "active" },
          take: 20,
          include: {
            creator: true,
          },
        });
        return NextResponse.json({ nfts });

      case "buy":
        const { nftId: buyNftId, amount: buyAmount } = telegramNftFeatureBuySchema.parse(body);
        // Покупка NFT
        // Проверяем, что NFT существует и доступен для покупки
        const nftToBuy = await db.nft.findUnique({
          where: { id: buyNftId },
        });

        if (!nftToBuy || nftToBuy.status !== "active" || nftToBuy.price !== buyAmount) {
          return NextResponse.json(
            { error: "NFT not available for purchase" },
            { status: 400 }
          );
        }

        // Создаем транзакцию покупки
        const transaction = await db.transaction.create({
          data: {
            type: "NFT_PURCHASE",
            fromUserId: user.id,
            toUserId: nftToBuy.creatorId,
            amount: buyAmount,
            currency: "SOL",
            status: "pending",
            nftId: buyNftId,
          },
        });

        // В реальном приложении здесь будет взаимодействие с блокчейном
        // Пока просто обновляем статус транзакции на успешный
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: "completed" },
        });

        // Обновляем владельца NFT
        await db.nft.update({
          where: { id: buyNftId },
          data: {
            ownerId: user.id,
            status: "owned",
          },
        });

        return NextResponse.json({
          success: true,
          transactionId: transaction.id,
          message: "NFT purchased successfully",
        });

      case "sell":
        const { nftId: sellNftId, amount: sellAmount } = telegramNftFeatureSellSchema.parse(body);
        // Продажа NFT
        // Проверяем, что пользователь является владельцем NFT
        const nftToSell = await db.nft.findUnique({
          where: { id: sellNftId },
        });

        if (!nftToSell || nftToSell.ownerId !== user.id) {
          return NextResponse.json(
            { error: "You do not own this NFT" },
            { status: 400 }
          );
        }

        // Обновляем статус NFT на продажу
        await db.nft.update({
          where: { id: sellNftId },
          data: {
            status: "active",
            price: sellAmount,
          },
        });

        return NextResponse.json({
          success: true,
          message: "NFT listed for sale",
        });

      default:
        return NextResponse.json(
          { error: "Unknown NFT action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleStakingFeature(user: { id: string; telegramId: number; ndtBalance: number; }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "info":
        // Возвращаем информацию о стейкинге пользователя
        const stakeInfo = await db.stake.findFirst({
          where: { userId: user.id },
        });

        return NextResponse.json({
          stakeInfo: stakeInfo || { amount: 0, rewards: 0, duration: 0 },
        });

      case "stake":
        const { amount: stakeAmount } = telegramStakingFeatureStakeSchema.parse(body);
        // Стейкинг токенов
        // Проверяем баланс пользователя
        if (user.ndtBalance < stakeAmount) {
          return NextResponse.json(
            { error: "Insufficient NDT balance" },
            { status: 400 }
          );
        }

        // Создаем запись о стейкинге
        const stake = await db.stake.create({
          data: {
            userId: user.id,
            amount: stakeAmount,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 100), // 30 дней
            rewards: 0,
          },
        });

        // Обновляем баланс пользователя
        await db.user.update({
          where: { id: user.id },
          data: { ndtBalance: { decrement: stakeAmount } },
        });

        return NextResponse.json({
          success: true,
          stakeId: stake.id,
          message: "Tokens staked successfully",
        });

      case "unstake":
        const { stakeId } = telegramStakingFeatureUnstakeSchema.parse(body);
        // Отмена стейкинга
        const existingStake = await db.stake.findUnique({
          where: { id: stakeId, userId: user.id, status: "active" },
        });

        if (!existingStake) {
          return NextResponse.json(
            { error: "No active stake found" },
            { status: 400 }
          );
        }

        // Обновляем статус стейкинга
        await db.stake.update({
          where: { id: existingStake.id },
          data: { status: "unstaked" },
        });

        // Возвращаем токены пользователю
        await db.user.update({
          where: { id: user.id },
          data: { ndtBalance: { increment: existingStake.amount } },
        });

        return NextResponse.json({
          success: true,
          message: "Tokens unstaked successfully",
        });

      default:
        return NextResponse.json(
          { error: "Unknown staking action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleAnalyticsFeature(user: { id: string; telegramId: number; createdAt: Date; }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "overview":
        // Возвращаем общую аналитику
        const totalListens = await db.playHistory.count({
          where: { userId: user.id },
        });

        const totalStaked = await db.stake.aggregate({
          where: { userId: user.id },
          _sum: { amount: true },
        });

        const totalNFTs = await db.nft.count({
          where: { ownerId: user.id },
        });

        return NextResponse.json({
          overview: {
            totalListens,
            totalStaked: totalStaked._sum.amount || 0,
            totalNFTs,
            joinDate: user.createdAt,
          },
        });

      case "user-stats":
        // Возвращаем статистику пользователя
        const listenStats = await db.playHistory.groupBy({
          by: ["trackId"],
          where: { userId: user.id },
          _count: true,
          orderBy: { _count: "desc" },
          take: 5,
        });

        // Получаем информацию о треках
        const favoriteTracks = await Promise.all(
          listenStats.map(async (stat: { trackId: string; count: number; duration: number }) => {
            const track = await db.track.findUnique({
              where: { id: stat.trackId },
              include: { artist: true },
            });
            return { track, count: stat._count };
          })
        );

        return NextResponse.json({
          userStats: {
            favoriteTracks,
            listenHistory: listenStats,
          },
        });

      default:
        return NextResponse.json(
          { error: "Unknown analytics action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function handlePaymentsFeature(user: { id: string; telegramId: number; balance: number; name: string; }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "send":
        const { recipientId, amount, message } = telegramPaymentsFeatureSendSchema.parse(body);
        // Отправка платежа
        // Проверяем баланс пользователя
        if (user.balance < amount) {
          return NextResponse.json(
            { error: "Insufficient balance" },
            { status: 400 }
          );
        }

        // Создаем транзакцию
        const transaction = await db.transaction.create({
          data: {
            type: "TRANSFER",
            fromUserId: user.id,
            toUserId: recipientId,
            amount: amount,
            currency: "NDT",
            status: "pending",
            description: message || "Transfer via Telegram",
          },
        });

        // В реальном приложении здесь будет взаимодействие с платежной системой
        // Пока просто обновляем статус транзакции на успешный
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: "completed" },
        });

        // Обновляем балансы пользователей
        await db.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
        });

        await db.user.update({
          where: { id: recipientId },
          data: { balance: { increment: amount } },
        });

        // Отправляем уведомление получателю
        await telegramIntegration2025.sendNotification(parseInt(recipientId), {
          type: "order_executed",
          title: "Payment Received",
          message: `You received ${amount} NDT from ${user.name}`,
          data: { transactionId: transaction.id },
        });

        return NextResponse.json({
          success: true,
          transactionId: transaction.id,
          message: "Payment sent successfully",
        });

      case "receive":
        // Получение платежа (возвращаем историю платежей)
        const receivedPayments = await db.transaction.findMany({
          where: { toUserId: user.id, type: "TRANSFER", status: "completed" },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        return NextResponse.json({ receivedPayments });

      case "history":
        // История платежей пользователя
        const paymentHistory = await db.transaction.findMany({
          where: {
            OR: [{ fromUserId: user.id }, { toUserId: user.id }],
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        return NextResponse.json({ paymentHistory });

      default:
        return NextResponse.json(
          { error: "Unknown payments action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleNotificationsFeature(user: { id: string; telegramId: number; emailNotifications: boolean; pushNotifications: boolean; }, body: unknown) {
  try {
    const { action } = z.object({ action: z.string() }).parse(body); // Validate action first

    switch (action) {
      case "list":
        // Возвращаем список уведомлений пользователя
        const notifications = await db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        return NextResponse.json({ notifications });

      case "settings":
        const { settings } = telegramNotificationsFeatureSettingsSchema.parse(body);
        // Возвращаем настройки уведомлений
        return NextResponse.json({
          settings: {
            emailNotifications: settings.emailNotifications || user.emailNotifications || false,
            pushNotifications: settings.pushNotifications || user.pushNotifications || true,
            telegramNotifications: true, // всегда включено для Telegram Mini App
          },
        });

      default:
        return NextResponse.json(
          { error: "Unknown notifications action" },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}

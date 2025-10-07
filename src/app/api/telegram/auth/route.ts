import { signJWT } from "@/lib/jwt";
import { verifyTelegramWebAppData } from "@/lib/telegram-auth";
import { NextResponse } from "next/server";

// POST /api/telegram/auth - Аутентификация через Telegram Web App
export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { error: "initData is required" },
        { status: 400 }
      );
    }

    // Валидация данных Telegram
    const isValid = await verifyTelegramWebAppData(initData);

    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid Telegram data" },
        { status: 401 }
      );
    }

    // Извлечение данных пользователя из initData
    const urlParams = new URLSearchParams(initData);
    const userParam = urlParams.get("user");

    if (!userParam) {
      return NextResponse.json(
        { error: "User data not found in initData" },
        { status: 400 }
      );
    }

    const telegramUser = JSON.parse(decodeURIComponent(userParam));

    // Проверяем, существует ли пользователь в базе данных
    let user = await db.user.findUnique({
      where: { telegramId: telegramUser.id.toString() },
    });

    // Если пользователь не существует, создаем нового
    if (!user) {
      user = await db.user.create({
        data: {
          telegramId: telegramUser.id.toString(),
          name: `${telegramUser.first_name} ${
            telegramUser.last_name || ""
          }`.trim(),
          username: telegramUser.username || null,
          email: null, // Telegram не предоставляет email по умолчанию
          avatar: telegramUser.photo_url || null,
          isPremium: telegramUser.is_premium || false,
          language: telegramUser.language_code || "en",
        },
      });
    } else {
      // Обновляем данные пользователя, если они изменились
      user = await db.user.update({
        where: { telegramId: telegramUser.id.toString() },
        data: {
          name: `${telegramUser.first_name} ${
            telegramUser.last_name || ""
          }`.trim(),
          username: telegramUser.username || null,
          avatar: telegramUser.photo_url || null,
          isPremium: telegramUser.is_premium || false,
          language: telegramUser.language_code || "en",
        },
      });
    }

    // Генерируем JWT токен для пользователя
    const token = await signJWT({
      userId: user.id,
      telegramId: user.telegramId,
      isPremium: user.isPremium,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        name: user.name,
        username: user.username,
        isPremium: user.isPremium,
        language: user.language,
      },
    });
  } catch (error) {
    console.error("Error in Telegram auth:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

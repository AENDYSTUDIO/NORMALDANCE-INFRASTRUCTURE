import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";
import { NextResponse } from "next/server";

// GET /api/telegram/web3 - Возвращает информацию о Web3-интеграции для Telegram Mini App
export async function GET(request: NextRequest) {
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

    // Возвращаем информацию о Web3-интеграции
    const web3Info = {
      walletConnected: user.walletAddress ? true : false,
      walletAddress: user.walletAddress || null,
      solBalance: user.solBalance || 0,
      ndtBalance: user.ndtBalance || 0,
      nfts: [],
      stakedTokens: user.stakedNdt || 0,
      supportedChains: ["solana"],
      features: {
        walletConnection: true,
        tokenTransfers: true,
        nftManagement: true,
        staking: true,
        dexSwaps: true,
      },
    };

    return NextResponse.json(web3Info);
  } catch (error) {
    console.error("Error in Telegram Web3 API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/telegram/web3/:action - Вызов конкретной Web3-функции
export async function POST(request: NextRequest) {
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

    // Получаем действие из URL
    const url = new URL(request.url);
    const action = url.pathname.split("/")[3]; // /api/telegram/web3/:action

    // Получаем тело запроса
    const body = await request.json();

    // Обработка различных Web3-действий
    switch (action) {
      case "connect-wallet":
        return await handleConnectWallet(user, body);
      case "transfer-tokens":
        return await handleTransferTokens(user, body);
      case "stake-tokens":
        return await handleStakeTokens(user, body);
      case "unstake-tokens":
        return await handleUnstakeTokens(user, body);
      case "swap-tokens":
        return await handleSwapTokens(user, body);
      case "get-nfts":
        return await handleGetNFTs(user, body);
      case "mint-nft":
        return await handleMintNFT(user, body);
      default:
        return NextResponse.json(
          { error: "Unknown Web3 action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in Telegram Web3 API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Обработчики для различных Web3-функций

async function handleConnectWallet(user: { id: string; telegramId: number }, body: { walletAddress: string; walletType: string }) {
  const { walletAddress } = body;

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  // Обновляем адрес кошелька пользователя
  await db.user.update({
    where: { id: user.id },
    data: { walletAddress },
  });

  return NextResponse.json({
    success: true,
    message: "Wallet connected successfully",
    walletAddress,
  });
}

async function handleTransferTokens(user: { id: string; telegramId: number }, body: { recipient: string; amount: number; token: string }) {
  const { recipientAddress, tokenType, amount } = body;

  if (!recipientAddress || !tokenType || !amount) {
    return NextResponse.json(
      {
        error: "Recipient address, token type, and amount required",
      },
      { status: 400 }
    );
  }

  // Проверяем баланс пользователя
  let userBalance = 0;
  let balanceField = "";

  if (tokenType === "SOL") {
    userBalance = user.solBalance;
    balanceField = "solBalance";
  } else if (tokenType === "NDT") {
    userBalance = user.ndtBalance;
    balanceField = "ndtBalance";
  } else {
    return NextResponse.json(
      { error: "Unsupported token type" },
      { status: 400 }
    );
  }

  if (userBalance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  // В реальном приложении здесь будет выполнена транзакция через Solana Web3 SDK
  // Пока просто обновляем балансы в базе данных
  await db.user.update({
    where: { id: user.id },
    data: { [balanceField]: { decrement: amount } },
  });

  // Если получатель существует в системе, обновляем его баланс
  const recipient = await db.user.findUnique({
    where: { walletAddress: recipientAddress },
  });

  if (recipient) {
    await db.user.update({
      where: { id: recipient.id },
      data: { [balanceField]: { increment: amount } },
    });
  }

  // Создаем запись о транзакции
  await db.transaction.create({
    data: {
      type: "WEB3_TRANSFER",
      fromUserId: user.id,
      toWalletAddress: recipientAddress,
      amount,
      currency: tokenType,
      status: "completed",
      description: `Transfer ${amount} ${tokenType} to ${recipientAddress}`,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Successfully transferred ${amount} ${tokenType}`,
    transactionId: `web3_transfer_${Date.now()}`,
  });
}

async function handleStakeTokens(user: { id: string; telegramId: number }, body: { amount: number; duration: number }) {
  const { amount } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount required" }, { status: 400 });
  }

  // Проверяем баланс NDT
  if (user.ndtBalance < amount) {
    return NextResponse.json(
      { error: "Insufficient NDT balance" },
      { status: 400 }
    );
  }

  // Обновляем балансы
  await db.user.update({
    where: { id: user.id },
    data: {
      ndtBalance: { decrement: amount },
      stakedNdt: { increment: amount },
    },
  });

  // Создаем запись о стейкинге
  const stake = await db.stake.create({
    data: {
      userId: user.id,
      amount,
      type: "NDT",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 1000), // 30 дней
      rewards: 0,
      status: "active",
    },
  });

  return NextResponse.json({
    success: true,
    message: `Successfully staked ${amount} NDT`,
    stakeId: stake.id,
  });
}

async function handleUnstakeTokens(user: { id: string; telegramId: number }, body: { stakeId: string }) {
  const { amount } = body;

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Amount required" }, { status: 400 });
  }

  // Проверяем застейканное количество
  if (user.stakedNdt < amount) {
    return NextResponse.json(
      { error: "Insufficient staked tokens" },
      { status: 400 }
    );
  }

  // Обновляем балансы
  await db.user.update({
    where: { id: user.id },
    data: {
      ndtBalance: { increment: amount },
      stakedNdt: { decrement: amount },
    },
  });

  // Обновляем запись о стейкинге
  await db.stake.updateMany({
    where: {
      userId: user.id,
      status: "active",
    },
    data: {
      amount: { decrement: amount },
      status: amount > user.stakedNdt ? "inactive" : "active",
    },
  });

  return NextResponse.json({
    success: true,
    message: `Successfully unstaked ${amount} NDT`,
  });
}

async function handleSwapTokens(user: { id: string; telegramId: number }, body: { fromToken: string; toToken: string; amount: number; slippage: number }) {
  const { fromToken, toToken, amount } = body;

  if (!fromToken || !toToken || !amount) {
    return NextResponse.json(
      {
        error: "From token, to token, and amount required",
      },
      { status: 400 }
    );
  }

  // Проверяем баланс исходного токена
  let userBalance = 0;
  let fromBalanceField = "";
  let toBalanceField = "";

  if (fromToken === "SOL" && toToken === "NDT") {
    userBalance = user.solBalance;
    fromBalanceField = "solBalance";
    toBalanceField = "ndtBalance";
  } else if (fromToken === "NDT" && toToken === "SOL") {
    userBalance = user.ndtBalance;
    fromBalanceField = "ndtBalance";
    toBalanceField = "solBalance";
  } else {
    return NextResponse.json(
      { error: "Unsupported token swap" },
      { status: 400 }
    );
  }

  if (userBalance < amount) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  // Рассчитываем количество токенов для обмена (упрощенный расчет)
  // В реальном приложении здесь будет взаимодействие с DEX
  const rate = 0.1; // 1 NDT = 0.1 SOL (пример)
  const receivedAmount = fromToken === "SOL" ? amount / rate : amount * rate;

  // Обновляем балансы
  await db.user.update({
    where: { id: user.id },
    data: {
      [fromBalanceField]: { decrement: amount },
      [toBalanceField]: { increment: receivedAmount },
    },
  });

  // Создаем запись о свопе
  await db.transaction.create({
    data: {
      type: "TOKEN_SWAP",
      fromUserId: user.id,
      amount: amount,
      currency: fromToken,
      receivedAmount: receivedAmount,
      receivedCurrency: toToken,
      status: "completed",
      description: `Swap ${amount} ${fromToken} to ${receivedAmount} ${toToken}`,
    },
  });

  return NextResponse.json({
    success: true,
    message: `Successfully swapped ${amount} ${fromToken} to ${receivedAmount} ${toToken}`,
    transactionId: `swap_${Date.now()}`,
  });
}

async function handleGetNFTs(user: { id: string; telegramId: number }, body: Record<string, unknown>) {
  // Возвращаем NFT пользователя
  const userNFTs = await db.nft.findMany({
    where: { ownerId: user.id },
    include: {
      creator: true,
    },
  });

  return NextResponse.json({
    success: true,
    nfts: userNFTs,
  });
}

async function handleMintNFT(user: { id: string; telegramId: number }, body: { trackId: string; metadata: Record<string, unknown> }) {
  const { name, description, mediaUrl, attributes } = body;

  if (!name || !mediaUrl) {
    return NextResponse.json(
      {
        error: "Name and media URL required",
      },
      { status: 40 }
    );
  }

  // Создаем новую NFT
  const newNFT = await db.nft.create({
    data: {
      name,
      description: description || "",
      mediaUrl,
      attributes: attributes || {},
      creatorId: user.id,
      ownerId: user.id,
      price: 0, // Mint бесплатно или с минимальной платой
      status: "active",
    },
  });

  return NextResponse.json({
    success: true,
    message: "NFT minted successfully",
    nftId: newNFT.id,
  });
}

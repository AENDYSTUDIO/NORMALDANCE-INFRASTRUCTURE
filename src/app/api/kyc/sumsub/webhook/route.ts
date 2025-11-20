/**
 * 🔐 Sumsub Webhook Handler
 *
 * API endpoint для обработки вебхуков от Sumsub
 */

import { KYCSumsubService } from "@/lib/aml-kyc/kyc-sumsub-service";
import { getSumsubConfig } from "@/lib/aml-kyc/sumsub-config";
import { NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Проверка подписи вебхука
    const signature = request.headers.get("x-sumsub-signature");
    const body = await request.text();

    if (!signature) {
      console.error("Missing Sumsub webhook signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Валидация JSON
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error("Invalid JSON in webhook payload:", error);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Проверка типа события
    if (!payload.type) {
      console.error("Missing event type in webhook payload");
      return NextResponse.json(
        { error: "Missing event type" },
        { status: 400 }
      );
    }

    // Получение конфигурации Sumsub
    const sumsubConfig = getSumsubConfig();
    const validation = validateSumsubConfig(sumsubConfig);

    if (!validation.isValid) {
      console.error("Invalid Sumsub configuration:", validation.errors);
      return NextResponse.json(
        { error: "Configuration error", details: validation.errors },
        { status: 500 }
      );
    }

    // Создание сервиса для обработки вебхука
    const kycSumsubService = new KYCSumsubService(sumsubConfig);

    // Обработка вебхука
    const result = await kycSumsubService.processSumsubVerificationResult(
      payload.applicantId,
      payload.reviewResult
    );

    if (!result.success) {
      console.error("Error processing Sumsub webhook:", result.message);
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    // Логирование успешной обработки
    console.log(
      `Sumsub webhook processed successfully for applicant: ${payload.applicantId}`
    );

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      applicantId: payload.applicantId,
      eventType: payload.type,
    });
  } catch (error) {
    console.error("Error in Sumsub webhook handler:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Валидация конфигурации Sumsub
 */
function validateSumsubConfig(config: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push("API key is required");
  }

  if (!config.secret) {
    errors.push("Secret is required");
  }

  if (!config.appId) {
    errors.push("App ID is required");
  }

  if (!config.apiUrl) {
    errors.push("API URL is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Проверка IP адреса для безопасности вебхука
 */
function isAllowedIp(request: NextRequest): boolean {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // В реальной системе здесь должна быть проверка белого списка IP
  // Пока разрешаем все IP для разработки
  return true;
}

// Поддержка GET запросов для проверки статуса
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get("applicantId");

    if (!applicantId) {
      return NextResponse.json(
        { error: "applicantId parameter is required" },
        { status: 400 }
      );
    }

    // Получение конфигурации и создание сервиса
    const sumsubConfig = getSumsubConfig();
    const kycSumsubService = new KYCSumsubService(sumsubConfig);

    // Получение статуса верификации
    const status = await kycSumsubService.getSumsubVerificationStatus(
      applicantId
    );

    if (!status) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error getting Sumsub verification status:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

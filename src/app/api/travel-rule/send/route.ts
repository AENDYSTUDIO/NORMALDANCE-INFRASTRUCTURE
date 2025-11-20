/**
 * 🌍 Travel Rule Send API
 *
 * API эндпоинт для отправки Travel Rule сообщений
 * в соответствии с требованиями FATF
 */

import { NextRequest, NextResponse } from "next/server";
import { TravelRuleIntegrationService } from "@/lib/travel-rule/travel-rule-integration";
import { VASPInfo } from "@/lib/travel-rule/types";

// Конфигурация VASP для NormalDance
const normalDanceVASPInfo: VASPInfo = {
  id: "NORMALDANCE-VASP-001",
  name: "NormalDance Music Platform",
  type: "NFT_MARKETPLACE",
  registrationNumber: "ND-2023-001",
  jurisdiction: "RU",
  address: {
    street: "789 Music Avenue",
    city: "Moscow",
    state: "Moscow",
    postalCode: "125009",
    country: "RU",
  },
  contact: {
    email: "compliance@normaldance.ru",
    phone: "+7-495-123-4567",
    website: "https://normaldance.ru",
  },
  regulatoryStatus: {
    isRegistered: true,
    licenseNumber: "CENTRALBANK-987654",
    regulatorName: "Central Bank of Russia",
    registrationDate: "2023-06-10",
  },
  technicalContact: {
    name: "Technical Support",
    email: "tech@normaldance.ru",
    phone: "+7-495-123-4568",
  },
  complianceOfficer: {
    name: "Compliance Officer",
    email: "compliance@normaldance.ru",
    phone: "+7-495-123-4569",
  },
};

// Создание интеграционного сервиса
const travelRuleIntegration = new TravelRuleIntegrationService({
  enabled: true,
  autoTriggerThreshold: 1000, // $1,000 USD
  supportedTransactionTypes: ["TRANSFER", "NFT_PURCHASE", "NFT_SALE", "SWAP"],
  vaspInfo: normalDanceVASPInfo,
});

// POST /api/travel-rule/send - Отправка Travel Rule сообщения
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация входных данных
    const { transactionId, recipientVaspId, protocol, message, priority } = body;
    
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_TRANSACTION_ID", message: "Transaction ID is required" } },
        { status: 400 }
      );
    }

    if (!recipientVaspId) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_VASP_ID", message: "Recipient VASP ID is required" } },
        { status: 400 }
      );
    }

    if (!protocol) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_PROTOCOL", message: "Protocol is required" } },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_MESSAGE", message: "Message is required" } },
        { status: 400 }
      );
    }

    // Проверка поддерживаемых протоколов
    if (!["CAT", "OFAC", "IVMS101"].includes(protocol)) {
      return NextResponse.json(
        { success: false, error: { code: "UNSUPPORTED_PROTOCOL", message: `Protocol ${protocol} is not supported` } },
        { status: 400 }
      );
    }

    // Валидация сообщения в зависимости от протокола
    const validationError = validateMessage(message, protocol);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_MESSAGE", message: validationError } },
        { status: 400 }
      );
    }

    // Отправка сообщения через Travel Rule сервис
    const result = await travelRuleIntegration.processTransaction({
      id: transactionId,
      hash: generateTransactionHash(transactionId, message),
      fromAddress: message.payload?.transaction?.fromAddress || "",
      toAddress: message.payload?.transaction?.toAddress || "",
      amount: message.payload?.transaction?.amount || 0,
      currency: message.payload?.transaction?.asset || "USD",
      type: "TRANSFER",
      timestamp: new Date().toISOString(),
    });

    if (result.travelRuleTriggered) {
      return NextResponse.json({
        success: true,
        data: {
          messageId: result.messageId,
          status: result.status,
          timestamp: new Date().toISOString(),
          protocol,
          recipientVaspId,
        },
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "TRAVEL_RULE_FAILED", 
            message: result.error || "Failed to process Travel Rule message" 
          } 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Travel Rule send API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during Travel Rule message sending",
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/travel-rule/send - Получение информации об отправленных сообщениях
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const transactionId = searchParams.get("transactionId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Получение статистики Travel Rule
    const stats = await travelRuleIntegration.getTravelRuleStatistics();

    // Формирование ответа
    const response = {
      success: true,
      data: {
        statistics: stats,
        filters: {
          messageId,
          transactionId,
          status,
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in Travel Rule send GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during Travel Rule statistics retrieval",
        },
      },
      { status: 500 }
    );
  }
}

// Вспомогательные функции

/**
 * Валидация сообщения в зависимости от протокола
 */
function validateMessage(message: any, protocol: string): string | null {
  try {
    switch (protocol) {
      case "CAT":
        return validateCATMessage(message);
      case "OFAC":
        return validateOFACMessage(message);
      case "IVMS101":
        return validateIVMS101Message(message);
      default:
        return `Unknown protocol: ${protocol}`;
    }
  } catch (error) {
    return `Message validation error: ${error}`;
  }
}

/**
 * Валидация CAT сообщения
 */
function validateCATMessage(message: any): string | null {
  if (!message.header?.messageId) {
    return "CAT message missing messageId";
  }

  if (!message.payload?.transaction?.id) {
    return "CAT message missing transaction ID";
  }

  if (!message.payload?.originator?.name) {
    return "CAT message missing originator name";
  }

  if (!message.payload?.beneficiary?.name) {
    return "CAT message missing beneficiary name";
  }

  return null;
}

/**
 * Валидация OFAC сообщения
 */
function validateOFACMessage(message: any): string | null {
  if (!message.header?.messageId) {
    return "OFAC message missing messageId";
  }

  if (!message.screeningRequest?.entities?.length) {
    return "OFAC message missing entities to screen";
  }

  if (!message.screeningRequest?.transaction?.id) {
    return "OFAC message missing transaction ID";
  }

  return null;
}

/**
 * Валидация IVMS101 сообщения
 */
function validateIVMS101(message: any): string | null {
  if (!message.messageId) {
    return "IVMS101 message missing messageId";
  }

  if (!message.originator) {
    return "IVMS101 message missing originator";
  }

  if (!message.beneficiary) {
    return "IVMS101 message missing beneficiary";
  }

  return null;
}

/**
 * Генерация хэша транзакции
 */
function generateTransactionHash(transactionId: string, message: any): string {
  const data = `${transactionId}${JSON.stringify(message)}${Date.now()}`;
  return Buffer.from(data).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}
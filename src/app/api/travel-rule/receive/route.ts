/**
 * 📥 Travel Rule Receive API
 *
 * API эндпоинт для получения и обработки входящих Travel Rule сообщений
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

// POST /api/travel-rule/receive - Получение входящего Travel Rule сообщения
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация входных данных
    const { messageId, protocol, message, signature } = body;
    
    if (!messageId) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_MESSAGE_ID", message: "Message ID is required" } },
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

    // Валидация подписи (если предоставлена)
    if (signature) {
      const signatureValid = await verifyMessageSignature(message, signature);
      if (!signatureValid) {
        return NextResponse.json(
          { success: false, error: { code: "INVALID_SIGNATURE", message: "Message signature is invalid" } },
          { status: 401 }
        );
      }
    }

    // Валидация сообщения в зависимости от протокола
    const validationError = validateMessage(message, protocol);
    if (validationError) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_MESSAGE", message: validationError } },
        { status: 400 }
      );
    }

    // Сохранение входящего сообщения в базу данных
    await saveIncomingMessage(messageId, protocol, message, signature);

    // Обработка сообщения
    const processResult = await travelRuleIntegration.handleIncomingTravelRuleMessage(messageId);

    if (processResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          messageId,
          status: processResult.status,
          timestamp: new Date().toISOString(),
          protocol,
        },
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "PROCESSING_FAILED", 
            message: processResult.error || "Failed to process Travel Rule message" 
          } 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Travel Rule receive API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during Travel Rule message processing",
        },
      },
      { status: 500 }
    );
  }
}

// GET /api/travel-rule/receive - Получение входящих сообщений
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    const protocol = searchParams.get("protocol");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Получение входящих сообщений из базы данных
    const messages = await getIncomingMessages({
      messageId,
      protocol,
      status,
      dateFrom,
      dateTo,
      limit,
      offset,
    });

    // Получение статистики
    const stats = await getIncomingMessagesStats();

    return NextResponse.json({
      success: true,
      data: {
        messages,
        totalCount: messages.length,
        hasMore: offset + limit < messages.length,
        statistics: stats,
        filters: {
          messageId,
          protocol,
          status,
          dateFrom,
          dateTo,
          limit,
          offset,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in Travel Rule receive GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during Travel Rule messages retrieval",
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/travel-rule/receive/[messageId]/acknowledge - Подтверждение получения сообщения
export async function PUT(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const messageId = params.messageId;
    const body = await request.json();
    const { status, notes } = body;

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_MESSAGE_ID", message: "Message ID is required" } },
        { status: 400 }
      );
    }

    if (!status || !["ACKNOWLEDGED", "COMPLETED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_STATUS", message: "Valid status is required" } },
        { status: 400 }
      );
    }

    // Обновление статуса сообщения
    const updateResult = await updateMessageStatus(messageId, status, notes);

    if (updateResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          messageId,
          status,
          timestamp: new Date().toISOString(),
          notes,
        },
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: "UPDATE_FAILED", 
            message: updateResult.error || "Failed to update message status" 
          } 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in Travel Rule acknowledge API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during message acknowledgment",
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
function validateIVMS101Message(message: any): string | null {
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
 * Проверка подписи сообщения
 */
async function verifyMessageSignature(message: any, signature: string): Promise<boolean> {
  try {
    // В реальной системе здесь будет криптографическая проверка подписи
    // Пока используем упрощенную логику
    const messageString = JSON.stringify(message);
    const expectedSignature = Buffer.from(messageString).toString('base64').substring(0, 64);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying message signature:", error);
    return false;
  }
}

/**
 * Сохранение входящего сообщения
 */
async function saveIncomingMessage(
  messageId: string,
  protocol: string,
  message: any,
  signature?: string
): Promise<void> {
  try {
    // В реальной системе здесь будет сохранение в базу данных
    console.log(`Saving incoming message: ${messageId}, protocol: ${protocol}`);
    
    // Моковое сохранение
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error("Error saving incoming message:", error);
  }
}

/**
 * Получение входящих сообщений
 */
async function getIncomingMessages(filters: {
  messageId?: string;
  protocol?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}): Promise<any[]> {
  try {
    // В реальной системе здесь будет запрос к базе данных
    // Пока возвращаем моковые данные
    return [
      {
        id: filters.messageId || "msg_001",
        protocol: filters.protocol || "CAT",
        status: filters.status || "RECEIVED",
        timestamp: new Date().toISOString(),
        message: {
          header: { messageId: "msg_001" },
          payload: { transaction: { id: "tx_001" } },
        },
      },
    ];
  } catch (error) {
    console.error("Error getting incoming messages:", error);
    return [];
  }
}

/**
 * Получение статистики входящих сообщений
 */
async function getIncomingMessagesStats(): Promise<{
  totalMessages: number;
  receivedToday: number;
  pendingProcessing: number;
  completedToday: number;
  rejectedToday: number;
}> {
  try {
    // В реальной системе здесь будет запрос к базе данных
    // Пока возвращаем моковые данные
    return {
      totalMessages: 500,
      receivedToday: 25,
      pendingProcessing: 5,
      completedToday: 20,
      rejectedToday: 2,
    };
  } catch (error) {
    console.error("Error getting incoming messages stats:", error);
    return {
      totalMessages: 0,
      receivedToday: 0,
      pendingProcessing: 0,
      completedToday: 0,
      rejectedToday: 0,
    };
  }
}

/**
 * Обновление статуса сообщения
 */
async function updateMessageStatus(
  messageId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // В реальной системе здесь будет обновление в базе данных
    console.log(`Updating message status: ${messageId} -> ${status}`);
    
    // Моковое обновление
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  } catch (error) {
    console.error("Error updating message status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
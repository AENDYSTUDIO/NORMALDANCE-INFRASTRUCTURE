/**
 * 🔗 Chainalysis Transaction Analysis API
 *
 * API эндпоинт для анализа транзакций через Chainalysis
 */

import { NextRequest, NextResponse } from "next/server";
import { ChainalysisService } from "@/lib/aml-kyc/chainalysis-service";
import { ChainalysisTransactionAnalysisRequest } from "@/lib/aml-kyc/chainalysis-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация входных данных
    const { transactionHash, asset, includeInputs, includeOutputs, includeExposure, includeIdentifications } = body;
    
    if (!transactionHash) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_TRANSACTION_HASH", message: "Transaction hash is required" } },
        { status: 400 }
      );
    }

    if (!asset) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_ASSET", message: "Asset is required" } },
        { status: 400 }
      );
    }

    // Создаем запрос на анализ
    const analysisRequest: ChainalysisTransactionAnalysisRequest = {
      transactionHash,
      asset,
      includeInputs: includeInputs !== false,
      includeOutputs: includeOutputs !== false,
      includeExposure: includeExposure !== false,
      includeIdentifications: includeIdentifications !== false,
    };

    // Выполняем анализ через Chainalysis
    const chainalysisService = new ChainalysisService();
    const result = await chainalysisService.analyzeTransaction(analysisRequest);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error in Chainalysis transaction analysis API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during transaction analysis",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionHash = searchParams.get("transactionHash");

    if (!transactionHash) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_TRANSACTION_HASH", message: "Transaction hash is required" } },
        { status: 400 }
      );
    }

    // Здесь можно добавить получение сохраненного анализа транзакции из базы данных
    // В текущей реализации Chainalysis API не предоставляет GET эндпоинт для транзакций
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: "NOT_IMPLEMENTED", 
          message: "GET method not implemented for transaction analysis. Use POST to analyze transaction." 
        } 
      },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error in Chainalysis transaction GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error",
        },
      },
      { status: 500 }
    );
  }
}
/**
 * 🔗 Chainalysis Monitor API
 *
 * API эндпоинт для мониторинга адресов через Chainalysis
 */

import { NextRequest, NextResponse } from "next/server";
import { ChainalysisAMLIntegration } from "@/lib/aml-kyc/chainalysis-aml-integration";
import { ChainalysisAsset } from "@/lib/aml-kyc/chainalysis-types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация входных данных
    const { address, asset } = body;
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_ADDRESS", message: "Address is required" } },
        { status: 400 }
      );
    }

    // Создаем интеграцию для мониторинга
    const chainalysisIntegration = new ChainalysisAMLIntegration();
    const result = await chainalysisIntegration.monitorAddress(
      address,
      asset || "SOL"
    );

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Chainalysis monitor API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during address monitoring",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const asset = searchParams.get("asset") as ChainalysisAsset;

    if (!address) {
      return NextResponse.json(
        { success: false, error: { code: "MISSING_ADDRESS", message: "Address parameter is required" } },
        { status: 400 }
      );
    }

    // Создаем интеграцию для мониторинга
    const chainalysisIntegration = new ChainalysisAMLIntegration();
    const result = await chainalysisIntegration.monitorAddress(
      address,
      asset || "SOL"
    );

    return NextResponse.json(
      { success: true, data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Chainalysis monitor GET API:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error during address monitoring",
        },
      },
      { status: 500 }
    );
  }
}
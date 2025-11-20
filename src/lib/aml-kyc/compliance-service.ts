/**
 * 📊 Compliance Service - Regulatory Reporting System
 *
 * Сервис для управления отчетностью и комплаенсом
 * в соответствии с международными стандартами
 */

import {
  AMLKYCEvent,
  AMLKYCEventType,
  AMLRiskLevel,
  ComplianceReport,
  CreateReportRequest,
  ReportStatus,
  ReportType,
  RiskFactor,
  UserRiskAssessment,
} from "./types";

import { formatAmount, generateReportId } from "./utils";

// Импортируем глобальный экземпляр Prisma

export class ComplianceService {
  /**
   * Создание нового отчета комплаенса
   */
  async createReport(request: CreateReportRequest): Promise<{
    success: boolean;
    reportId?: string;
    message?: string;
    errors?: string[];
  }> {
    try {
      // Валидация запроса
      const validationErrors = this.validateReportRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        };
      }

      // Создание отчета
      const report: ComplianceReport = {
        id: generateReportId(),
        type: request.type,
        status: "DRAFT",
        title: request.title,
        description: request.description,
        reportingPeriod: request.reportingPeriod,
        submittedBy: request.data.submittedBy || "system",
        data: request.data,
        attachments: request.attachments || [],
      };

      // Сохранение отчета
      await this.saveReport(report);

      return {
        success: true,
        reportId: report.id,
        message: "Report created successfully",
      };
    } catch (error) {
      console.error("Error creating compliance report:", error);
      return {
        success: false,
        message: "Internal error occurred during report creation",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Получение отчета по ID
   */
  async getReport(reportId: string): Promise<ComplianceReport | null> {
    try {
      const report = await prisma.complianceReport.findUnique({
        where: { id: reportId },
      });

      if (!report) return null;

      return this.mapDbToReport(report);
    } catch (error) {
      console.error("Error fetching report:", error);
      return null;
    }
  }

  /**
   * Получение списка отчетов
   */
  async getReports(
    filters: {
      type?: ReportType;
      status?: ReportStatus;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ComplianceReport[]> {
    try {
      const whereClause: any = {};

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        whereClause.createdAt = {};
        if (filters.startDate) {
          whereClause.createdAt.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereClause.createdAt.lte = new Date(filters.endDate);
        }
      }

      const reports = await prisma.complianceReport.findMany({
        where: whereClause,
        take: filters.limit || 50,
        skip: filters.offset || 0,
        orderBy: { createdAt: "desc" },
      });

      return reports.map((report) => this.mapDbToReport(report));
    } catch (error) {
      console.error("Error fetching reports:", error);
      return [];
    }
  }

  /**
   * Обновление статуса отчета
   */
  async updateReportStatus(
    reportId: string,
    status: ReportStatus,
    reviewedBy?: string,
    notes?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        return {
          success: false,
          message: "Report not found",
        };
      }

      // Обновление отчета
      const updatedReport: ComplianceReport = {
        ...report,
        status,
        reviewedBy,
        reviewedAt: status !== "DRAFT" ? new Date().toISOString() : undefined,
        data: {
          ...report.data,
          notes,
        },
      };

      // Сохранение обновленного отчета
      await this.saveReport(updatedReport);

      return {
        success: true,
        message: `Report status updated to ${status}`,
      };
    } catch (error) {
      console.error("Error updating report status:", error);
      return {
        success: false,
        message: "Internal error occurred during status update",
      };
    }
  }

  /**
   * Создание отчета о подозрительной деятельности (SAR)
   */
  async createSuspiciousActivityReport(data: {
    userId: string;
    walletAddress: string;
    suspiciousTransactions: string[];
    reasons: string[];
    riskLevel: AMLRiskLevel;
    reportedBy: string;
  }): Promise<{ success: boolean; reportId?: string; message?: string }> {
    try {
      const reportData = {
        suspiciousActivity: {
          userId: data.userId,
          walletAddress: data.walletAddress,
          transactions: data.suspiciousTransactions,
          reasons: data.reasons,
          riskLevel: data.riskLevel,
          investigationRequired:
            data.riskLevel === "HIGH" || data.riskLevel === "CRITICAL",
        },
      };

      const reportRequest: CreateReportRequest = {
        type: "SAR",
        title: `Suspicious Activity Report - ${data.walletAddress}`,
        description: `Report for suspicious activity from wallet ${data.walletAddress}`,
        reportingPeriod: {
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 дней назад
          endDate: new Date().toISOString(),
        },
        data: {
          ...reportData,
          submittedBy: data.reportedBy,
        },
      };

      return await this.createReport(reportRequest);
    } catch (error) {
      console.error("Error creating SAR:", error);
      return {
        success: false,
        message: "Internal error occurred during SAR creation",
      };
    }
  }

  /**
   * Создание отчета о крупных транзакциях (CTR)
   */
  async createCurrencyTransactionReport(data: {
    transactions: Array<{
      id: string;
      userId: string;
      walletAddress: string;
      amount: number;
      currency: string;
      timestamp: string;
    }>;
    threshold: number;
    currency: string;
    reportedBy: string;
  }): Promise<{ success: boolean; reportId?: string; message?: string }> {
    try {
      const reportData = {
        currencyTransactions: {
          transactions: data.transactions,
          threshold: data.threshold,
          currency: data.currency,
          totalAmount: data.transactions.reduce(
            (sum, tx) => sum + tx.amount,
            0
          ),
          transactionCount: data.transactions.length,
        },
      };

      const reportRequest: CreateReportRequest = {
        type: "CTR",
        title: `Currency Transaction Report - ${data.currency}`,
        description: `Report for transactions exceeding ${formatAmount(
          data.threshold,
          data.currency
        )}`,
        reportingPeriod: {
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 часа назад
          endDate: new Date().toISOString(),
        },
        data: {
          ...reportData,
          submittedBy: data.reportedBy,
        },
      };

      return await this.createReport(reportRequest);
    } catch (error) {
      console.error("Error creating CTR:", error);
      return {
        success: false,
        message: "Internal error occurred during CTR creation",
      };
    }
  }

  /**
   * Создание годовой оценки рисков
   */
  async createAnnualRiskAssessment(data: {
    year: number;
    totalUsers: number;
    verifiedUsers: number;
    highRiskUsers: number;
    totalTransactions: number;
    flaggedTransactions: number;
    riskFactors: RiskFactor[];
    assessedBy: string;
  }): Promise<{ success: boolean; reportId?: string; message?: string }> {
    try {
      const reportData = {
        riskAssessment: {
          year: data.year,
          userMetrics: {
            total: data.totalUsers,
            verified: data.verifiedUsers,
            verificationRate:
              data.totalUsers > 0
                ? (data.verifiedUsers / data.totalUsers) * 100
                : 0,
            highRisk: data.highRiskUsers,
            highRiskRate:
              data.totalUsers > 0
                ? (data.highRiskUsers / data.totalUsers) * 100
                : 0,
          },
          transactionMetrics: {
            total: data.totalTransactions,
            flagged: data.flaggedTransactions,
            flagRate:
              data.totalTransactions > 0
                ? (data.flaggedTransactions / data.totalTransactions) * 100
                : 0,
          },
          riskFactors: data.riskFactors,
          overallRiskScore: this.calculateOverallRiskScore(data.riskFactors),
        },
      };

      const reportRequest: CreateReportRequest = {
        type: "ANNUAL_RISK_ASSESSMENT",
        title: `Annual Risk Assessment - ${data.year}`,
        description: `Comprehensive risk assessment for the year ${data.year}`,
        reportingPeriod: {
          startDate: new Date(data.year, 0, 1).toISOString(),
          endDate: new Date(data.year, 11, 31).toISOString(),
        },
        data: {
          ...reportData,
          submittedBy: data.assessedBy,
        },
      };

      return await this.createReport(reportRequest);
    } catch (error) {
      console.error("Error creating annual risk assessment:", error);
      return {
        success: false,
        message: "Internal error occurred during risk assessment creation",
      };
    }
  }

  /**
   * Создание оценки риска пользователя
   */
  async createUserRiskAssessment(data: {
    userId: string;
    walletAddress: string;
    factors: RiskFactor[];
    assessedBy: string;
  }): Promise<{ success: boolean; assessmentId?: string; message?: string }> {
    try {
      const overallRiskScore = this.calculateOverallRiskScore(data.factors);
      const riskLevel = this.getRiskLevelFromScore(overallRiskScore);

      const assessment: UserRiskAssessment = {
        id: generateReportId(),
        userId: data.userId,
        walletAddress: data.walletAddress,
        overallRiskScore,
        riskLevel,
        factors: data.factors,
        lastAssessed: new Date().toISOString(),
        nextReviewDate: new Date(
          Date.now() + 90 * 24 * 60 * 60 * 1000
        ).toISOString(), // 90 дней
        assessedBy: data.assessedBy,
      };

      // Сохранение оценки риска
      await this.saveRiskAssessment(assessment);

      return {
        success: true,
        assessmentId: assessment.id,
        message: "User risk assessment created successfully",
      };
    } catch (error) {
      console.error("Error creating user risk assessment:", error);
      return {
        success: false,
        message: "Internal error occurred during risk assessment creation",
      };
    }
  }

  /**
   * Получение оценки риска пользователя
   */
  async getUserRiskAssessment(
    userId: string
  ): Promise<UserRiskAssessment | null> {
    try {
      const assessment = await prisma.userRiskAssessment.findFirst({
        where: { userId },
        orderBy: { lastAssessed: "desc" },
      });

      if (!assessment) return null;

      return this.mapDbToRiskAssessment(assessment);
    } catch (error) {
      console.error("Error fetching user risk assessment:", error);
      return null;
    }
  }

  /**
   * Создание события комплаенса
   */
  async createComplianceEvent(event: {
    type: AMLKYCEventType;
    userId?: string;
    walletAddress?: string;
    data: Record<string, any>;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }): Promise<{ success: boolean; eventId?: string; message?: string }> {
    try {
      const complianceEvent: AMLKYCEvent = {
        id: generateReportId(),
        type: event.type,
        userId: event.userId,
        walletAddress: event.walletAddress,
        timestamp: new Date().toISOString(),
        data: event.data,
        severity: event.severity,
        processed: false,
      };

      // Сохранение события
      await this.saveEvent(complianceEvent);

      return {
        success: true,
        eventId: complianceEvent.id,
        message: "Compliance event created successfully",
      };
    } catch (error) {
      console.error("Error creating compliance event:", error);
      return {
        success: false,
        message: "Internal error occurred during event creation",
      };
    }
  }

  /**
   * Получение событий комплаенса
   */
  async getComplianceEvents(
    filters: {
      type?: AMLKYCEventType;
      userId?: string;
      walletAddress?: string;
      severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AMLKYCEvent[]> {
    try {
      const whereClause: any = {};

      if (filters.type) {
        whereClause.type = filters.type;
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.walletAddress) {
        whereClause.walletAddress = filters.walletAddress;
      }

      if (filters.severity) {
        whereClause.severity = filters.severity;
      }

      if (filters.startDate || filters.endDate) {
        whereClause.timestamp = {};
        if (filters.startDate) {
          whereClause.timestamp.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          whereClause.timestamp.lte = new Date(filters.endDate);
        }
      }

      const events = await prisma.aMLKYCEvent.findMany({
        where: whereClause,
        take: filters.limit || 100,
        skip: filters.offset || 0,
        orderBy: { timestamp: "desc" },
      });

      return events.map((event) => this.mapDbToEvent(event));
    } catch (error) {
      console.error("Error fetching compliance events:", error);
      return [];
    }
  }

  // Приватные методы

  /**
   * Валидация запроса на создание отчета
   */
  private validateReportRequest(request: CreateReportRequest): string[] {
    const errors: string[] = [];

    if (!request.title || request.title.trim() === "") {
      errors.push("Report title is required");
    }

    if (!request.description || request.description.trim() === "") {
      errors.push("Report description is required");
    }

    if (
      !request.reportingPeriod.startDate ||
      !request.reportingPeriod.endDate
    ) {
      errors.push("Reporting period start and end dates are required");
    } else {
      const startDate = new Date(request.reportingPeriod.startDate);
      const endDate = new Date(request.reportingPeriod.endDate);

      if (startDate >= endDate) {
        errors.push("Start date must be before end date");
      }
    }

    if (!request.data || Object.keys(request.data).length === 0) {
      errors.push("Report data is required");
    }

    return errors;
  }

  /**
   * Расчет общего показателя риска на основе факторов
   */
  private calculateOverallRiskScore(factors: RiskFactor[]): number {
    if (factors.length === 0) return 0;

    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
    const weightedScore = factors.reduce(
      (sum, factor) => sum + factor.score * factor.weight,
      0
    );

    return Math.round(weightedScore / totalWeight);
  }

  /**
   * Получение уровня риска на основе оценки
   */
  private getRiskLevelFromScore(score: number): AMLRiskLevel {
    if (score >= 80) return "CRITICAL";
    if (score >= 60) return "HIGH";
    if (score >= 40) return "MEDIUM";
    return "LOW";
  }

  /**
   * Сохранение отчета в базу данных
   */
  private async saveReport(report: ComplianceReport): Promise<void> {
    console.log(`Saving compliance report: ${report.id}`);

    await prisma.complianceReport.upsert({
      where: { id: report.id },
      update: {
        type: report.type,
        status: report.status,
        title: report.title,
        description: report.description,
        reportingPeriod: report.reportingPeriod as any,
        submittedBy: report.submittedBy,
        submittedAt: report.submittedAt ? new Date(report.submittedAt) : null,
        reviewedBy: report.reviewedBy || null,
        reviewedAt: report.reviewedAt ? new Date(report.reviewedAt) : null,
        data: report.data as any,
        attachments: report.attachments || [],
        externalReportId: report.externalReportId || null,
      },
      create: {
        id: report.id,
        type: report.type,
        status: report.status,
        title: report.title,
        description: report.description,
        reportingPeriod: report.reportingPeriod as any,
        submittedBy: report.submittedBy,
        submittedAt: report.submittedAt ? new Date(report.submittedAt) : null,
        reviewedBy: report.reviewedBy || null,
        reviewedAt: report.reviewedAt ? new Date(report.reviewedAt) : null,
        data: report.data as any,
        attachments: report.attachments || [],
        externalReportId: report.externalReportId || null,
      },
    });
  }

  /**
   * Сохранение оценки риска в базу данных
   */
  private async saveRiskAssessment(
    assessment: UserRiskAssessment
  ): Promise<void> {
    console.log(`Saving user risk assessment: ${assessment.id}`);

    await prisma.userRiskAssessment.upsert({
      where: { id: assessment.id },
      update: {
        userId: assessment.userId,
        walletAddress: assessment.walletAddress,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        factors: assessment.factors as any,
        lastAssessed: new Date(assessment.lastAssessed),
        nextReviewDate: new Date(assessment.nextReviewDate),
        assessedBy: assessment.assessedBy,
      },
      create: {
        id: assessment.id,
        userId: assessment.userId,
        walletAddress: assessment.walletAddress,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        factors: assessment.factors as any,
        lastAssessed: new Date(assessment.lastAssessed),
        nextReviewDate: new Date(assessment.nextReviewDate),
        assessedBy: assessment.assessedBy,
      },
    });
  }

  /**
   * Сохранение события в базу данных
   */
  private async saveEvent(event: AMLKYCEvent): Promise<void> {
    console.log(`Saving compliance event: ${event.id}`);

    await prisma.aMLKYCEvent.upsert({
      where: { id: event.id },
      update: {
        type: event.type,
        userId: event.userId || null,
        walletAddress: event.walletAddress || null,
        timestamp: new Date(event.timestamp),
        data: event.data as any,
        severity: event.severity,
        processed: event.processed,
      },
      create: {
        id: event.id,
        type: event.type,
        userId: event.userId || null,
        walletAddress: event.walletAddress || null,
        timestamp: new Date(event.timestamp),
        data: event.data as any,
        severity: event.severity,
        processed: event.processed,
      },
    });
  }

  /**
   * Преобразование данных из базы в ComplianceReport
   */
  private mapDbToReport(dbReport: any): ComplianceReport {
    return {
      id: dbReport.id,
      type: dbReport.type as ReportType,
      status: dbReport.status as ReportStatus,
      title: dbReport.title,
      description: dbReport.description,
      reportingPeriod: dbReport.reportingPeriod,
      submittedBy: dbReport.submittedBy,
      submittedAt: dbReport.submittedAt
        ? dbReport.submittedAt.toISOString()
        : undefined,
      reviewedBy: dbReport.reviewedBy || undefined,
      reviewedAt: dbReport.reviewedAt
        ? dbReport.reviewedAt.toISOString()
        : undefined,
      data: dbReport.data,
      attachments: dbReport.attachments || [],
      externalReportId: dbReport.externalReportId || undefined,
    };
  }

  /**
   * Преобразование данных из базы в UserRiskAssessment
   */
  private mapDbToRiskAssessment(dbAssessment: any): UserRiskAssessment {
    return {
      id: dbAssessment.id,
      userId: dbAssessment.userId,
      walletAddress: dbAssessment.walletAddress,
      overallRiskScore: dbAssessment.overallRiskScore,
      riskLevel: dbAssessment.riskLevel as AMLRiskLevel,
      factors: dbAssessment.factors,
      lastAssessed: dbAssessment.lastAssessed.toISOString(),
      nextReviewDate: dbAssessment.nextReviewDate.toISOString(),
      assessedBy: dbAssessment.assessedBy,
    };
  }

  /**
   * Преобразование данных из базы в AMLKYCEvent
   */
  private mapDbToEvent(dbEvent: any): AMLKYCEvent {
    return {
      id: dbEvent.id,
      type: dbEvent.type as AMLKYCEventType,
      userId: dbEvent.userId || undefined,
      walletAddress: dbEvent.walletAddress || undefined,
      timestamp: dbEvent.timestamp.toISOString(),
      data: dbEvent.data,
      severity: dbEvent.severity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      processed: dbEvent.processed,
    };
  }
}

// Экспорт сервиса
export { ComplianceService };

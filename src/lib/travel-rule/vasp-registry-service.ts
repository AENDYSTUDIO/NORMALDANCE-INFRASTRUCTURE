/**
 * 🏛️ VASP Registry Service
 *
 * Сервис для управления реестром VASP (Virtual Asset Service Providers)
 * и их технической информацией для Travel Rule коммуникации
 */

import { VASPInfo, VASPRegistryEntry } from "./types";
import { generateId } from "../aml-kyc/utils";

export class VASPRegistryService {
  private registryCache: Map<string, VASPRegistryEntry> = new Map();
  private lastCacheUpdate: Date = new Date(0);
  private cacheUpdateInterval: number = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

  constructor() {
    this.initializeRegistry();
  }

  /**
   * Получение информации о VASP по ID
   */
  async getVASPInfo(vaspId: string): Promise<VASPRegistryEntry | null> {
    try {
      // Обновление кэша при необходимости
      await this.updateRegistryCacheIfNeeded();

      const vaspEntry = this.registryCache.get(vaspId);
      return vaspEntry || null;
    } catch (error) {
      console.error("Error getting VASP info:", error);
      return null;
    }
  }

  /**
   * Поиск VASP по имени
   */
  async searchVASPByName(name: string): Promise<VASPRegistryEntry[]> {
    try {
      await this.updateRegistryCacheIfNeeded();

      const results: VASPRegistryEntry[] = [];
      const searchTerms = name.toLowerCase().split(' ');

      for (const [_, vaspEntry] of this.registryCache) {
        const vaspName = vaspEntry.vaspInfo.name.toLowerCase();
        
        // Проверка на совпадение всех поисковых терминов
        const matchesAllTerms = searchTerms.every(term => vaspName.includes(term));
        
        if (matchesAllTerms) {
          results.push(vaspEntry);
        }
      }

      return results.sort((a, b) => {
        // Сортировка по релевантности (точное совпадение имени)
        const aName = a.vaspInfo.name.toLowerCase();
        const bName = b.vaspInfo.name.toLowerCase();
        const searchName = name.toLowerCase();

        if (aName === searchName && bName !== searchName) return -1;
        if (bName === searchName && aName !== searchName) return 1;
        
        return a.vaspInfo.reputation.score - b.vaspInfo.reputation.score;
      });
    } catch (error) {
      console.error("Error searching VASP by name:", error);
      return [];
    }
  }

  /**
   * Поиск VASP по юрисдикции
   */
  async searchVASPByJurisdiction(jurisdiction: string): Promise<VASPRegistryEntry[]> {
    try {
      await this.updateRegistryCacheIfNeeded();

      const results: VASPRegistryEntry[] = [];
      const searchJurisdiction = jurisdiction.toUpperCase();

      for (const [_, vaspEntry] of this.registryCache) {
        if (vaspEntry.vaspInfo.jurisdiction === searchJurisdiction) {
          results.push(vaspEntry);
        }
      }

      return results.sort((a, b) => 
        b.vaspInfo.reputation.score - a.vaspInfo.reputation.score
      );
    } catch (error) {
      console.error("Error searching VASP by jurisdiction:", error);
      return [];
    }
  }

  /**
   * Поиск VASP по типу
   */
  async searchVASPByType(type: string): Promise<VASPRegistryEntry[]> {
    try {
      await this.updateRegistryCacheIfNeeded();

      const results: VASPRegistryEntry[] = [];
      const searchType = type.toUpperCase();

      for (const [_, vaspEntry] of this.registryCache) {
        if (vaspEntry.vaspInfo.type === searchType) {
          results.push(vaspEntry);
        }
      }

      return results.sort((a, b) => 
        b.vaspInfo.reputation.score - a.vaspInfo.reputation.score
      );
    } catch (error) {
      console.error("Error searching VASP by type:", error);
      return [];
    }
  }

  /**
   * Добавление нового VASP в реестр
   */
  async addVASP(vaspInfo: VASPInfo): Promise<VASPRegistryEntry> {
    try {
      const vaspEntry: VASPRegistryEntry = {
        id: generateId("vasp"),
        vaspInfo,
        technicalEndpoints: {
          travelRuleEndpoint: `https://${vaspInfo.name.toLowerCase().replace(/\s+/g, '-')}.com/api/travel-rule`,
          ivms101Endpoint: `https://${vaspInfo.name.toLowerCase().replace(/\s+/g, '-')}.com/api/ivms101`,
          catEndpoint: `https://${vaspInfo.name.toLowerCase().replace(/\s+/g, '-')}.com/api/cat`,
          ofacEndpoint: `https://${vaspInfo.name.toLowerCase().replace(/\s+/g, '-')}.com/api/ofac`,
        },
        supportedProtocols: ["IVMS101", "CAT", "OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 50, // Начальный рейтинг
          reviews: 0,
        },
      };

      this.registryCache.set(vaspEntry.id, vaspEntry);
      await this.saveVASPToDatabase(vaspEntry);

      return vaspEntry;
    } catch (error) {
      console.error("Error adding VASP:", error);
      throw new Error(`Failed to add VASP: ${error}`);
    }
  }

  /**
   * Обновление информации о VASP
   */
  async updateVASP(vaspId: string, updates: Partial<VASPRegistryEntry>): Promise<VASPRegistryEntry | null> {
    try {
      const existingVasp = this.registryCache.get(vaspId);
      if (!existingVasp) {
        return null;
      }

      const updatedVasp: VASPRegistryEntry = {
        ...existingVasp,
        ...updates,
        id: vaspId, // Сохраняем ID
        lastVerified: new Date().toISOString(),
      };

      this.registryCache.set(vaspId, updatedVasp);
      await this.saveVASPToDatabase(updatedVasp);

      return updatedVasp;
    } catch (error) {
      console.error("Error updating VASP:", error);
      throw new Error(`Failed to update VASP: ${error}`);
    }
  }

  /**
   * Обновление репутации VASP
   */
  async updateVASPReputation(
    vaspId: string, 
    reviewScore: number, 
    reviewComment?: string
  ): Promise<VASPRegistryEntry | null> {
    try {
      const existingVasp = this.registryCache.get(vaspId);
      if (!existingVasp) {
        return null;
      }

      const currentReputation = existingVasp.reputation;
      const newReviewsCount = currentReputation.reviews + 1;
      
      // Расчет нового среднего рейтинга
      const newScore = (
        (currentReputation.score * currentReputation.reviews + reviewScore) / 
        newReviewsCount
      );

      const updatedVasp: VASPRegistryEntry = {
        ...existingVasp,
        reputation: {
          score: Math.round(newScore * 100) / 100, // Округление до 2 знаков
          reviews: newReviewsCount,
          lastIncident: reviewScore < 30 ? new Date().toISOString() : currentReputation.lastIncident,
        },
        lastVerified: new Date().toISOString(),
      };

      this.registryCache.set(vaspId, updatedVasp);
      await this.saveVASPToDatabase(updatedVasp);

      return updatedVasp;
    } catch (error) {
      console.error("Error updating VASP reputation:", error);
      throw new Error(`Failed to update VASP reputation: ${error}`);
    }
  }

  /**
   * Получение всех активных VASP
   */
  async getAllActiveVASPs(): Promise<VASPRegistryEntry[]> {
    try {
      await this.updateRegistryCacheIfNeeded();

      const activeVASPs: VASPRegistryEntry[] = [];
      
      for (const [_, vaspEntry] of this.registryCache) {
        if (vaspEntry.status === "ACTIVE") {
          activeVASPs.push(vaspEntry);
        }
      }

      return activeVASPs.sort((a, b) => 
        b.vaspInfo.reputation.score - a.vaspInfo.reputation.score
      );
    } catch (error) {
      console.error("Error getting all active VASPs:", error);
      return [];
    }
  }

  /**
   * Получение статистики реестра
   */
  async getRegistryStatistics(): Promise<{
    totalVASPs: number;
    activeVASPs: number;
    inactiveVASPs: number;
    suspendedVASPs: number;
    averageReputation: number;
    vaspByType: Record<string, number>;
    vaspByJurisdiction: Record<string, number>;
  }> {
    try {
      await this.updateRegistryCacheIfNeeded();

      const stats = {
        totalVASPs: this.registryCache.size,
        activeVASPs: 0,
        inactiveVASPs: 0,
        suspendedVASPs: 0,
        averageReputation: 0,
        vaspByType: {} as Record<string, number>,
        vaspByJurisdiction: {} as Record<string, number>,
      };

      let totalReputation = 0;

      for (const [_, vaspEntry] of this.registryCache) {
        // Подсчет по статусам
        switch (vaspEntry.status) {
          case "ACTIVE":
            stats.activeVASPs++;
            break;
          case "INACTIVE":
            stats.inactiveVASPs++;
            break;
          case "SUSPENDED":
            stats.suspendedVASPs++;
            break;
        }

        // Подсчет по типам
        const type = vaspEntry.vaspInfo.type;
        stats.vaspByType[type] = (stats.vaspByType[type] || 0) + 1;

        // Подсчет по юрисдикциям
        const jurisdiction = vaspEntry.vaspInfo.jurisdiction;
        stats.vaspByJurisdiction[jurisdiction] = (stats.vaspByJurisdiction[jurisdiction] || 0) + 1;

        // Суммирование репутации
        totalReputation += vaspEntry.vaspInfo.reputation.score;
      }

      // Расчет средней репутации
      stats.averageReputation = stats.totalVASPs > 0 
        ? Math.round((totalReputation / stats.totalVASPs) * 100) / 100
        : 0;

      return stats;
    } catch (error) {
      console.error("Error getting registry statistics:", error);
      return {
        totalVASPs: 0,
        activeVASPs: 0,
        inactiveVASPs: 0,
        suspendedVASPs: 0,
        averageReputation: 0,
        vaspByType: {},
        vaspByJurisdiction: {},
      };
    }
  }

  /**
   * Валидация VASP информации
   */
  validateVASPInfo(vaspInfo: VASPInfo): string[] {
    const errors: string[] = [];

    if (!vaspInfo.name || vaspInfo.name.trim() === "") {
      errors.push("VASP name is required");
    }

    if (!vaspInfo.type) {
      errors.push("VASP type is required");
    }

    if (!vaspInfo.jurisdiction || vaspInfo.jurisdiction.length !== 2) {
      errors.push("VASP jurisdiction must be a 2-letter ISO country code");
    }

    if (!vaspInfo.address || !vaspInfo.address.street || !vaspInfo.address.city || !vaspInfo.address.country) {
      errors.push("VASP address is incomplete");
    }

    if (!vaspInfo.contact || !vaspInfo.contact.email) {
      errors.push("VASP contact email is required");
    }

    if (!vaspInfo.regulatoryStatus || !vaspInfo.regulatoryStatus.isRegistered) {
      errors.push("VASP must be registered with regulatory authorities");
    }

    return errors;
  }

  // Приватные методы

  /**
   * Инициализация реестра
   */
  private async initializeRegistry(): Promise<void> {
    try {
      await this.updateRegistryCache();
      console.log("VASP Registry initialized successfully");
    } catch (error) {
      console.error("Error initializing VASP Registry:", error);
    }
  }

  /**
   * Обновление кэша реестра при необходимости
   */
  private async updateRegistryCacheIfNeeded(): Promise<void> {
    const now = new Date();
    if (now.getTime() - this.lastCacheUpdate.getTime() >= this.cacheUpdateInterval) {
      await this.updateRegistryCache();
      this.lastCacheUpdate = now;
    }
  }

  /**
   * Обновление кэша реестра
   */
  private async updateRegistryCache(): Promise<void> {
    try {
      // В реальной системе здесь будет загрузка из базы данных или внешнего реестра
      // Пока используем моковые данные

      const mockVASPs = this.generateMockVASPs();
      
      this.registryCache.clear();
      for (const vasp of mockVASPs) {
        this.registryCache.set(vasp.id, vasp);
      }

      console.log(`VASP Registry cache updated with ${mockVASPs.length} entries`);
    } catch (error) {
      console.error("Error updating VASP Registry cache:", error);
    }
  }

  /**
   * Генерация моковых VASP для разработки
   */
  private generateMockVASPs(): VASPRegistryEntry[] {
    return [
      {
        id: "vasp_001",
        vaspInfo: {
          id: "VASP-001",
          name: "CryptoExchange Pro",
          type: "EXCHANGE",
          registrationNumber: "CEP-2023-001",
          jurisdiction: "US",
          address: {
            street: "123 Blockchain Street",
            city: "San Francisco",
            state: "CA",
            postalCode: "94105",
            country: "US",
          },
          contact: {
            email: "compliance@cryptoexchange.pro",
            phone: "+1-555-0123",
            website: "https://cryptoexchange.pro",
          },
          regulatoryStatus: {
            isRegistered: true,
            licenseNumber: "FINCEN-MSB-12345",
            regulatorName: "FinCEN",
            registrationDate: "2023-01-15",
          },
          technicalContact: {
            name: "Tech Support",
            email: "tech@cryptoexchange.pro",
            phone: "+1-555-0124",
          },
          complianceOfficer: {
            name: "Compliance Officer",
            email: "compliance@cryptoexchange.pro",
            phone: "+1-555-0125",
          },
        },
        technicalEndpoints: {
          travelRuleEndpoint: "https://api.cryptoexchange.pro/travel-rule",
          ivms101Endpoint: "https://api.cryptoexchange.pro/ivms101",
          catEndpoint: "https://api.cryptoexchange.pro/cat",
          ofacEndpoint: "https://api.cryptoexchange.pro/ofac",
        },
        supportedProtocols: ["IVMS101", "CAT", "OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [
          {
            keyId: "enc_key_001",
            algorithm: "AES-256-GCM",
            publicKey: "mock_public_key_001",
            validFrom: "2023-01-01T00:00:00Z",
          },
        ],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 85,
          reviews: 150,
        },
      },
      {
        id: "vasp_002",
        vaspInfo: {
          id: "VASP-002",
          name: "SecureWallet",
          type: "WALLET_PROVIDER",
          registrationNumber: "SW-2023-002",
          jurisdiction: "GB",
          address: {
            street: "456 Crypto Lane",
            city: "London",
            postalCode: "EC1A 1BB",
            country: "GB",
          },
          contact: {
            email: "legal@securewallet.io",
            phone: "+44-20-7123-4567",
            website: "https://securewallet.io",
          },
          regulatoryStatus: {
            isRegistered: true,
            licenseNumber: "FCA-87654321",
            regulatorName: "FCA",
            registrationDate: "2023-03-20",
          },
        },
        technicalEndpoints: {
          travelRuleEndpoint: "https://api.securewallet.io/travel-rule",
          catEndpoint: "https://api.securewallet.io/cat",
        },
        supportedProtocols: ["CAT"],
        supportedFormats: ["JSON"],
        encryptionKeys: [
          {
            keyId: "enc_key_002",
            algorithm: "AES-256-GCM",
            publicKey: "mock_public_key_002",
            validFrom: "2023-02-01T00:00:00Z",
          },
        ],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 78,
          reviews: 89,
        },
      },
      {
        id: "vasp_003",
        vaspInfo: {
          id: "VASP-003",
          name: "NormalDance",
          type: "NFT_MARKETPLACE",
          registrationNumber: "ND-2023-003",
          jurisdiction: "RU",
          address: {
            street: "789 Music Avenue",
            city: "Moscow",
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
        },
        technicalEndpoints: {
          travelRuleEndpoint: "https://api.normaldance.ru/travel-rule",
          ivms101Endpoint: "https://api.normaldance.ru/ivms101",
          catEndpoint: "https://api.normaldance.ru/cat",
          ofacEndpoint: "https://api.normaldance.ru/ofac",
        },
        supportedProtocols: ["IVMS101", "CAT", "OFAC"],
        supportedFormats: ["JSON"],
        encryptionKeys: [
          {
            keyId: "enc_key_003",
            algorithm: "AES-256-GCM",
            publicKey: "mock_public_key_003",
            validFrom: "2023-04-01T00:00:00Z",
          },
        ],
        status: "ACTIVE",
        lastVerified: new Date().toISOString(),
        reputation: {
          score: 92,
          reviews: 234,
        },
      },
    ];
  }

  /**
   * Сохранение VASP в базу данных
   */
  private async saveVASPToDatabase(vaspEntry: VASPRegistryEntry): Promise<void> {
    try {
      // В реальной системе здесь будет сохранение в базу данных
      console.log(`Saving VASP to database: ${vaspEntry.id} - ${vaspEntry.vaspInfo.name}`);
    } catch (error) {
      console.error("Error saving VASP to database:", error);
    }
  }
}

// Экспорт сервиса
export { VASPRegistryService };
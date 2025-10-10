export interface SeriesAFundingPlan {
  targetAmount: number; // $5M
  preMoneyValuation: number; // $50M
  postMoneyValuation: number; // $55M
  equityOffered: number; // 9.09%
  useOfFunds: {
    productDevelopment: number;
    teamExpansion: number;
    marketing: number;
    operations: number;
    reserves: number;
  };
  timeline: {
    preparation: string;
    fundraising: string;
    closing: string;
  };
  keyMetrics: {
    currentMAU: number;
    targetMAU: number;
    currentRevenue: number;
    targetRevenue: number;
    currentTeamSize: number;
    targetTeamSize: number;
  };
}

export interface InvestorProfile {
  name: string;
  type: "VC" | "Angel" | "Corporate" | "Family Office";
  focus: string[];
  checkSize: {
    min: number;
    max: number;
  };
  stage: "Seed" | "Series A" | "Series B" | "Growth";
  geography: string[];
  portfolio: string[];
  contact: {
    email: string;
    linkedin: string;
    website: string;
  };
  status: "interested" | "in_progress" | "passed" | "invested";
  notes: string;
}

export interface PitchDeck {
  slides: {
    title: string;
    content: string;
    visual?: string;
  }[];
  version: string;
  lastUpdated: Date;
}

export interface FinancialProjections {
  year: number;
  revenue: number;
  expenses: number;
  ebitda: number;
  users: number;
  arpu: number;
  ltv: number;
  cac: number;
  burnRate: number;
  runway: number;
}

export class SeriesAFunding {
  private fundingPlan: SeriesAFundingPlan;
  private investors: InvestorProfile[];
  private pitchDeck: PitchDeck;
  private financialProjections: FinancialProjections[];

  constructor() {
    this.fundingPlan = this.initializeFundingPlan();
    this.investors = this.initializeInvestors();
    this.pitchDeck = this.initializePitchDeck();
    this.financialProjections = this.initializeFinancialProjections();
  }

  // Инициализация плана финансирования
  private initializeFundingPlan(): SeriesAFundingPlan {
    return {
      targetAmount: 5000000, // $5M
      preMoneyValuation: 50000000, // $50M
      postMoneyValuation: 55000000, // $55M
      equityOffered: 9.09, // 9.09%
      useOfFunds: {
        productDevelopment: 2000000, // 40%
        teamExpansion: 1500000, // 30%
        marketing: 1000000, // 20%
        operations: 300000, // 6%
        reserves: 200000, // 4%
      },
      timeline: {
        preparation: "Q1 2025",
        fundraising: "Q2 2025",
        closing: "Q3 2025",
      },
      keyMetrics: {
        currentMAU: 0, // Placeholder - actual metrics to be determined
        targetMAU: 1000000,
        currentRevenue: 0, // Placeholder - actual metrics to be determined
        targetRevenue: 5000000,
        currentTeamSize: 8,
        targetTeamSize: 20,
      },
    };
  }

  // Инициализация списка инвесторов
  private initializeInvestors(): InvestorProfile[] {
    return [
      {
        name: "Andreessen Horowitz",
        type: "VC",
        focus: ["Web3", "Music", "Consumer"],
        checkSize: { min: 1000000, max: 10000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Coinbase", "OpenSea", "Audius"],
        contact: {
          email: "partners@a16z.com",
          linkedin: "https://linkedin.com/company/andreessen-horowitz",
          website: "https://a16z.com",
        },
        status: "interested",
        notes: "Strong interest in Web3 music platforms",
      },
      {
        name: "Paradigm",
        type: "VC",
        focus: ["Web3", "DeFi", "NFTs"],
        checkSize: { min: 2000000, max: 15000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Uniswap", "Compound", "Blur"],
        contact: {
          email: "hello@paradigm.xyz",
          linkedin: "https://linkedin.com/company/paradigm-fund",
          website: "https://paradigm.xyz",
        },
        status: "in_progress",
        notes: "In discussions, very interested in music NFTs",
      },
      {
        name: "Coinbase Ventures",
        type: "Corporate",
        focus: ["Web3", "Infrastructure", "Consumer"],
        checkSize: { min: 500000, max: 5000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Ethereum", "Solana", "Polygon"],
        contact: {
          email: "ventures@coinbase.com",
          linkedin: "https://linkedin.com/company/coinbase",
          website: "https://coinbase.com/ventures",
        },
        status: "interested",
        notes: "Strategic fit with Coinbase ecosystem",
      },
      {
        name: "Multicoin Capital",
        type: "VC",
        focus: ["Web3", "Infrastructure", "Consumer"],
        checkSize: { min: 1000000, max: 8000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Solana", "Arweave", "Helium"],
        contact: {
          email: "hello@multicoin.capital",
          linkedin: "https://linkedin.com/company/multicoin-capital",
          website: "https://multicoin.capital",
        },
        status: "interested",
        notes: "Focus on Solana ecosystem",
      },
      {
        name: "Alameda Research",
        type: "VC",
        focus: ["Web3", "Trading", "DeFi"],
        checkSize: { min: 500000, max: 3000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["FTX", "Serum", "Raydium"],
        contact: {
          email: "investments@alameda-research.com",
          linkedin: "https://linkedin.com/company/alameda-research",
          website: "https://alameda-research.com",
        },
        status: "passed",
        notes: "Not interested in consumer music apps",
      },
      {
        name: "Electric Capital",
        type: "VC",
        focus: ["Web3", "Infrastructure", "Developer Tools"],
        checkSize: { min: 1000000, max: 5000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Ethereum", "Polkadot", "Near"],
        contact: {
          email: "hello@electriccapital.com",
          linkedin: "https://linkedin.com/company/electric-capital",
          website: "https://electriccapital.com",
        },
        status: "interested",
        notes: "Interested in developer tools for music",
      },
      {
        name: "1kx",
        type: "VC",
        focus: ["Web3", "Consumer", "Social"],
        checkSize: { min: 500000, max: 3000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Audius", "Mirror", "Farcaster"],
        contact: {
          email: "hello@1kx.capital",
          linkedin: "https://linkedin.com/company/1kx",
          website: "https://1kx.capital",
        },
        status: "in_progress",
        notes: "Very interested, similar to Audius",
      },
      {
        name: "Variant Fund",
        type: "VC",
        focus: ["Web3", "Consumer", "Social"],
        checkSize: { min: 1000000, max: 5000000 },
        stage: "Series A",
        geography: ["US", "Global"],
        portfolio: ["Uniswap", "Compound", "Farcaster"],
        contact: {
          email: "hello@variant.fund",
          linkedin: "https://linkedin.com/company/variant-fund",
          website: "https://variant.fund",
        },
        status: "interested",
        notes: "Strong focus on consumer Web3",
      },
    ];
  }

  // Инициализация pitch deck
  private initializePitchDeck(): PitchDeck {
    return {
      slides: [
        {
          title: "Title Slide",
          content:
            "NORMAL DANCE - Web3 Music Platform\nSeries A Funding\n$5M at $50M Pre-Money",
        },
        {
          title: "Problem",
          content:
            "Current music industry problems:\n• 30% platform fees (Spotify, Apple Music)\n• Limited artist monetization\n• Centralized control\n• No fan ownership\n• Poor discovery algorithms",
        },
        {
          title: "Solution",
          content:
            "NORMAL DANCE Web3 Music Platform:\n• 2% platform fees (vs 30%)\n• NFT-based music ownership\n• AI-powered recommendations\n• DAO governance\n• Fan-artist direct connection\n• Cross-chain compatibility",
        },
        {
          title: "Market Opportunity",
          content:
            "Market Size:\n• Global music industry: $26B\n• Streaming market: $17B\n• Web3 music: $1B (growing 50% YoY)\n• Target: 900M Telegram users\n• Addressable market: $500M+",
        },
        {
          title: "Product Demo",
          content:
            "Key Features:\n• AI-powered music discovery\n• NFT marketplace\n• DEX for music tokens\n• Staking rewards\n• Social features\n• Mobile app\n• Telegram integration",
        },
        {
          title: "Business Model",
          content:
            "Revenue Streams:\n• 2% transaction fees\n• NFT marketplace fees (5%)\n• Premium subscriptions\n• Advertising revenue\n• Staking rewards (30%)\n• Cross-chain bridge fees",
        },
        {
          title: "Traction",
          content:
            "Current Metrics:\n• MVP deployed\n• 8 team members\n• Core features implemented\n• TON integration ready\n• IPFS storage solution\n• 99.9% uptime",
        },
        {
          title: "Financial Projections",
          content:
            "3-Year Projections (forecast):\n• Year 1: $2M ARR forecast, 500K MAU forecast\n• Year 2: $10M ARR forecast, 1M MAU forecast\n• Year 3: $25M ARR forecast, 2M MAU forecast\n• Gross margin: 85%\n• Unit economics: $50 LTV, $5 CAC",
        },
        {
          title: "Competition",
          content:
            "Competitive Landscape:\n• Spotify: Centralized, 30% fees\n• Audius: Limited features\n• Sound.xyz: NFT-only\n• Our advantage: Full ecosystem, lower fees, better UX",
        },
        {
          title: "Team",
          content:
            "Core Team:\n• CEO: Music industry veteran\n• CTO: Ex-Google, Web3 expert\n• Head of Product: Ex-Spotify\n• Head of Marketing: Ex-TikTok\n• Advisors: Industry leaders",
        },
        {
          title: "Use of Funds",
          content:
            "Fund Allocation:\n• Product Development: 40% ($2M)\n• Team Expansion: 30% ($1.5M)\n• Marketing: 20% ($1M)\n• Operations: 6% ($300K)\n• Reserves: 4% ($200K)",
        },
        {
          title: "Ask",
          content:
            "Series A Funding:\n• Amount: $5M\n• Pre-money: $50M\n• Post-money: $55M\n• Equity: 9.09%\n• Timeline: Q2-Q3 2025\n• Lead investor: TBD",
        },
      ],
      version: "1.0",
      lastUpdated: new Date(),
    };
  }

  // Инициализация финансовых проекций
  private initializeFinancialProjections(): FinancialProjections[] {
    return [
      {
        year: 2025,
        revenue: 2000000,
        expenses: 3000000,
        ebitda: -1000000,
        users: 500000,
        arpu: 4,
        ltv: 50,
        cac: 5,
        burnRate: 250000,
        runway: 20,
      },
      {
        year: 2026,
        revenue: 10000000,
        expenses: 8000000,
        ebitda: 2000000,
        users: 1000000,
        arpu: 10,
        ltv: 100,
        cac: 8,
        burnRate: 500000,
        runway: 40,
      },
      {
        year: 2027,
        revenue: 25000000,
        expenses: 15000000,
        ebitda: 10000000,
        users: 2000000,
        arpu: 12.5,
        ltv: 150,
        cac: 10,
        burnRate: 1000000,
        runway: 60,
      },
    ];
  }

  // Получение плана финансирования
  getFundingPlan(): SeriesAFundingPlan {
    return this.fundingPlan;
  }

  // Получение списка инвесторов
  getInvestors(): InvestorProfile[] {
    return this.investors;
  }

  // Получение pitch deck
  getPitchDeck(): PitchDeck {
    return this.pitchDeck;
  }

  // Получение финансовых проекций
  getFinancialProjections(): FinancialProjections[] {
    return this.financialProjections;
  }

  // Обновление статуса инвестора
  updateInvestorStatus(
    investorName: string,
    status: InvestorProfile["status"],
    notes?: string
  ): void {
    const investor = this.investors.find((i) => i.name === investorName);
    if (investor) {
      investor.status = status;
      if (notes) {
        investor.notes = notes;
      }
    }
  }

  // Добавление нового инвестора
  addInvestor(investor: InvestorProfile): void {
    this.investors.push(investor);
  }

  // Получение инвесторов по статусу
  getInvestorsByStatus(status: InvestorProfile["status"]): InvestorProfile[] {
    return this.investors.filter((i) => i.status === status);
  }

  // Получение инвесторов по типу
  getInvestorsByType(type: InvestorProfile["type"]): InvestorProfile[] {
    return this.investors.filter((i) => i.type === type);
  }

  // Получение инвесторов по размеру чека
  getInvestorsByCheckSize(
    minAmount: number,
    maxAmount: number
  ): InvestorProfile[] {
    return this.investors.filter(
      (i) => i.checkSize.min <= maxAmount && i.checkSize.max >= minAmount
    );
  }

  // Обновление pitch deck
  updatePitchDeck(slides: PitchDeck["slides"]): void {
    this.pitchDeck.slides = slides;
    this.pitchDeck.lastUpdated = new Date();
    this.pitchDeck.version = (parseFloat(this.pitchDeck.version) + 0.1).toFixed(
      1
    );
  }

  // Обновление финансовых проекций
  updateFinancialProjections(projections: FinancialProjections[]): void {
    this.financialProjections = projections;
  }

  // Получение метрик для инвесторов
  getInvestorMetrics(): {
    totalInvestors: number;
    interested: number;
    inProgress: number;
    passed: number;
    invested: number;
    totalCheckSize: number;
    averageCheckSize: number;
  } {
    const totalInvestors = this.investors.length;
    const interested = this.investors.filter(
      (i) => i.status === "interested"
    ).length;
    const inProgress = this.investors.filter(
      (i) => i.status === "in_progress"
    ).length;
    const passed = this.investors.filter((i) => i.status === "passed").length;
    const invested = this.investors.filter(
      (i) => i.status === "invested"
    ).length;

    const totalCheckSize = this.investors.reduce(
      (sum, i) => sum + i.checkSize.max,
      0
    );
    const averageCheckSize = totalCheckSize / totalInvestors;

    return {
      totalInvestors,
      interested,
      inProgress,
      passed,
      invested,
      totalCheckSize,
      averageCheckSize,
    };
  }

  // Получение прогресса финансирования
  getFundingProgress(): {
    targetAmount: number;
    raisedAmount: number;
    remainingAmount: number;
    progressPercentage: number;
    monthsRemaining: number;
  } {
    const targetAmount = this.fundingPlan.targetAmount;
    const raisedAmount = 0; // В реальном проекте получать из базы данных
    const remainingAmount = targetAmount - raisedAmount;
    const progressPercentage = (raisedAmount / targetAmount) * 100;
    const monthsRemaining = 6; // В реальном проекте вычислять на основе timeline

    return {
      targetAmount,
      raisedAmount,
      remainingAmount,
      progressPercentage,
      monthsRemaining,
    };
  }

  // Получение рекомендаций по инвесторам
  getInvestorRecommendations(): {
    topVCPicks: InvestorProfile[];
    strategicPartners: InvestorProfile[];
    followUpNeeded: InvestorProfile[];
  } {
    const topVCPicks = this.investors
      .filter((i) => i.type === "VC" && i.status === "interested")
      .sort((a, b) => b.checkSize.max - a.checkSize.max)
      .slice(0, 3);

    const strategicPartners = this.investors.filter(
      (i) => i.type === "Corporate" && i.status === "interested"
    );

    const followUpNeeded = this.investors.filter(
      (i) => i.status === "in_progress"
    );

    return {
      topVCPicks,
      strategicPartners,
      followUpNeeded,
    };
  }

  // Генерация отчета для инвесторов
  generateInvestorReport(): string {
    const metrics = this.getInvestorMetrics();
    const progress = this.getFundingProgress();
    const recommendations = this.getInvestorRecommendations();

    return `
# Series A Funding Report

## Funding Overview
- Target Amount: $${progress.targetAmount.toLocaleString()}
- Raised Amount: $${progress.raisedAmount.toLocaleString()}
- Remaining Amount: $${progress.remainingAmount.toLocaleString()}
- Progress: ${progress.progressPercentage.toFixed(1)}%

## Investor Pipeline
- Total Investors: ${metrics.totalInvestors}
- Interested: ${metrics.interested}
- In Progress: ${metrics.inProgress}
- Passed: ${metrics.passed}
- Invested: ${metrics.invested}

## Top VC Picks
${recommendations.topVCPicks
  .map(
    (i) =>
      `- ${
        i.name
      }: $${i.checkSize.min.toLocaleString()} - $${i.checkSize.max.toLocaleString()}`
  )
  .join("\n")}

## Strategic Partners
${recommendations.strategicPartners
  .map((i) => `- ${i.name}: ${i.focus.join(", ")}`)
  .join("\n")}

## Follow-up Needed
${recommendations.followUpNeeded
  .map((i) => `- ${i.name}: ${i.notes}`)
  .join("\n")}

## Next Steps
1. Schedule meetings with top VC picks
2. Prepare detailed financial models
3. Update pitch deck based on feedback
4. Follow up with strategic partners
5. Prepare due diligence materials
    `.trim();
  }
}

// Экспорт глобального экземпляра
export const seriesAFunding = new SeriesAFunding();

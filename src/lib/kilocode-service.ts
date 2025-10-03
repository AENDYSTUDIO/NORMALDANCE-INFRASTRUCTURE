import kiloCodeConfig from "./kilocode-config";

interface CodeMetrics {
  id: string;
  loc: number; // Lines of Code
  sloc: number; // Source Lines of Code
  cloc: number; // Comment Lines of Code
  complexity: number;
  maintainability: number;
  bugsEstimate: number;
}

class KiloCodeService {
  async analyzeMetrics(code: string): Promise<CodeMetrics> {
    if (!kiloCodeConfig.enabled) {
      throw new Error("KiloCode service is disabled");
    }

    // В реальной реализации здесь будет вызов API KiloCode
    // Для демонстрации возвращаем mock результат
    return {
      id: this.generateId(code),
      loc: this.countLines(code),
      sloc: this.countSourceLines(code),
      cloc: this.countCommentLines(code),
      complexity: this.calculateComplexity(code),
      maintainability: this.calculateMaintainability(code),
      bugsEstimate: this.estimateBugs(code),
    };
  }

  private generateId(code: string): string {
    // Генерируем ID на основе хеша кода
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Преобразуем в 32-битное целое
    }
    return Math.abs(hash).toString(16);
  }

  private countLines(code: string): number {
    return code.split("\n").length;
  }

  private countSourceLines(code: string): number {
    const lines = code.split("\n");
    return lines.filter(
      (line) => line.trim() !== "" && !this.isCommentLine(line)
    ).length;
  }

  private countCommentLines(code: string): number {
    const lines = code.split("\n");
    return lines.filter((line) => this.isCommentLine(line)).length;
  }

  private isCommentLine(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("*/")
    );
  }

  private calculateComplexity(code: string): number {
    // Упрощенный расчет сложности кода
    const ifCount = (code.match(/if\s*\(/g) || []).length;
    const forCount = (code.match(/for\s*\(/g) || []).length;
    const whileCount = (code.match(/while\s*\(/g) || []).length;
    const switchCount = (code.match(/switch\s*\(/g) || []).length;

    // Базовая метрика цикломатической сложности
    return 1 + ifCount + forCount + whileCount + switchCount + switchCount;
  }

  private calculateMaintainability(code: string): number {
    // Упрощенный расчет поддерживаемости (0-100)
    const complexity = this.calculateComplexity(code);
    const loc = this.countSourceLines(code);

    // Чем выше сложность и LOC, тем ниже поддерживаемость
    let maintainability = 100;
    maintainability -= Math.min(complexity * 2, 50); // Сложность влияет максимум на 50 баллов
    maintainability -= Math.min(loc * 0.1, 30); // LOC влияет максимум на 30 баллов

    return Math.max(maintainability, 0); // Не меньше 0
  }

  private estimateBugs(code: string): number {
    // Грубая оценка количества потенциальных багов
    // По эмпирической формуле: 1 баг на 10-20 строк сложного кода
    const complexity = this.calculateComplexity(code);
    const sloc = this.countSourceLines(code);

    // Более сложный код имеет больше потенциальных багов
    const baseBugs = sloc / 20; // 1 баг на 20 строк
    const complexityFactor = 1 + complexity / 10; // Увеличиваем в зависимости от сложности

    return Math.round(baseBugs * complexityFactor);
  }
}

export default new KiloCodeService();

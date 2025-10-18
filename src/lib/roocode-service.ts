import rooCodeConfig from "./roocode-config";

interface CodeAnalysis {
  id: string;
  code: string;
  language: string;
  patterns: string[];
  functions: string[];
  complexity: number;
}

class RooCodeService {
  async analyzeCode(
    code: string,
    language: string = "typescript"
  ): Promise<CodeAnalysis> {
    if (!rooCodeConfig.enabled) {
      throw new Error("RooCode service is disabled");
    }

    // В реальной реализации здесь будет вызов API RooCode
    // Для демонстрации возвращаем mock результат
    return {
      id: this.generateId(code),
      code,
      language,
      patterns: this.extractPatterns(code),
      functions: this.extractFunctions(code, language),
      complexity: this.calculateComplexity(code),
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

  private extractPatterns(code: string): string[] {
    // Извлекаем паттерны из кода (упрощенная реализация)
    const patterns: string[] = [];

    // Простой пример: ищем паттерны проектирования
    if (code.includes("class") && code.includes("getInstance")) {
      patterns.push("Singleton");
    }
    if (code.includes("interface") || code.includes("abstract class")) {
      patterns.push("Strategy");
    }
    if (code.includes("extends") || code.includes("implements")) {
      patterns.push("Inheritance");
    }

    return patterns;
  }

  private extractFunctions(code: string, language: string): string[] {
    const functions: string[] = [];

    if (language === "typescript" || language === "javascript") {
      // Регулярное выражение для поиска функций
      const functionRegex =
        /(?:export\s+|async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
      let match;
      while ((match = functionRegex.exec(code)) !== null) {
        functions.push(match[1]);
      }

      // Ищем стрелочные функции
      const arrowFunctionRegex =
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
      while ((match = arrowFunctionRegex.exec(code)) !== null) {
        functions.push(match[1]);
      }
    }

    return functions;
  }

  private calculateComplexity(code: string): number {
    // Упрощенный расчет сложности кода
    const lines = code.split("\n").filter((line) => line.trim() !== "");
    const ifCount = (code.match(/if\s*\(/g) || []).length;
    const forCount = (code.match(/for\s*\(/g) || []).length;
    const whileCount = (code.match(/while\s*\(/g) || []).length;
    const switchCount = (code.match(/switch\s*\(/g) || []).length;

    // Базовая метрика цикломатической сложности
    return 1 + ifCount + forCount + whileCount + switchCount + switchCount;
  }
}

export default new RooCodeService();

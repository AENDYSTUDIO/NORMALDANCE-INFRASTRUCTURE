import fs from "fs/promises";
import path from "path";
import kiloCodeService from "./kilocode-service";
import qdrantService from "./qdrant-service";
import rooCodeService from "./roocode-service";

// Интерфейс для результата анализа кода
interface CodeAnalysisResult {
  id: string;
  filePath: string;
  content: string;
  language: string;
  functions: string[];
  classes: string[];
  comments: string[];
  rooCodeAnalysis?: any; // Результаты анализа от RooCode
  kiloCodeMetrics?: any; // Метрики от KiloCode
}

class CodeEmbeddings {
  private supportedExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".py",
    ".go",
    ".rs",
    ".sol",
  ];

  async indexCodebase(projectPath: string = "src") {
    try {
      await qdrantService.initCollection();
      const files = await this.getAllCodeFiles(projectPath);

      console.log(`Найдено ${files.length} файлов для индексации`);

      for (const file of files) {
        try {
          const analysis = await this.analyzeCodeFile(file);
          await this.indexCodeFile(analysis);
          console.log(`Индексация завершена для: ${file}`);
        } catch (error) {
          console.error(`Ошибка при индексации файла ${file}:`, error);
        }
      }

      console.log("Индексация кодовой базы завершена");
    } catch (error) {
      console.error("Ошибка при индексации кодовой базы:", error);
      throw error;
    }
  }

  private async getAllCodeFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        files = [...files, ...(await this.getAllCodeFiles(fullPath))];
      } else if (this.supportedExtensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async analyzeCodeFile(filePath: string): Promise<CodeAnalysisResult> {
    const content = await fs.readFile(filePath, "utf-8");
    const language = this.getLanguageFromExtension(path.extname(filePath));

    // Извлекаем функции, классы и комментарии
    const functions = this.extractFunctions(content, language);
    const classes = this.extractClasses(content, language);
    const comments = this.extractComments(content);

    // Анализируем код с помощью RooCode
    let rooCodeAnalysis;
    try {
      rooCodeAnalysis = await rooCodeService.analyzeCode(content, language);
    } catch (error) {
      console.error(
        `Ошибка при анализе файла ${filePath} с помощью RooCode:`,
        error
      );
    }

    // Получаем метрики кода с помощью KiloCode
    let kiloCodeMetrics;
    try {
      kiloCodeMetrics = await kiloCodeService.analyzeMetrics(content);
    } catch (error) {
      console.error(
        `Ошибка при получении метрик файла ${filePath} с помощью KiloCode:`,
        error
      );
    }

    return {
      id: this.generateId(filePath),
      filePath,
      content,
      language,
      functions,
      classes,
      comments,
      rooCodeAnalysis,
      kiloCodeMetrics,
    };
  }

  private getLanguageFromExtension(ext: string): string {
    const map: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".py": "python",
      ".go": "go",
      ".rs": "rust",
      ".sol": "solidity",
    };

    return map[ext] || "unknown";
  }

  private extractFunctions(content: string, language: string): string[] {
    let functions: string[] = [];

    if (language === "typescript" || language === "javascript") {
      // Регулярное выражение для поиска функций в TypeScript/JavaScript
      const functionRegex =
        /(export\s+)?(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{/g;
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        functions.push(match[3]);
      }

      // Также ищем стрелочные функции
      const arrowFunctionRegex =
        /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(async\s*)?\([^)]*\)\s*=>/g;
      while ((match = arrowFunctionRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }
    } else if (language === "python") {
      const functionRegex = /def\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\):/g;
      let match;
      while ((match = functionRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }

    return functions;
  }

  private extractClasses(content: string, language: string): string[] {
    let classes: string[] = [];

    if (language === "typescript" || language === "javascript") {
      const classRegex = /export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*{/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
      }
    } else if (language === "python") {
      const classRegex = /class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:\(]/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
      }
    }

    return classes;
  }

  private extractComments(content: string): string[] {
    const commentRegex = /\/\/\s*(.+?)\s*$|\/\*\*?[\s\S]*?\*\//gm;
    const comments: string[] = [];
    let match;

    while ((match = commentRegex.exec(content)) !== null) {
      const comment = match[1] || match[0];
      if (comment.trim()) {
        comments.push(comment.trim());
      }
    }

    return comments;
  }

  private generateId(filePath: string): string {
    // Генерируем ID на основе пути файла
    return Buffer.from(filePath).toString("base64").replace(/[+/=]/g, "");
  }

  private async indexCodeFile(analysis: CodeAnalysisResult) {
    // Создаем векторное представление кода (в реальной реализации здесь будет вызов
    // API для генерации embeddings)
    const vector = await this.generateEmbedding(analysis);

    // Формируем контент для индексации
    const content = [
      analysis.content,
      ...analysis.functions,
      ...analysis.classes,
      ...analysis.comments,
    ].join(" ");

    await qdrantService.addDocument({
      id: analysis.id,
      content,
      metadata: {
        filePath: analysis.filePath,
        language: analysis.language,
        functions: analysis.functions,
        classes: analysis.classes,
        comments: analysis.comments,
        rooCodeAnalysis: analysis.rooCodeAnalysis,
        kiloCodeMetrics: analysis.kiloCodeMetrics,
      },
      vector,
    });
  }

  private async generateEmbedding(
    analysis: CodeAnalysisResult
  ): Promise<number[]> {
    // В реальной реализации здесь будет вызов API для генерации embeddings
    // для упрощения возвращаем случайный вектор
    return Array(512)
      .fill(0)
      .map(() => Math.random());
  }

  async searchCode(query: string, limit: number = 5) {
    // В реальной реализации здесь будет вызов API для генерации embeddings
    // из текстового запроса, но для упрощения используем заглушку
    const queryVector = Array(512)
      .fill(0)
      .map(() => Math.random());

    const results = await qdrantService.searchDocuments(queryVector, limit);

    return results.map((result) => ({
      id: result.id,
      filePath: (result.payload?.metadata as any)?.filePath || "",
      content: result.payload?.content || "",
      score: result.score,
    }));
  }
}

export default new CodeEmbeddings();

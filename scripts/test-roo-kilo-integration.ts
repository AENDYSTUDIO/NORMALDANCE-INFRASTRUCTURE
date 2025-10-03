import codeEmbeddings from "../src/lib/code-embeddings";
import kiloCodeService from "../src/lib/kilocode-service";
import rooCodeService from "../src/lib/roocode-service";

async function testIntegration() {
  console.log("Тестируем интеграцию с RooCode и KiloCode...");

  // Пример кода для тестирования
  const sampleCode = `
    export class UserService {
      private users: User[] = [];

      async getUser(id: string): Promise<User> {
        return this.users.find(user => user.id === id);
      }

      async createUser(userData: User): Promise<User> {
        const user = { ...userData, id: this.generateId() };
        this.users.push(user);
        return user;
      }

      private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
      }
    }

    // Комментарий: Этот класс управляет пользователями
    // Еще один комментарий
  `;

  try {
    // Тестируем анализ с помощью RooCode
    console.log("\n--- Тестирование RooCode ---");
    const rooCodeResult = await rooCodeService.analyzeCode(
      sampleCode,
      "typescript"
    );
    console.log(
      "Результаты анализа RooCode:",
      JSON.stringify(rooCodeResult, null, 2)
    );

    // Тестируем анализ метрик с помощью KiloCode
    console.log("\n--- Тестирование KiloCode ---");
    const kiloCodeResult = await kiloCodeService.analyzeMetrics(sampleCode);
    console.log("Метрики KiloCode:", JSON.stringify(kiloCodeResult, null, 2));

    // Тестируем полный анализ через codeEmbeddings
    console.log("\n--- Тестирование полного анализа ---");
    const mockAnalysis = await (codeEmbeddings as any).analyzeCodeFile(
      "test.ts"
    );
    console.log(
      "Полный анализ:",
      JSON.stringify(
        {
          functions: mockAnalysis.functions,
          classes: mockAnalysis.classes,
          comments: mockAnalysis.comments,
          rooCodeAnalysis: mockAnalysis.rooCodeAnalysis,
          kiloCodeMetrics: mockAnalysis.kiloCodeMetrics,
        },
        null,
        2
      )
    );

    console.log("\n--- Интеграция работает корректно ---");
  } catch (error) {
    console.error("Ошибка при тестировании интеграции:", error);
    process.exit(1);
  }
}

// Запускаем тестирование
testIntegration();

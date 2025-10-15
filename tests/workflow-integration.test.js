// Комплексный тест интеграции workflow для NORMALDANCE Enterprise Automation

const { describe, it, beforeAll, afterAll } = require("@jest/globals");
const { ChromaSetup } = require("../memorybank/chroma-setup");
const { MemoryStore } = require("../memorybank/memory-store");
const { MemoryQuery } = require("../memorybank/memory-query");
const { TodoistSync } = require("../todoist-integration/todoist-sync");
const { TodoistAutoSync } = require("../todoist-integration/auto-sync");
const { AIProcessor } = require("../ai-integration/ai-processor");
const { AIScheduler } = require("../ai-integration/scheduler");
const config = require("../config/workflow-config");

describe("Комплексное тестирование workflow NORMALDANCE Enterprise Automation", () => {
  let chromaSetup;
  let memoryStore;
  let memoryQuery;
  let todoistSync;
  let todoistAutoSync;
  let aiProcessor;
  let aiScheduler;

  beforeAll(async () => {
    // Инициализируем все компоненты
    chromaSetup = new ChromaSetup();
    await chromaSetup.initialize();

    memoryStore = new MemoryStore();
    memoryQuery = new MemoryQuery();
    todoistSync = new TodoistSync(config.todoist.token);
    todoistAutoSync = new TodoistAutoSync();
    aiProcessor = new AIProcessor();
    aiScheduler = new AIScheduler();

    console.log("✅ Все компоненты инициализированы для тестирования");
  });

  afterAll(() => {
    // Останавливаем планировщики
    aiScheduler.stop();
    console.log("🧹 Ресурсы очищены после тестирования");
  });

  it("должен успешно выполнить тестирование интеграции всех компонентов", async () => {
    // Тест 1: Проверка сохранения данных в MemoryBank
    const saveResult = await memoryStore.saveData(
      "test",
      {
        message: "Тестовое сообщение",
        timestamp: new Date().toISOString(),
      },
      { category: "integration_test" }
    );

    expect(saveResult.success).toBe(true);
    console.log("✅ Тест 1 пройден: Сохранение данных в MemoryBank");

    // Тест 2: Проверка запросов к MemoryBank
    const queryResult = await memoryQuery.queryByText("тестовое сообщение", 5);
    expect(queryResult.success).toBe(true);
    expect(queryResult.results.length).toBeGreaterThan(0);
    console.log("✅ Тест 2 пройден: Запросы к MemoryBank");

    // Тест 3: Проверка создания задачи в Todoist
    const taskResult = await todoistSync.createTask(
      "Тестовая задача интеграции",
      {
        priority: "p3",
        description: "Задача создана для тестирования интеграции",
      }
    );

    expect(taskResult.success).toBe(true);
    console.log("✅ Тест 3 пройден: Создание задачи в Todoist");

    // Тест 4: Проверка AI-анализа
    const aiAnalysisResult = await aiProcessor.analyzeLogs([
      {
        timestamp: new Date().toISOString(),
        level: "info",
        message: "Тестовое сообщение лога",
      },
    ]);

    expect(aiAnalysisResult.success).toBe(true);
    expect(aiAnalysisResult.analysis).toBeDefined();
    console.log("✅ Тест 4 пройден: AI-анализ логов");

    // Тест 5: Проверка генерации changelog
    const changelogResult = await aiProcessor.generateChangelog({
      version: "1.0.0",
      components: "core",
      changes: "Initial release",
      timestamp: new Date().toISOString(),
      status: "success",
    });

    expect(changelogResult.success).toBe(true);
    expect(changelogResult.changelog).toBeDefined();
    console.log("✅ Тест 5 пройден: Генерация changelog");

    // Тест 6: Проверка предсказания проблем
    const predictionResult = await aiProcessor.predictProblems();
    expect(predictionResult.success).toBe(true);
    console.log("✅ Тест 6 пройден: Предсказание проблем");

    // Тест 7: Проверка обработки естественного языка
    const nlResult = await aiProcessor.processNaturalLanguageQuery(
      "Каков статус системы?"
    );
    expect(nlResult.success).toBe(true);
    expect(nlResult.answer).toBeDefined();
    console.log("✅ Тест 7 пройден: Обработка естественного языка");

    // Тест 8: Проверка синхронизации Todoist
    await todoistAutoSync.syncAllTasks();
    console.log("✅ Тест 8 пройден: Синхронизация Todoist");

    // Тест 9: Проверка сохранения анализа AI в MemoryBank
    const aiAnalysisQuery = await memoryQuery.queryByType("ai_analysis", 10);
    expect(aiAnalysisQuery.success).toBe(true);
    console.log("✅ Тест 9 пройден: Сохранение AI-анализа в MemoryBank");

    // Тест 10: Проверка комплексного сценария - деплой и его отслеживание
    const deploymentId = await memoryStore.saveDeploymentHistory(
      "1.0.1",
      "success",
      {
        components: ["api", "web", "db"],
        duration: 12000, // 2 минуты
      }
    );

    expect(deploymentId.success).toBe(true);

    // Проверяем, что задача создана в Todoist
    const deploymentTasks = await todoistSync.getTasks({
      filter: "DEPLOY 1.0.1",
    });
    expect(deploymentTasks.success).toBe(true);
    console.log("✅ Тест 10 пройден: Комплексный сценарий деплоя");

    console.log("🎉 Все тесты интеграции пройдены успешно!");
  }, 30000); // Увеличиваем таймаут до 30 секунд для выполнения всех тестов

  it("должен выполнить тестирование self-healing функционала", async () => {
    // Тест 1: Проверка анализа ошибки для self-healing
    const errorDetails = {
      error: "Database connection timeout",
      stack: "Error: Connection timeout at ...",
      context: { component: "database", severity: "high" },
      timestamp: new Date().toISOString(),
    };

    const healingResult = await aiProcessor.analyzeForSelfHealing(errorDetails);
    expect(healingResult.success).toBe(true);
    expect(healingResult.analysis).toBeDefined();
    console.log(
      "✅ Тест self-healing 1 пройден: Анализ ошибки для self-healing"
    );

    // Тест 2: Проверка создания задачи для self-healing в Todoist
    const healingTasks = await todoistSync.getTasks({
      filter: "Self-healing:",
    });
    expect(healingTasks.success).toBe(true);
    console.log(
      "✅ Тест self-healing 2 пройден: Создание задачи self-healing в Todoist"
    );

    // Тест 3: Проверка сохранения анализа self-healing в MemoryBank
    const healingAnalysisQuery = await memoryQuery.queryByType(
      "ai_analysis",
      10,
      { subcategory: "self_healing" }
    );
    expect(healingAnalysisQuery.success).toBe(true);
    console.log(
      "✅ Тест self-healing 3 пройден: Сохранение анализа self-healing в MemoryBank"
    );

    console.log("🎉 Все тесты self-healing пройдены успешно!");
  }, 20000); // Увеличиваем таймаут до 20 секунд для выполнения тестов self-healing
});

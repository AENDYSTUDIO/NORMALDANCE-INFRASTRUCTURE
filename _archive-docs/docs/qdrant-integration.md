# Интеграция Qdrant с кодовой базой

## Обзор

Этот документ описывает интеграцию векторной базы данных Qdrant с кодовой базой проекта NORMALDANCE. Интеграция позволяет выполнять семантический поиск по исходному коду, находить релевантные фрагменты кода и улучшать навигацию по проекту.

## Архитектура

### Файлы интеграции

- `src/lib/qdrant-config.ts` - Конфигурация подключения к Qdrant
- `src/lib/qdrant-service.ts` - Основной сервис для работы с Qdrant
- `src/lib/code-embeddings.ts` - Утилита для анализа кодовой базы и генерации эмбеддингов
- `src/lib/roocode-config.ts` - Конфигурация подключения к RooCode
- `src/lib/roocode-service.ts` - Сервис для анализа кода с помощью RooCode
- `src/lib/kilocode-config.ts` - Конфигурация подключения к KiloCode
- `src/lib/kilocode-service.ts` - Сервис для метрик кода с помощью KiloCode
- `src/app/api/qdrant/index-codebase/route.ts` - API маршрут для индексации кодовой базы
- `src/app/api/qdrant/search-code/route.ts` - API маршрут для поиска по кодовой базе

## Установка и настройка

### Зависимости

```bash
npm install @qdrant/js-client-rest
```

### Конфигурация

Подключение к облачному экземпляру Qdrant:

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || "https://your-qdrant-instance.com",
  port: parseInt(process.env.QDRANT_PORT || "6333"),
  apiKey: process.env.QDRANT_API_KEY || "your-qdrant-api-key",
});
```

## Анализ кода с RooCode и KiloCode

### RooCode

RooCode - это система для глубокого анализа структуры кода, поиска паттернов проектирования, выявления сложных функций и оценки архитектурных решений.

Конфигурация:

```typescript
interface RooCodeConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  timeout: number;
}
```

### KiloCode

KiloCode - это система для измерения метрик кода, включая количество строк, сложность, поддерживаемость и оценку потенциальных багов.

Конфигурация:

```typescript
interface KiloCodeConfig {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  timeout: number;
}
```

## API Маршруты

### Индексация кодовой базы

**POST** `/api/qdrant/index-codebase`

Индексирует кодовую базу проекта в векторную базу данных Qdrant.

#### Параметры запроса

- `projectPath` (опционально, по умолчанию 'src'): Путь к директории с исходным кодом для индексации

#### Пример запроса

```json
{
  "projectPath": "src"
}
```

#### Пример ответа

```json
{
  "success": true,
  "message": "Кодовая база из src успешно проиндексирована"
}
```

### Поиск по кодовой базе

**POST** `/api/qdrant/search-code`

Выполняет семантический поиск по проиндексированной кодовой базе.

#### Параметры запроса

- `query` (обязательно): Поисковый запрос
- `limit` (опционально, по умолчанию 5): Количество результатов

#### Пример запроса

```json
{
  "query": "как работает система аутентификации",
  "limit": 5
}
```

#### Пример ответа

```json
{
  "success": true,
  "results": [
    {
      "id": "c3JjL2F1dGgvdXNlci1zZXJ2aWNlLnRz",
      "filePath": "src/auth/user-service.ts",
      "content": "// Сервис для работы с пользователями...",
      "score": 0.95,
      "rooCodeAnalysis": {
        "patterns": ["Strategy", "Inheritance"],
        "complexity": 3
      },
      "kiloCodeMetrics": {
        "loc": 150,
        "sloc": 10,
        "cloc": 25,
        "complexity": 5,
        "maintainability": 78,
        "bugsEstimate": 2
      }
    }
  ]
}
```

## Функциональность

### Анализ кода

Система автоматически извлекает следующие элементы из файлов исходного кода:

- Функции
- Классы
- Комментарии
- Структура кода
- Язык программирования
- Паттерны проектирования (с помощью RooCode)
- Метрики кода (с помощью KiloCode)

### Поддерживаемые языки

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Go (.go)
- Rust (.rs)
- Solidity (.sol)

### Векторизация

Каждый файл кода преобразуется в векторное представление для хранения в Qdrant. В реальной реализации используется модель машинного обучения для генерации эмбеддингов кода.

## Использование

### Индексация кодовой базы

Для индексации всей кодовой базы выполните:

```bash
curl -X POST http://localhost:3000/api/qdrant/index-codebase \
  -H "Content-Type: application/json" \
 -d '{"projectPath": "src"}'
```

### Поиск по коду

Для поиска по кодовой базе:

```bash
curl -X POST http://localhost:3000/api/qdrant/search-code \
  -H "Content-Type: application/json" \
  -d '{"query": "аутентификация пользователей", "limit": 5}'
```

## Безопасность

- API ключ для Qdrant хранится в конфигурационном файле
- Все API маршруты защищены и требуют аутентификации в продакшене
- Индексация происходит асинхронно для предотвращения перегрузки сервера

## Мониторинг и отладка

Система логирует все операции с Qdrant для отладки и мониторинга производительности.

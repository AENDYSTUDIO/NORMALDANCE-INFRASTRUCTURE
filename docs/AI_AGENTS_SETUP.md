# AI Агенты для NORMALDANCE Enterprise

## Установка расширений

Для работы с AI агентами установите следующие расширения для VS Code:

```bash
# Установка основного агента
code --install-extension roocode.roocode      # Roo code

# Установка ассистента кода
code --install-extension kilocode.kilocode    # kilocode
```

## Конфигурация агентов

Агенты настроены через файлы в директории `.vscode/`:

- `ai-agents.json` - основная конфигурация агентов
- `agent-prompts.json` - системные промпты и примеры

## Использование агентов

### Roo code (Enterprise Web3 + AI development assistant)

Используйте для задач, связанных с:

- Web3 разработкой (Solana, TON)
- Архитектурой приложения
- Интеграцией AI
- Безопасностью и аудитом
- Производительностью

Примеры использования:

```typescript
// @roocode: Create a wallet connection component for Solana and TON
// @roocode: Implement deflationary token model
// @roocode: Optimize database queries for music metadata
```

### kilocode (Code generation and optimization assistant)

Используйте для задач:

- Генерации кода
- Оптимизации производительности
- Рефакторинга
- Документирования

Примеры использования:

```typescript
// @kilocode: Create API route for user profile management
// @kilocode: Optimize image loading component
// @kilocode: Refactor authentication service
```

## Структура проекта для агентов

- `.roo/` - конфигурации и правила для архитектурных агентов
- `.kilocodemodes` - настройки режимов для kilocode агента
- `AGENTS.md` - проектные правила и инструкции

## Правила взаимодействия

1. Используйте префиксы `@roocode:` или `@roo:` для основного агента
2. Используйте префиксы `@kilocode:` или `@kilo:` для ассистента кода
3. Следуйте инструкциям в `AGENTS.md` для проектных соглашений
4. Учитывайте специфику проекта (Web3, deflationary model, Solana/TON интеграция)

## Триггеры и контекст

Агенты активируются в любом типе файлов и имеют доступ к:

- Полной структуре проекта
- Git истории
- Web3 контексту (Solana, TON)
- AI интеграциям
- Базе данных и API

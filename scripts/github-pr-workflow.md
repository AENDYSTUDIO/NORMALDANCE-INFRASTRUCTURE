# GitHub PR Workflow Scripts

Этот документ описывает скрипты для работы с GitHub Pull Requests в проекте NORMALDANCE.

## Доступные скрипты

### Git Flow Workflow

- **`npm run workflow:feature <name>`** - Создать feature ветку и показать инструкции
- **`npm run workflow:hotfix <name>`** - Создать hotfix ветку и показать инструкции
- **`npm run workflow:promote`** - Продвинуть изменения dev→staging→main и очистить

### Управление ветками

- **`npm run git:feature:create <name>`** - Создать feature ветку
- **`npm run git:hotfix:create <name>`** - Создать hotfix ветку
- **`npm run git:dev:update`** - Обновить development из main
- **`npm run git:staging:update`** - Обновить staging из development
- **`npm run git:main:update`** - Обновить main из staging
- **`npm run git:promote:dev-to-staging`** - Продвинуть development → staging
- **`npm run git:promote:staging-to-main`** - Продвинуть staging → main
- **`npm run git:cleanup:merged`** - Очистить слитые feature ветки
- **`npm run git:status`** - Показать статус Git и веток
- **`npm run git:sync:all`** - Синхронизировать все ветки

### Создание и управление PR

- **`npm run pr:create`** - Создать новый PR с автозаполнением
- **`npm run pr:ready`** - Отметить PR как готовый к ревью
- **`npm run pr:draft`** - Отметить PR как черновик
- **`npm run pr:close`** - Закрыть PR
- **`npm run pr:reopen`** - Переоткрыть закрытый PR

### Просмотр и информация

- **`npm run pr:status`** - Показать статус ваших PR
- **`npm run pr:list`** - Список последних 20 открытых PR
- **`npm run pr:list:all`** - Список всех PR (открытых и закрытых)
- **`npm run pr:view`** - Просмотреть детали PR
- **`npm run pr:diff`** - Показать diff PR
- **`npm run pr:checks`** - Показать статус проверок CI/CD

### Работа с ветками

- **`npm run pr:checkout`** - Переключиться на ветку PR
- **`npm run pr:clean`** - Удалить слитые ветки

### Слияние PR

- **`npm run pr:merge`** - Слить PR с merge commit (сохраняет историю)
- **`npm run pr:merge:squash`** - Слить PR с squash (все коммиты в один)
- **`npm run pr:merge:rebase`** - Слить PR с rebase
- **`npm run pr:auto-merge`** - Автоматически слить PR, если все проверки пройдены

### Ревью и комментарии

- **`npm run pr:review`** - Оставить ревью на PR
- **`npm run pr:comment`** - Добавить комментарий к PR

### Управление метаданными

- **`npm run pr:assign`** - Назначить ответственного
- **`npm run pr:unassign`** - Снять назначение
- **`npm run pr:label:add`** - Добавить лейбл
- **`npm run pr:label:remove`** - Удалить лейбл
- **`npm run pr:milestone`** - Установить milestone

### Управление секретами GitHub

- **`npm run github:secrets:set <name> <value>`** - Установить секрет
- **`npm run github:secrets:get <name>`** - Получить информацию о секрете
- **`npm run github:secrets:list`** - Список всех секретов
- **`npm run github:secrets:delete <name>`** - Удалить секрет
- **`npm run github:secrets:env-import`** - Импортировать секреты из .env файла
- **`npm run github:secrets:backup`** - Создать бэкап секретов
- **`npm run github:secrets:sync`** - Синхронизировать секреты между репозиториями
- **`npm run github:secrets:rotate`** - Ротировать значения секретов
- **`npm run github:secrets:validate`** - Проверить конфигурацию секретов

## Примеры использования

### Создание PR

```bash
# Создать ветку для фичи
git checkout -b feature/new-music-player

# Сделать изменения и коммиты
# ...

# Отправить ветку в GitHub
git push origin feature/new-music-player

# Создать PR
npm run pr:create
```

### Ревью PR

```bash
# Посмотреть список PR
npm run pr:list

# Переключиться на ветку PR для тестирования
npm run pr:checkout

# Посмотреть изменения
npm run pr:diff

# Оставить ревью
npm run pr:review
```

### Слияние PR

```bash
# Проверить статус проверок
npm run pr:checks

# Слить PR (выбрать подходящий метод)
npm run pr:merge:squash  # Для маленьких PR
npm run pr:merge         # Для больших PR с важной историей

# Очистить слитые ветки
npm run pr:clean
```

## Настройка GitHub CLI

Для работы скриптов требуется настроенный GitHub CLI:

```bash
# Установка
npm install -g @github/cli

# Авторизация
gh auth login

# Проверить статус
gh auth status
```

## Полезные комбинации

### Ежедневный workflow разработчика

```bash
# Утро: проверить статус своих PR
npm run pr:status

# Проверить входящие PR для ревью
npm run pr:list

# Перед обедом: почистить слитые ветки
npm run pr:clean
```

### Workflow code review

```bash
# Выбрать PR для ревью
npm run pr:list

# Переключиться на ветку
npm run pr:checkout 123

# Посмотреть изменения
npm run pr:diff

# Проверить проверки
npm run pr:checks

# Оставить комментарий или approve
npm run pr:comment
npm run pr:review
```

### Git Flow Workflow

```bash
# 1. Создание feature ветки
npm run workflow:feature add-monitoring

# 2. Работа и коммиты...
# ... изменения в коде ...

# 3. Создание PR в development
npm run pr:create

# 4. После слияния - продвижение в staging
npm run git:promote:dev-to-staging

# 5. Финальное продвижение в production
npm run git:promote:staging-to-main

# 6. Очистка слитых веток
npm run git:cleanup:merged
```

### Hotfix Workflow

```bash
# 1. Создание hotfix ветки от main
npm run workflow:hotfix security-patch

# 2. Срочные исправления...
# ... критические изменения ...

# 3. Создание PR напрямую в main
npm run pr:create --base main

# 4. После слияния - обновление staging
npm run git:promote:staging-to-main
```

### Управление ветками

```bash
# Проверить статус всех веток
npm run git:status

# Синхронизировать все ветки
npm run git:sync:all

# Очистить слитые feature ветки
npm run git:cleanup:merged

# Полное продвижение (dev → staging → main)
npm run workflow:promote
```

### Управление секретами

```bash
# Установить секрет
npm run github:secrets:set AWS_ACCESS_KEY_ID AKIAIOSFODNN7EXAMPLE

# Импортировать секреты из .env файла
npm run github:secrets:env-import .env.production

# Импортировать секреты для конкретного environment
npm run github:secrets:env-import .env.staging --env staging

# Посмотреть список секретов
npm run github:secrets:list

# Создать бэкап секретов
npm run github:secrets:backup

# Проверить конфигурацию секретов
npm run github:secrets:validate

# Ротировать секрет (сгенерировать новое значение)
npm run github:secrets:rotate DATABASE_PASSWORD

# Синхронизировать секреты между репозиториями
npm run github:secrets:sync AENDYSTUDIO/normaldance-main AENDYSTUDIO/normaldance-infra
```

### Release workflow

```bash
# Проверить все открытые PR перед релизом
npm run pr:list:all

# Автоматически слить подходящие PR
npm run pr:auto-merge

# Почистить после релиза
npm run pr:clean
```

## Безопасность

- Все скрипты используют `--delete-branch=false` по умолчанию для безопасности
- Автоматическое слияние только для PR с пройденными проверками
- Рекомендуется проверять изменения перед слиянием

## Troubleshooting

### Ошибка авторизации

```bash
gh auth login
```

### PR не найден

```bash
# Проверить номер PR
npm run pr:list
npm run pr:view 123
```

### Конфликты при слиянии

```bash
# Переключиться на ветку PR
npm run pr:checkout 123

# Разрешить конфликты вручную
# ...

# Продолжить слияние
npm run pr:merge
```

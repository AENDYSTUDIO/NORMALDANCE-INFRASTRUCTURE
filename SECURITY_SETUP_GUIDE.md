# Руководство по настройке безопасности для NormalDance

## Обзор

Это руководство описывает пошаговый процесс настройки инструментов безопасности для предотвращения утечек секретов в проекте NormalDance.

## Предварительные требования

- Node.js 18+
- Git
- Доступ к репозиторию проекта

## Шаг 1: Установка инструментов безопасности

### 1.1 Установка зависимостей

```bash
# Устанавливаем необходимые пакеты
npm install --save-dev gitleaks trufflehog detect-secrets

# Или глобально
npm install -g gitleaks trufflehog detect-secrets
```

### 1.2 Настройка прав доступа к скриптам

```bash
# Делаем скрипты исполняемыми
chmod +x scripts/security-scan.js
chmod +x scripts/pre-commit-hook.js
chmod +x scripts/check-hardcoded-secrets.js
```

## Шаг 2: Настройка Pre-commit хуков

### 2.1 Установка хука

```bash
# Создаем директорию для хуков
mkdir -p .git/hooks

# Копируем хук
cp scripts/pre-commit-hook.js .git/hooks/pre-commit

# Делаем хук исполняемым
chmod +x .git/hooks/pre-commit
```

### 2.2 Альтернативный способ через Husky

```bash
# Устанавливаем Husky
npm install --save-dev husky

# Инициализируем Husky
npx husky install

# Добавляем pre-commit хук
npx husky add .husky/pre-commit "node scripts/pre-commit-hook.js"
```

### 2.3 Проверка работы хука

```bash
# Тестируем хук
node scripts/pre-commit-hook.js

# Или создаем тестовый файл с секретом
echo "API_KEY=secret123" > test-secret.txt
git add test-secret.txt
git commit -m "test commit with secret"
# Хук должен заблокировать коммит
```

## Шаг 3: Настройка CI/CD интеграции

### 3.1 GitHub Actions

Создайте файл `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run security scan
        run: node scripts/security-scan.js --directory . --verbose

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          config-path: ".gitleaks.toml"

      - name: Run TruffleHog
        run: |
          pip install trufflehog
          trufflehog --regex --entropy=False ./

      - name: Upload scan results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-scan-results
          path: security-report.json
```

### 3.2 GitLab CI/CD

Добавьте в `.gitlab-ci.yml`:

```yaml
security-scan:
  stage: test
  image: node:18

  before_script:
    - npm ci

  script:
    - node scripts/security-scan.js --directory . --verbose
    - pip install trufflehog
    - trufflehog --regex --entropy=False ./

  artifacts:
    reports:
      junit: security-report.xml
    paths:
      - security-report.json

  only:
    - merge_requests
    - main
    - develop
```

## Шаг 4: Настройка конфигурационных файлов

### 4.1 .gitleaks.toml

```toml
title = "Gitleaks Configuration"

# Расширения файлов для сканирования
[[rules]]
description = "GitHub Token"
id = "github-token"
regex = '''ghp_[a-zA-Z0-9]{36}'''
keywords = ["ghp_"]

[[rules]]
description = "AWS Access Key"
id = "aws-access-key"
regex = '''AKIA[0-9A-Z]{16}'''
keywords = ["AKIA"]

[[rules]]
description = "Private Key"
id = "private-key"
regex = '''-----BEGIN [A-Z]+ PRIVATE KEY-----'''
keywords = ["BEGIN PRIVATE KEY"]

# Исключения
[allowlist]
paths = [
  '''\.git''',
  '''node_modules''',
  '''\.env\.example''',
  '''test''',
  '''tests'''
]

# Исключения по коммитам
[allowlist.commits]
["f5649c23", "d6c4b5e6"]

# Исключения по авторам
[allowlist.authors]
["john.doe@example.com"]
```

### 4.2 .detect-secrets.json

```json
{
  "plugins_used": [
    {
      "name": "AWSKeyDetector"
    },
    {
      "name": "Base64HighEntropyString"
    },
    {
      "name": "BasicAuthDetector"
    },
    {
      "name": "PrivateKeyDetector"
    }
  ],
  "filters_used": [
    {
      "path": "detect_secrets.filters.common.is_likely_test_string"
    }
  ],
  "exclude_files": [
    ".*\\.env$",
    ".*\\.env\\.example$",
    "node_modules/.*",
    "test/.*",
    "tests/.*"
  ],
  "exclude_lines": ["import.*", "from.*import.*", "require.*"]
}
```

## Шаг 5: Настройка переменных окружения

### 5.1 Создание .env.example

```bash
# Создаем шаблон переменных окружения
cat > .env.example << EOF
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PRIVATE_KEY=your_private_key_here

# API Keys
API_KEY=your_api_key_here
JWT_SECRET=your_jwt_secret_here

# External Services
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
EOF
```

### 5.2 Обновление .gitignore

```bash
# Добавляем в .gitignore
echo "
# Environment files
.env
.env.local
.env.development
.env.production
.env.test

# Security files
*.pem
*.key
*.p12
*.pfx
private/
secrets/
" >> .gitignore
```

## Шаг 6: Настройка мониторинга

### 6.1 Настройка алертов

```bash
# Создаем скрипт для алертов
cat > scripts/security-alerts.js << 'EOF'
#!/usr/bin/env node

/**
 * Скрипт для отправки алертов о проблемах безопасности
 */

import { execSync } from 'child_process';

async function sendAlert(severity, message, details = {}) {
  const webhookUrl = process.env.SECURITY_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log('Webhook URL не настроен');
    return;
  }

  const payload = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    details
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('Алерт отправлен успешно');
  } catch (error) {
    console.error('Ошибка отправки алерта:', error.message);
  }
}

// Пример использования
await sendAlert('critical', 'Обнаружен приватный ключ в коде', {
  file: 'src/config.js',
  line: 42,
  repository: 'normaldance'
});
EOF

chmod +x scripts/security-alerts.js
```

### 6.2 Настройка регулярного сканирования

```bash
# Добавляем в package.json
npm pkg set scripts.security-scan="node scripts/security-scan.js"
npm pkg set scripts.security-alert="node scripts/security-alerts.js"

# Создаем cron задачу для регулярного сканирования
echo "0 2 * * * cd /path/to/project && npm run security-scan" | crontab -
```

## Шаг 7: Обучение команды

### 7.1 Проведение тренинга

Создайте презентацию или документ с темами:

- Основы управления секретами
- Использование инструментов безопасности
- Процедуры при утечке секретов
- Лучшие практики разработки

### 7.2 Создание чек-листа

```markdown
# Чек-лист безопасности перед коммитом

- [ ] Проверил, что в коде нет секретов
- [ ] Убедился, что .env файлы не добавлены в коммит
- [ ] Проверил, что нет merge конфликтов
- [ ] Убедился, что файлы имеют правильные права доступа
- [ ] Протестировал изменения в безопасной среде
- [ ] Проверил, что не добавлены большие файлы
```

## Шаг 8: Тестирование настройки

### 8.1 Тестирование сканера

```bash
# Запускаем сканер
node scripts/security-scan.js --directory . --verbose

# Проверяем результаты
# Должны быть обнаружены проблемы в тестовых файлах
```

### 8.2 Тестирование pre-commit хука

```bash
# Создаем тестовый файл с секретом
echo "const API_KEY = 'secret123';" > test.js

# Пытаемся закоммитить
git add test.js
git commit -m "test commit"
# Хук должен заблокировать коммит

# Удаляем тестовый файл
rm test.js
git reset HEAD test.js
```

### 8.3 Тестирование CI/CD

```bash
# Создаем pull request с тестовыми данными
git checkout -b test-security
echo "const SECRET = 'test';" > test-secret.js
git add test-secret.js
git commit -m "test security scan"
git push origin test-security

# Создаем PR и проверяем результаты сканирования
```

## Шаг 9: Поддержание и обновление

### 9.1 Регулярное обновление

```bash
# Обновляем инструменты безопасности
npm update gitleaks trufflehog detect-secrets

# Обновляем паттерны сканирования
# Регулярно проверяем и обновляем правила
```

### 9.2 Аудит конфигурации

```bash
# Проверяем конфигурацию
node scripts/security-scan.js --help

# Проверяем хуки
ls -la .git/hooks/

# Проверяем CI/CD
# Просматриваем логи выполнения
```

## Решение проблем

### Частые проблемы

1. **Хук не выполняется**

   - Проверьте права доступа: `chmod +x .git/hooks/pre-commit`
   - Убедитесь, что хук установлен правильно

2. **Ложные срабатывания**

   - Добавьте исключения в конфигурационные файлы
   - Обновите паттерны для исключения тестовых данных

3. **Сканирование слишком медленное**

   - Исключите ненужные директории
   - Используйте кэширование в CI/CD

4. **CI/CD не работает**
   - Проверьте права доступа к репозиторию
   - Убедитесь, что все зависимости установлены

### Получение помощи

- Документация инструментов: [ссылки на документацию]
- Сообщество: [ссылки на сообщества]
- Внутренняя поддержка: [контакты команды безопасности]

## Заключение

Следование этому руководству поможет обеспечить высокий уровень безопасности проекта и предотвратить утечки секретов. Регулярное обновление и поддержка инструментов безопасности - ключ к надежной защите данных.

Помните, что безопасность - это процесс, а не разовое действие. Регулярно проверяйте и обновляйте настройки безопасности.

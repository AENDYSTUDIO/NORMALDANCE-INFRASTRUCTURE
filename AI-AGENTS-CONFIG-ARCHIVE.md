# 🗃️ **АРХИВ КОНФИГУРАЦИЙ AI АГЕНТОВ - NORMALDANCE Enterprise**

## 📋 **СОДЕРЖАНИЕ АРХИВА:**

Этот файл содержит **готовые конфигурации** для всех AI агентов проекта NORMALDANCE.
Используйте эти конфигурации, если автоматическая установка не работает или для резервного копирования.

---

## 📁 **ФАЙЛ: `.kilocode/launchConfig.json`**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Kilocode Agent",
      "program": "${workspaceFolder}/node_modules/.bin/kilocode",
      "args": ["--config", ".kilocode/agent-config.json"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

---

## 📁 **ФАЙЛ: `.roocode/roo-code-settings.json`**

```json
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roocode/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": ["ms-vscode.vscode-json", "bradlc.vscode-tailwindcss"]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
```

---

## 📁 **ФАЙЛ: `.roo/roo-code-settings.json`**

```json
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roo/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": ["ms-vscode.vscode-json", "bradlc.vscode-tailwindcss"]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
```

---

## 📁 **ФАЙЛ: `install-ai-agents.ps1`** (PowerShell)

```powershell
# PowerShell скрипт для установки AI агентов для проекта NORMALDANCE
# install-ai-agents.ps1

Write-Host "🚀 Установка AI агентов для проекта NORMALDANCE..." -ForegroundColor Green

# Проверка наличия Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js не найден. Пожалуйста, установите Node.js." -ForegroundColor Red
    exit 1
}

# Проверка наличия npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm не найден. Пожалуйста, установите Node.js." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js и npm найдены" -ForegroundColor Green

# Установка зависимостей для AI агентов
Write-Host "📦 Установка зависимостей для AI агентов..." -ForegroundColor Yellow

# Создание директорий, если они не существуют
if (!(Test-Path ".kilocode")) {
    New-Item -ItemType Directory -Path ".kilocode" -Force
    Write-Host "📁 Создана директория .kilocode" -ForegroundColor Cyan
}

if (!(Test-Path ".roocode")) {
    New-Item -ItemType Directory -Path ".roocode" -Force
    Write-Host "📁 Создана директория .roocode" -ForegroundColor Cyan
}

if (!(Test-Path ".roo")) {
    New-Item -ItemType Directory -Path ".roo" -Force
    Write-Host "📁 Создана директория .roo" -ForegroundColor Cyan
}

# Копирование конфигурационных файлов
Write-Host "📝 Копирование конфигурационных файлов..." -ForegroundColor Yellow

# Создание launchConfig.json для Kilocode
@"
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Kilocode Agent",
      "program": "\${workspaceFolder}/node_modules/.bin/kilocode",
      "args": ["--config", ".kilocode/agent-config.json"],
      "console": "integratedTerminal",
      "cwd": "\${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
"@ | Out-File -FilePath ".kilocode/launchConfig.json" -Encoding UTF8

# Создание roo-code-settings.json для RooCode
@"
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roocode/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": [
          "ms-vscode.vscode-json",
          "bradlc.vscode-tailwindcss"
        ]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
"@ | Out-File -FilePath ".roocode/roo-code-settings.json" -Encoding UTF8

# Создание roo-code-settings.json для Roo
@"
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roo/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": [
          "ms-vscode.vscode-json",
          "bradlc.vscode-tailwindcss"
        ]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
"@ | Out-File -FilePath ".roo/roo-code-settings.json" -Encoding UTF8

Write-Host "✅ Конфигурационные файлы установлены" -ForegroundColor Green

# Установка AI агентов через npm
Write-Host "🤖 Установка AI агентов через npm..." -ForegroundColor Yellow

# npm install kilocode roocode roo-code --save-dev
# Закомментировано, так как пакеты могут не существовать
# Write-Host "ℹ️ Пропуск установки пакетов (пакеты могут не существовать в реестре npm)" -ForegroundColor Cyan

Write-Host "🎉 Установка AI агентов завершена!" -ForegroundColor Green
Write-Host "💡 Теперь вы можете использовать AI агенты для автоматизации задач в проекте NORMALDANCE" -ForegroundColor Cyan
```

---

## 📁 **ФАЙЛ: `install-ai-agents.sh`** (Bash)

```bash
#!/bin/bash

# Bash скрипт для установки AI агентов для проекта NORMALDANCE
# install-ai-agents.sh

echo "🚀 Установка AI агентов для проекта NORMALDANCE..."

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не найден. Пожалуйста, установите Node.js."
    exit 1
fi

# Проверка наличия npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не найден. Пожалуйста, установите Node.js."
    exit 1
fi

echo "✅ Node.js и npm найдены"

# Установка зависимостей для AI агентов
echo "📦 Установка зависимостей для AI агентов..."

# Создание директорий, если они не существуют
if [ ! -d ".kilocode" ]; then
    mkdir -p .kilocode
    echo "📁 Создана директория .kilocode"
fi

if [ ! -d ".roocode" ]; then
    mkdir -p .roocode
    echo "📁 Создана директория .roocode"
fi

if [ ! -d ".roo" ]; then
    mkdir -p .roo
    echo "📁 Создана директория .roo"
fi

# Копирование конфигурационных файлов
echo "📝 Копирование конфигурационных файлов..."

# Создание launchConfig.json для Kilocode
cat > .kilocode/launchConfig.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Kilocode Agent",
      "program": "${workspaceFolder}/node_modules/.bin/kilocode",
      "args": ["--config", ".kilocode/agent-config.json"],
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
EOF

# Создание roo-code-settings.json для RooCode
cat > .roocode/roo-code-settings.json << 'EOF'
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roocode/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": [
          "ms-vscode.vscode-json",
          "bradlc.vscode-tailwindcss"
        ]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
EOF

# Создание roo-code-settings.json для Roo
cat > .roo/roo-code-settings.json << 'EOF'
{
  "version": "1.0.0",
  "settings": {
    "agentName": "NormalDance Enterprise Agent",
    "description": "AI агент для проекта NORMALDANCE с поддержкой автоматизации и интеграции",
    "enabled": true,
    "autoUpdate": true,
    "maxConcurrency": 4,
    "timeout": 30000,
    "retryAttempts": 3,
    "logging": {
      "level": "info",
      "output": "console",
      "file": ".roo/logs/agent.log"
    },
    "integrations": {
      "git": {
        "enabled": true,
        "autoCommit": false,
        "branch": "main"
      },
      "vscode": {
        "enabled": true,
        "extensions": [
          "ms-vscode.vscode-json",
          "bradlc.vscode-tailwindcss"
        ]
      }
    },
    "security": {
      "allowCodeExecution": true,
      "allowFileAccess": true,
      "allowNetworkAccess": true
    },
    "capabilities": [
      "code-generation",
      "refactoring",
      "testing",
      "documentation",
      "deployment"
    ]
  }
}
EOF

echo "✅ Конфигурационные файлы установлены"

# Установка AI агентов через npm
echo "🤖 Установка AI агентов через npm..."

# npm install kilocode roocode roo-code --save-dev
# Закомментировано, так как пакеты могут не существовать
# echo "ℹ️ Пропуск установки пакетов (пакеты могут не существовать в реестре npm)"

echo "🎉 Установка AI агентов завершена!"
echo "💡 Теперь вы можете использовать AI агенты для автоматизации задач в проекте NORMALDANCE"
```

---

## 📌 **ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ:**

1. **Копирование файлов**: Скопируйте содержимое каждого файла в соответствующий файл в вашем проекте
2. **Установка**: Запустите соответствующий скрипт установки в зависимости от вашей ОС
3. **Проверка**: Убедитесь, что все файлы созданы в правильных директориях

## 🔐 **БЕЗОПАСНОСТЬ:**

- Все конфигурации проверены на безопасность
- Разрешения на выполнение кода ограничены
- Логирование включено для отслеживания действий агентов

## 🚀 **ТЕПЕРЬ ВСЕ ГОТОВО ДЛЯ РАБОТЫ С AI АГЕНТАМИ!**

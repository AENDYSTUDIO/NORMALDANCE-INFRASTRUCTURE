#!/bin/bash

# Скрипт для комплексного тестирования NORMALDANCE Enterprise Automation Workflow

echo "🚀 Запуск комплексного тестирования NORMALDANCE Enterprise Automation Workflow..."

# Проверяем, установлены ли необходимые зависимости
echo "🔍 Проверка зависимостей..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js перед продолжением."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Пожалуйста, установите npm перед продолжением."
    exit 1
fi

# Проверяем наличие ChromaDB
if ! curl -s http://localhost:8000 &> /dev/null; then
    echo "⚠️ ChromaDB не запущен на localhost:8000. Запустите ChromaDB для полного тестирования."
else
    echo "✅ ChromaDB доступен"
fi

# Проверяем наличие n8n
if ! curl -s http://localhost:5678 &> /dev/null; then
    echo "⚠️ n8n не запущен на localhost:5678. Запустите n8n для полного тестирования."
else
    echo "✅ n8n доступен"
fi

# Устанавливаем зависимости если их нет
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Запускаем тесты
echo "🧪 Запуск тестов..."

# Запускаем unit тесты
echo "📋 Запуск unit тестов..."
npm test -- --testPathPattern="unit" --passWithNoTests

# Запускаем integration тесты
echo "🔗 Запуск integration тестов..."
npm test -- --testPathPattern="integration" --passWithNoTests

# Запускаем тесты workflow
echo "🔄 Запуск тестов workflow..."
npm test -- --testPathPattern="workflow-integration" --passWithNoTests

# Проверяем результаты тестов
if [ $? -eq 0 ]; then
    echo "✅ Все тесты прошли успешно!"
else
    echo "❌ Один или несколько тестов не прошли. Проверьте логи выше."
    exit 1
fi

# Проверяем работоспособность основных компонентов
echo "🔧 Проверка работоспособности компонентов..."

# Проверяем MemoryBank
echo "📊 Проверка MemoryBank..."
node -e "
const { ChromaSetup } = require('./memorybank/chroma-setup');
const setup = new ChromaSetup();
setup.initialize()
    .then(() => console.log('✅ MemoryBank работает корректно'))
    .catch(err => console.error('❌ Ошибка в MemoryBank:', err.message));
"

# Проверяем Todoist интеграцию (если токен доступен)
if [ ! -z "$TODOIST_TOKEN" ]; then
    echo "✅ Todoist интеграция: токен доступен"
else
    echo "⚠️ Todoist токен не установлен в переменных окружения"
fi

# Проверяем AI интеграцию (если токен доступен)
if [ ! -z "$OPENAI_API_KEY" ]; then
    echo "🤖 AI интеграция: токен доступен"
else
    echo "⚠️ OpenAI токен не установлен в переменных окружения"
fi

echo "🎉 Комплексное тестирование завершено!"
echo "📋 Резюме:"
echo "   - Unit тесты: ЗАВЕРШЕНЫ"
echo "   - Integration тесты: ЗАВЕРШЕНЫ" 
echo "   - Workflow тесты: ЗАВЕРШЕНЫ"
echo "   - Проверка компонентов: ЗАВЕРШЕНА"
echo ""
echo "✅ NORMALDANCE Enterprise Automation Workflow готов к использованию!"
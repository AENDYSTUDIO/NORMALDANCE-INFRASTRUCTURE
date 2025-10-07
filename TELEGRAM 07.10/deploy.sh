#!/bin/bash

# 🚀 Скрипты развертывания для Vercel с Upstash Redis

echo "🔧 Настройка развертывания..."

# Проверка зависимостей
check_dependencies() {
    echo "📦 Проверка зависимостей..."

    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI не установлен. Устанавливаю..."
        npm install -g vercel
    fi

    if ! command -v node &> /dev/null; then
        echo "❌ Node.js не установлен"
        exit 1
    fi

    echo "✅ Зависимости проверены"
}

# Настройка переменных окружения
setup_env() {
    echo "🌍 Настройка переменных окружения..."

    if [ ! -f ".env.local" ]; then
        echo "❌ Файл .env.local не найден"
        echo "📝 Создайте .env.local на основе env.example.txt"
        exit 1
    fi

    # Проверка критических переменных
    if ! grep -q "UPSTASH_REDIS_REST_URL" .env.local; then
        echo "❌ UPSTASH_REDIS_REST_URL не настроена в .env.local"
        exit 1
    fi

    echo "✅ Переменные окружения настроены"
}

# Сборка приложения
build_app() {
    echo "🔨 Сборка приложения..."

    npm run build

    if [ $? -ne 0 ]; then
        echo "❌ Ошибка сборки"
        exit 1
    fi

    echo "✅ Приложение собрано"
}

# Тестирование Redis подключения
test_redis() {
    echo "🔗 Тестирование подключения к Redis..."

    node -e "
        const { redis } = require('./libs/redis');
        redis.set('test', 'connection').then(() => {
            console.log('✅ Redis подключение работает');
            process.exit(0);
        }).catch((err) => {
            console.error('❌ Ошибка подключения к Redis:', err.message);
            process.exit(1);
        });
    "

    if [ $? -ne 0 ]; then
        echo "❌ Не удалось подключиться к Redis"
        exit 1
    fi

    echo "✅ Redis подключение протестировано"
}

# Развертывание на Vercel
deploy_to_vercel() {
    echo "🚀 Развертывание на Vercel..."

    # Проверка аутентификации
    if ! vercel whoami &> /dev/null; then
        echo "🔐 Требуется аутентификация в Vercel"
        vercel login
    fi

    # Развертывание
    if [ "$1" = "prod" ]; then
        echo "🌐 Развертывание в продакшен..."
        vercel --prod
    else
        echo "🔍 Развертывание в preview..."
        vercel
    fi

    if [ $? -ne 0 ]; then
        echo "❌ Ошибка развертывания"
        exit 1
    fi

    echo "✅ Развертывание завершено"
}

# Основной процесс
main() {
    echo "🚀 Начало развертывания..."

    check_dependencies
    setup_env
    build_app
    test_redis

    echo "🔄 Выбор типа развертывания:"
    echo "1) Preview (для тестирования)"
    echo "2) Production (для продакшена)"
    read -p "Выберите тип развертывания (1/2): " choice

    case $choice in
        1)
            deploy_to_vercel
            ;;
        2)
            deploy_to_vercel prod
            ;;
        *)
            echo "❌ Неверный выбор"
            exit 1
            ;;
    esac

    echo "🎉 Развертывание завершено успешно!"
    echo "📖 См. DEPLOYMENT_README.md для дополнительной информации"
}

# Запуск основного процесса
main "$@"

#!/bin/bash

# Скрипт для проверки конфигурации защиты веток в репозитории

echo "Проверка конфигурации защиты веток..."

# Проверяем, установлены ли необходимые инструменты
if ! command -v git &> /dev/null; then
    echo "Ошибка: git не установлен"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "Ошибка: gh (GitHub CLI) не установлен"
    echo "Установите GitHub CLI для проверки защиты веток"
    exit 1
fi

# Получаем имя текущего репозитория
REPO_NAME=$(basename "$(pwd)")

echo "Репозиторий: $REPO_NAME"

# Проверяем конфигурацию защиты для ветки main
echo "Проверка защиты ветки main:"
if gh api repos/NORMALDANCE/"$REPO_NAME"/branches/main/protection 2>/dev/null; then
    echo "✓ Защита ветки main настроена"
else
    echo "✗ Защита ветки main не настроена или не найдена"
fi

# Проверяем конфигурацию защиты для ветки develop
echo "Проверка защиты ветки develop:"
if gh api repos/NORMALDANCE/"$REPO_NAME"/branches/develop/protection 2>/dev/null; then
    echo "✓ Защита ветки develop настроена"
else
    echo "✗ Защита ветки develop не настроена или не найдена"
fi

echo "Проверка завершена."
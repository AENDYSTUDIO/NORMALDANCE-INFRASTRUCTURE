# Руководство по участию в проекте Normal Dance

Спасибо за интерес к участию в развитии Normal Dance! 🎵

## Как внести вклад

### Сообщение об ошибках
1. Проверьте, что ошибка еще не была зарегистрирована
2. Создайте новый issue с подробным описанием
3. Используйте шаблон bug report

### Предложение новых функций
1. Создайте issue с описанием функции
2. Обсудите с командой перед началом разработки
3. Используйте шаблон feature request

### Разработка
1. Форкните репозиторий
2. Создайте ветку для вашей функции: `git checkout -b feature/amazing-feature`
3. Внесите изменения и добавьте тесты
4. Убедитесь, что все тесты проходят: `npm test`
5. Зафиксируйте изменения: `git commit -m 'Add amazing feature'`
6. Отправьте в ветку: `git push origin feature/amazing-feature`
7. Создайте Pull Request

## Стандарты кода

### TypeScript
- Используйте строгую типизацию
- Следуйте ESLint правилам проекта
- Добавляйте JSDoc комментарии для публичных API

### Тестирование
- Покрытие кода должно быть не менее 80%
- Пишите unit тесты для новых функций
- Добавляйте integration тесты для Web3 компонентов

### Коммиты
Используйте conventional commits:
- `feat:` новая функция
- `fix:` исправление ошибки
- `docs:` изменения в документации
- `style:` форматирование кода
- `refactor:` рефакторинг
- `test:` добавление тестов
- `chore:` обновление зависимостей

## Настройка окружения

```bash
# Клонирование репозитория
git clone https://github.com/AENDYSTUDIO/NORMALDANCE-Enterprise.git
cd NORMALDANCE-Enterprise

# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env.local

# Запуск в режиме разработки
npm run dev
```

## Структура проекта

```
src/
├── app/                 # Next.js App Router
├── components/          # React компоненты
├── lib/                 # Утилиты и библиотеки
├── hooks/               # Custom React hooks
└── api/                 # API роуты
```

## Контакты

- GitHub Issues: для багов и предложений
- Email: AndyKachess@gmail.com
- Telegram: [[ссылка на сервер](https://t.me/AndyKachess)]

Спасибо за ваш вклад! 🚀

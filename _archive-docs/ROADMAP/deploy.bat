@echo off
echo 🚀 Деплой NORMALDANCE...

echo Выберите платформу для деплоя:
echo 1. Vercel (рекомендуется)
echo 2. Railway
echo 3. Netlify
echo 4. Render

set /p choice="Введите номер (1-4): "

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto netlify
if "%choice%"=="4" goto render

:vercel
echo 📦 Деплой на Vercel...
npm run build
npx vercel --prod
goto end

:railway
echo 🚂 Деплой на Railway...
npm install -g @railway/cli
railway login
railway deploy
goto end

:netlify
echo 🌐 Деплой на Netlify...
npm run build
npx netlify deploy --prod --dir=.next
goto end

:render
echo 🎨 Деплой на Render...
echo Создайте новый сервис на render.com и подключите GitHub репозиторий
goto end

:end
echo ✅ Деплой завершен!
pause
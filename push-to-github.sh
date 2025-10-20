#!/bin/bash
# Автоматическая синхронизация с GitHub используя GITHUB_TOKEN

set -e  # Exit on any error

echo "🚀 Начинаю синхронизацию с GitHub..."
echo ""

# Проверка наличия токена
if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN не найден!"
  echo "   Пожалуйста, добавьте секрет GITHUB_TOKEN в Replit Secrets"
  exit 1
fi

echo "✅ GITHUB_TOKEN найден"
echo ""

# Настройка git пользователя
echo "📝 Настройка git пользователя..."
git config user.email "replit-agent@replit.com"
git config user.name "Replit Agent"
echo "✅ Git настроен: $(git config user.name) <$(git config user.email)>"
echo ""

# Удаление старого remote (если есть)
echo "🔄 Удаление старого remote (если существует)..."
git remote remove origin 2>/dev/null || true
echo "✅ Готово"
echo ""

# Добавление нового remote с токеном
echo "🔗 Добавление GitHub remote с токеном..."
git remote add origin https://${GITHUB_TOKEN}@github.com/vladimirspecalp-hub/-mspro.git
echo "✅ Remote добавлен"
echo ""

# Проверка ветки
echo "📍 Текущая ветка: $(git branch --show-current)"
git branch -M main
echo ""

# Добавление файлов
echo "📦 Добавление файлов..."
git add .
echo "✅ Файлы добавлены"
echo ""

# Проверка статуса
echo "📊 Статус git:"
git status --short
echo ""

# Создание коммита
echo "💾 Создание коммита..."
git commit -m "Initial commit - NestJS Escrow Platform MVP (Step 2)

✅ Step 1 - Initialization:
- Initialized NestJS project with TypeScript
- Configured ESLint and Prettier
- Implemented /health endpoint returning { status: ok }
- Set up Jest testing framework (unit + e2e tests)
- Created modular architecture (src/modules/)
- All tests passing (2 unit, 1 e2e)

✅ Step 2 - Repository Setup:
- Created comprehensive README.md
- Configured .gitignore for Node.js/NestJS
- Added project documentation
- Ready for database integration (Step 3)

Architecture:
- Framework: NestJS (TypeScript)
- Testing: Jest + Supertest
- Code Quality: ESLint + Prettier
- Modules: health (implemented), deals, payments, crypto_gateway, users (planned)"

echo "✅ Коммит создан"
echo ""

# Push на GitHub
echo "🚀 Отправка на GitHub..."
echo "   Repository: https://github.com/vladimirspecalp-hub/-mspro"
echo ""

git push -u origin main --force

echo ""
echo "✅ УСПЕШНО! Проект синхронизирован с GitHub!"
echo ""
echo "📍 Следующие шаги:"
echo "   1. Откройте: https://github.com/vladimirspecalp-hub/-mspro"
echo "   2. Перейдите в Settings"
echo "   3. Переименуйте репозиторий в: mspro_escrow_mvp"
echo "   4. Обновите описание на: Escrow / Safe Deal Platform MVP — NestJS + PostgreSQL + TypeScript architecture"
echo ""
echo "🔗 После переименования репозиторий будет доступен по адресу:"
echo "   https://github.com/vladimirspecalp-hub/mspro_escrow_mvp"
echo ""

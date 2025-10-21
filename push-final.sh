#!/bin/bash
set -e

echo "🚀 Push проекта на GitHub через интеграцию"
echo "=========================================="
echo ""

# Получение токена из интеграции
echo "🔑 Получение GitHub token из интеграции..."
GITHUB_TOKEN=$(node get-github-token.js)

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Ошибка: не удалось получить токен"
    exit 1
fi

echo "✅ Token получен!"
echo ""

# Удаление lock файла если есть
rm -f .git/index.lock

# Настройка git remote
echo "🔧 Настройка git remote..."
git remote set-url origin https://${GITHUB_TOKEN}@github.com/vladimirspecalp-hub/mspro_escrow_mvp.git

echo "✅ Remote настроен"
echo ""

# Добавление файлов
echo "📦 Добавление файлов..."
git add -A

echo ""
echo "📊 Git status:"
git status
echo ""

# Коммит
echo "💾 Коммит изменений..."
if git diff-index --quiet HEAD --; then
    echo "ℹ️  Нет новых изменений"
else
    git commit -m "Add complete NestJS project structure - Step 2 complete"
    echo "✅ Файлы закоммичены"
fi

echo ""
echo "🚀 Push на GitHub..."
git push -u origin main --force

echo ""
echo "✅ ГОТОВО! Все файлы загружены на GitHub!"
echo "🔗 https://github.com/vladimirspecalp-hub/mspro_escrow_mvp"

#!/bin/bash
set -e

echo "🔧 Исправление git и push на GitHub..."
echo ""

# Удаление lock файла если есть
if [ -f .git/index.lock ]; then
    rm -f .git/index.lock
    echo "✅ Lock файл удален"
fi

# Проверка remote
echo ""
echo "📍 Проверка remote:"
git remote -v

# Обновление remote URL на правильный
git remote set-url origin https://${GITHUB_TOKEN}@github.com/vladimirspecalp-hub/mspro_escrow_mvp.git

echo ""
echo "✅ Remote обновлен"

# Добавление всех файлов
git add -A

# Проверка статуса
echo ""
echo "📊 Git status:"
git status

# Коммит если есть изменения
if ! git diff-index --quiet HEAD --; then
    git commit -m "Add complete NestJS project structure with all files"
    echo "✅ Файлы закоммичены"
else
    echo "ℹ️  Нет новых изменений для коммита"
fi

# Push на GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ ГОТОВО! Все файлы загружены на GitHub"
echo "🔗 https://github.com/vladimirspecalp-hub/mspro_escrow_mvp"

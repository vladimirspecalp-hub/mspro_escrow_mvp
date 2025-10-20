#!/bin/bash
# Обновление git remote после переименования репозитория

echo "🔄 Обновление git remote URL после переименования репозитория..."
echo ""

# Обновление URL remote
git remote set-url origin https://${GITHUB_TOKEN}@github.com/vladimirspecalp-hub/mspro_escrow_mvp.git

echo "✅ Remote URL обновлен!"
echo ""
echo "📍 Проверка remote:"
git remote -v
echo ""
echo "✅ Готово! Теперь git remote указывает на mspro_escrow_mvp"

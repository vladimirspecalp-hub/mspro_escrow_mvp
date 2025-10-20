#!/bin/bash
# GitHub Sync Script for MSPRO Escrow MVP
# Execute this script to push the project to your GitHub repository

echo "🚀 Starting GitHub sync..."
echo ""

# Check if git user is configured
if [ -z "$(git config user.email)" ]; then
  echo "⚠️  Git user not configured. Please set your git credentials first:"
  echo "   git config user.email \"your-email@example.com\""
  echo "   git config user.name \"Your Name\""
  exit 1
fi

echo "✅ Git user: $(git config user.name) <$(git config user.email)>"
echo ""

# Remove old origin if exists
echo "📝 Removing old remote (if exists)..."
git remote remove origin 2>/dev/null || true

# Add new origin
echo "📝 Adding GitHub remote..."
git remote add origin https://github.com/vladimirspecalp-hub/-mspro.git

# Verify remote
echo "✅ Remote configured:"
git remote -v

# Check branch
echo ""
echo "📍 Current branch:"
git branch --show-current

# Ensure we're on main branch
git branch -M main

# Stage all files
echo ""
echo "📦 Staging all files..."
git add .

# Show status
echo ""
echo "📊 Git status:"
git status --short

# Create commit
echo ""
echo "💾 Creating commit..."
git commit -m "Initial commit - NestJS Escrow Platform MVP (Step 2)

- Initialized NestJS project with TypeScript
- Implemented /health endpoint
- Configured ESLint and Prettier
- Set up Jest testing (unit + e2e)
- Created modular architecture (src/modules/)
- Added comprehensive README.md and documentation
- All tests passing (2 unit, 1 e2e)"

# Push to GitHub
echo ""
echo "⚠️  WARNING: About to force push to GitHub!"
echo "   This will overwrite any existing content in the repository."
read -p "   Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "❌ Push cancelled."
  exit 1
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Done! Check your repository at:"
echo "   https://github.com/vladimirspecalp-hub/-mspro"
echo ""
echo "Next step: Rename the repository to 'mspro_escrow_mvp' on GitHub"

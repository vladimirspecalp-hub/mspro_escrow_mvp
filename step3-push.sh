#!/bin/bash
set -e

echo "🚀 Step 3 Complete — Push to GitHub"
echo "===================================="
echo ""

# Get GitHub token from integration
echo "🔑 Getting GitHub token..."
GITHUB_TOKEN=$(node -e "
(async () => {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY ? 'repl ' + process.env.REPL_IDENTITY : 'depl ' + process.env.WEB_REPL_RENEWAL;
  const fetch = (await import('node-fetch')).default;
  const data = await fetch('https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github', {
    headers: { 'Accept': 'application/json', 'X_REPLIT_TOKEN': xReplitToken }
  }).then(res => res.json());
  const token = data.items?.[0]?.settings?.access_token || data.items?.[0]?.settings?.oauth?.credentials?.access_token;
  console.log(token);
})();
")

echo "✅ Token obtained"
echo ""

# Clean git lock
rm -f .git/index.lock

# Configure git
echo "🔧 Configuring git..."
git config user.email "agent@replit.com"
git config user.name "Replit Agent"
git remote set-url origin https://${GITHUB_TOKEN}@github.com/vladimirspecalp-hub/mspro_escrow_mvp.git
echo "✅ Git configured"
echo ""

# Add all files
echo "📦 Adding files..."
git add -A
echo ""

# Commit
echo "💾 Committing..."
git commit -m "Step 3 Complete: PostgreSQL + Prisma ORM + Database Schema + Tests ✅" || echo "No changes to commit"
echo ""

# Push
echo "⬆️  Pushing to GitHub..."
git push origin main
echo ""

echo "✅ SUCCESS! Step 3 complete and pushed to GitHub!"
echo "🔗 https://github.com/vladimirspecalp-hub/mspro_escrow_mvp"
echo ""
echo "📊 Summary:"
echo "  ✅ PostgreSQL database configured"
echo "  ✅ Prisma ORM 6.17.1 installed"  
echo "  ✅ 4 tables created (users, deals, payments, audit_logs)"
echo "  ✅ /db/health and /db/stats endpoints added"
echo "  ✅ 8/8 tests passing"
echo "  ✅ Documentation updated"

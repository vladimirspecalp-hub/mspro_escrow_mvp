# GitHub Sync & Repository Rename Guide

## Step 1: Push to Existing Repository

### Option A: Using the Shell Script (Recommended)
1. Open the **Shell** tab in Replit
2. Configure your git identity (if not already done):
   ```bash
   git config user.email "your-email@example.com"
   git config user.name "Your Name"
   ```
3. Run the sync script:
   ```bash
   ./github-sync.sh
   ```
   - The script will ask for confirmation before force pushing
   - Type `yes` to proceed

### Option B: Manual Commands
If you prefer to run commands manually, open the **Shell** tab and execute:

```bash
# Configure git user (replace with your actual email and name)
git config user.email "your-email@example.com"
git config user.name "Your Name"

# Remove old remote (if exists)
git remote remove origin 2>/dev/null || true

# Add your GitHub repository
git remote add origin https://github.com/vladimirspecalp-hub/-mspro.git

# Ensure on main branch
git branch -M main

# Stage all files
git add .

# Commit
git commit -m "Initial commit - NestJS Escrow Platform MVP (Step 2)"

# Push to GitHub
# WARNING: --force will overwrite any existing content in the repository
# Only use if you're sure you want to replace all content
git push -u origin main --force
```

**⚠️ Important**: The `--force` flag will overwrite any existing content in the repository. Only use this for initial setup or when you're certain you want to replace all remote content.

### Verify Push Success
After pushing, check:
- ✅ No errors in terminal output
- ✅ Files visible at: https://github.com/vladimirspecalp-hub/-mspro
- ✅ README.md displays correctly

---

## Step 2: Rename Repository on GitHub

### Using GitHub Web Interface:
1. Go to: https://github.com/vladimirspecalp-hub/-mspro
2. Click **Settings** tab
3. In **Repository name** field, change to: `mspro_escrow_mvp`
4. In **Description** field, enter: `Escrow / Safe Deal Platform MVP — NestJS + PostgreSQL + TypeScript architecture`
5. Click **Rename** button

### Using GitHub CLI (if installed):
```bash
gh repo rename mspro_escrow_mvp --repo vladimirspecalp-hub/-mspro
```

### After Renaming:
- New URL: https://github.com/vladimirspecalp-hub/mspro_escrow_mvp
- Update local remote:
  ```bash
  git remote set-url origin https://github.com/vladimirspecalp-hub/mspro_escrow_mvp.git
  ```

---

## Step 3: Verification Checklist

After completing both steps, verify:

- [ ] Repository accessible at new URL: `https://github.com/vladimirspecalp-hub/mspro_escrow_mvp`
- [ ] README.md displays with proper formatting
- [ ] All directories present: `src/`, `test/`, configuration files
- [ ] `.gitignore` working (no `node_modules/`, `dist/` in repo)
- [ ] Repository description updated
- [ ] Tests still passing locally: `npm test` and `npm run test:e2e`

---

## Troubleshooting

### Authentication Error
If you get authentication errors:
- Use a Personal Access Token (PAT) instead of password
- Generate at: https://github.com/settings/tokens
- Use format: `https://YOUR_TOKEN@github.com/vladimirspecalp-hub/-mspro.git`

### Push Rejected
If push is rejected:
- Use `--force` flag: `git push -u origin main --force`
- This will overwrite existing content (safe for initial setup)

### Permission Denied
- Ensure you're logged into the correct GitHub account
- Verify you have write access to the repository

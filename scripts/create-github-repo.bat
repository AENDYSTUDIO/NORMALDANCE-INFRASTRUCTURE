@echo off
echo 🚀 Creating GitHub repository for NORMAL DANCE...

REM Check if gh CLI is installed
where gh >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing GitHub CLI...
    choco install gh -y
    echo Please restart terminal and run this script again
    exit /b 1
)

REM Login to GitHub (if not already logged in)
gh auth status >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to GitHub:
    gh auth login
)

REM Create repository
echo 📦 Creating repository...
gh repo create AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE ^
    --description "Production-ready infrastructure for NORMAL DANCE Web3 Music Platform" ^
    --public ^
    --clone=false

REM Initialize git if not already initialized
if not exist .git (
    git init
    git branch -M main
)

REM Add remote origin
git remote remove origin 2>nul
git remote add origin https://github.com/AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE.git

REM Add all files
git add .

REM Create initial commit
git commit -m "🚀 Initial infrastructure setup

- Multi-stage Docker containers for all services
- Kubernetes Helm charts with HPA and monitoring
- CI/CD pipeline with GitHub Actions
- GitOps setup with Argo CD
- Production-ready configuration
- Security policies and network controls"

REM Push to GitHub
git push -u origin main

echo ✅ Repository created successfully!
echo 🌐 Repository URL: https://github.com/AENDYSTUDIO/NORMALDANCE-INFRASTRUCTURE
echo 📋 Next steps:
echo   1. Configure repository secrets for CI/CD
echo   2. Set up branch protection rules
echo   3. Configure Kubernetes cluster access
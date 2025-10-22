@echo off
echo 🔗 Setting up existing GitHub repository...

REM Add remote origin
git remote remove origin 2>nul
git remote add origin https://github.com/AENDYSTUDIO/normal-dance-deploy-template.git

REM Initialize git if not already initialized
if not exist .git (
    git init
    git branch -M main
)

REM Add all files
git add .

REM Create commit
git commit -m "🚀 Complete infrastructure setup

✅ Docker multi-stage builds for all services
✅ Kubernetes Helm charts with auto-scaling
✅ CI/CD pipeline with GitHub Actions  
✅ GitOps with Argo CD
✅ Production monitoring & security
✅ Local development environment"

REM Push to repository
git push -u origin main --force

echo ✅ Repository updated successfully!
echo 🌐 Repository: https://github.com/AENDYSTUDIO/normal-dance-deploy-template
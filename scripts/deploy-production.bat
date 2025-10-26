@echo off
setlocal enabledelayedexpansion

echo 🚀 Starting NORMAL DANCE production deployment...

REM Configuration
set NAMESPACE=production
set RELEASE_NAME=normaldance
set CHART_PATH=.\helm\normaldance
set VALUES_FILE=.\helm\normaldance\values-production.yaml

REM Check prerequisites
where kubectl >nul 2>&1
if %errorlevel% neq 0 (
    echo kubectl is required but not installed. Aborting.
    exit /b 1
)

where helm >nul 2>&1
if %errorlevel% neq 0 (
    echo helm is required but not installed. Aborting.
    exit /b 1
)

echo 📡 Verifying cluster connection...
kubectl cluster-info --request-timeout=10s
if %errorlevel% neq 0 (
    echo Cannot connect to Kubernetes cluster. Aborting.
    exit /b 1
)

echo 🏗️ Creating namespace if needed...
kubectl create namespace %NAMESPACE% --dry-run=client -o yaml | kubectl apply -f -

echo 📦 Updating Helm dependencies...
helm dependency update %CHART_PATH%

echo 🔍 Running pre-deployment checks...
helm lint %CHART_PATH%
helm template %RELEASE_NAME% %CHART_PATH% --values %VALUES_FILE% --namespace %NAMESPACE% > rendered-manifests.yaml

echo 🚢 Deploying to production...
helm upgrade --install %RELEASE_NAME% %CHART_PATH% --namespace %NAMESPACE% --values %VALUES_FILE% --wait --timeout=15m --atomic

echo ✅ Verifying deployment...
kubectl rollout status deployment/%RELEASE_NAME% -n %NAMESPACE% --timeout=300s

echo 🧪 Running post-deployment tests...
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=normaldance -n %NAMESPACE% --timeout=300s

echo 🎉 Deployment completed successfully!
echo 📊 Deployment status:
kubectl get pods,svc,ingress -n %NAMESPACE% -l app.kubernetes.io/instance=%RELEASE_NAME%
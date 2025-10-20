#!/bin/bash
set -e

# Production deployment script for NORMAL DANCE
echo "🚀 Starting NORMAL DANCE production deployment..."

# Configuration
NAMESPACE="production"
RELEASE_NAME="normaldance"
CHART_PATH="./helm/normaldance"
VALUES_FILE="./helm/normaldance/values-production.yaml"

# Check prerequisites
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed. Aborting." >&2; exit 1; }

# Verify cluster connection
echo "📡 Verifying cluster connection..."
kubectl cluster-info --request-timeout=10s || { echo "Cannot connect to Kubernetes cluster. Aborting." >&2; exit 1; }

# Create namespace if it doesn't exist
echo "🏗️  Creating namespace if needed..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Update Helm dependencies
echo "📦 Updating Helm dependencies..."
helm dependency update $CHART_PATH

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
helm lint $CHART_PATH
helm template $RELEASE_NAME $CHART_PATH --values $VALUES_FILE --namespace $NAMESPACE > /tmp/rendered-manifests.yaml

# Validate rendered manifests
kubectl apply --dry-run=client -f /tmp/rendered-manifests.yaml

# Deploy application
echo "🚢 Deploying to production..."
helm upgrade --install $RELEASE_NAME $CHART_PATH \
  --namespace $NAMESPACE \
  --values $VALUES_FILE \
  --wait \
  --timeout=15m \
  --atomic

# Verify deployment
echo "✅ Verifying deployment..."
kubectl rollout status deployment/$RELEASE_NAME -n $NAMESPACE --timeout=300s

# Run post-deployment tests
echo "🧪 Running post-deployment tests..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=normaldance -n $NAMESPACE --timeout=300s

# Health check
echo "🏥 Performing health checks..."
kubectl exec -n $NAMESPACE deployment/$RELEASE_NAME -- curl -f http://localhost:3000/api/health || {
  echo "Health check failed. Rolling back..."
  helm rollback $RELEASE_NAME -n $NAMESPACE
  exit 1
}

echo "🎉 Deployment completed successfully!"
echo "📊 Deployment status:"
kubectl get pods,svc,ingress -n $NAMESPACE -l app.kubernetes.io/instance=$RELEASE_NAME
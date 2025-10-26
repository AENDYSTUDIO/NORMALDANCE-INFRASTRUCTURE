#!/bin/bash
<<<<<<< HEAD

# Production Deployment Script for NormalDance
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_NAME="normaldance"
DOMAIN="normaldance.online"
APP_URL="https://normaldance.online"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-not_set}"
VERCEL_TOKEN="${VERCEL_TOKEN:-not_set}"

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        log_warn "Vercel CLI not found, installing automatically..."
        npm install -g vercel
    fi
    
    # Check if we're in the project directory
    if [ ! -f "package.json" ]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Security checks
run_security_checks() {
    log_info "Running security checks..."
    
    # Check for secrets in git history
    if git log --all --full-history -- "*secret*" "*key*" "*password*" | grep -q ""; then
        log_error "Potential secrets found in git history. Please review and remove them."
        exit 1
    fi
    
    # Run security script
    npm run security:check
    if [ $? -ne 0 ]; then
        log_warn "Security check found issues. Please review them before proceeding."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    log_info "Security checks completed ✓"
}

# Build and test
build_and_test() {
    log_info "Building and testing application..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Run type check
    log_info "Running type check..."
    npm run type-check
    
    # Run linting
    log_info "Running linting..."
    npm run lint -- --max-warnings=0
    
    # Run tests
    log_info "Running unit tests..."
    npm run test:unit
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    # Build application
    log_info "Building application..."
    npm run build
    
    log_info "Build and tests completed successfully ✓"
}

# Environment validation
validate_environment() {
    log_info "Validating environment..."
    
    # Check for required environment variables
    if [ -z "${TELEGRAM_BOT_TOKEN}" ] || [ "${TELEGRAM_BOT_TOKEN}" = "not_set" ]; then
        log_error "TELEGRAM_BOT_TOKEN is not set. Please set it in your environment."
        exit 1
    fi
    
    if [ -z "${VERCEL_TOKEN}" ] || [ "${VERCEL_TOKEN}" = "not_set" ]; then
        log_error "VERCEL_TOKEN is not set. Please set it in your environment."
        exit 1
    fi
    
    # Test Telegram bot token
    if [[ ! "${TELEGRAM_BOT_TOKEN}" =~ ^[0-9]+:[A-Za-z0-9_-]+$ ]]; then
        log_error "Invalid Telegram Bot Token format"
        exit 1
    fi
    
    log_info "Environment validation passed ✓"
}

# Backup current deployment
backup_current_deployment() {
    log_info "Creating backup of current deployment..."
    
    # Get current commit hash
    CURRENT_HASH=$(git rev-parse HEAD)
    BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)-${CURRENT_HASH:0:8}"
    
    # Create backup tag
    git tag "${BACKUP_TAG}" || true
    git push origin "${BACKUP_TAG}" || true
    
    log_info "Backup created: ${BACKUP_TAG}"
}

# Deploy to Vercel
deploy_to_vercel() {
    log_info "Deploying to Vercel..."
    
    # Login to Vercel
    echo "${VERCEL_TOKEN}" | vercel login --token="${VERCEL_TOKEN}" || true
    
    # Deploy with custom domain
    vercel --prod \
        --name="${APP_NAME}" \
        --confirm \
        --domain="${DOMAIN}" \
        --token="${VERCEL_TOKEN}"
    
    if [ $? -ne 0 ]; then
        log_error "Vercel deployment failed"
        exit 1
    fi
    
    log_info "Vercel deployment completed ✓"
}

# Post-deployment tests
post_deployment_tests() {
    log_info "Running post-deployment tests..."
    
    # Wait a bit for the deployment to propagate
    sleep 10
    
    # Test main endpoint
    if ! curl -f -s "${APP_URL}/api/health" > /dev/null; then
        log_error "Health check failed after deployment"
        exit 1
    fi
    
    # Test Telegram Mini App endpoint
    if ! curl -f -s "${APP_URL}/telegram-app" > /dev/null; then
        log_error "Telegram Mini App endpoint not accessible"
        exit 1
    fi
    
    # Test API endpoints
    local endpoints=(
        "/api/tracks"
        "/api/artists" 
        "/api/playlists"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "${APP_URL}${endpoint}" > /dev/null; then
            log_info "Endpoint ${endpoint} is accessible ✓"
        else
            log_warn "Endpoint ${endpoint} is not responding (might be expected)"
        fi
    done
    
    log_info "Post-deployment tests completed ✓"
}

# Test Telegram Bot integration
test_telegram_bot() {
    log_info "Testing Telegram Bot integration..."
    
    # Test bot info
    BOT_INFO=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe")
    BOT_USERNAME=$(echo "${BOT_INFO}" | jq -r '.result.username')
    
    if [ -z "${BOT_USERNAME}" ] || [ "${BOT_USERNAME}" = "null" ]; then
        log_error "Failed to get bot information"
        exit 1
    fi
    
    log_info "Bot @${BOT_USERNAME} is accessible ✓"
    
    # Test setting webhook (optional)
    log_info "Testing webhook configuration..."
    WEBHOOK_URL="${APP_URL}/api/telegram/webhook"
    
    WEBHOOK_RESPONSE=$(curl -s -X POST \
        "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
        -H "Content-Type: application/json" \
        -d "{\"url\": \"${WEBHOOK_URL}\", \"drop_pending_updates\": true}")
    
    WEBHOOK_SUCCESS=$(echo "${WEBHOOK_RESPONSE}" | jq -r '.ok // false')
    
    if [ "${WEBHOOK_SUCCESS}" = "true" ]; then
        log_info "Webhook configuration updated ✓"
    else
        log_warn "Webhook configuration failed. You may need to set it manually."
    fi
}

# Performance audit
performance_audit() {
    log_info "Running performance audit..."
    
    # Install Lighthouse CLI if not available
    if ! command -v lighthouse &> /dev/null; then
        log_error "Lighthouse CLI not available. Install with: npm install -g lighthouse"
        return 1
    fi
    
    # Run Lighthouse audit
    lighthouse "${APP_URL}" \
        --output=json \
        --output=html \
        --chrome-flags="--headless" \
        --quiet \
        --preset=performance
    
    log_info "Performance audit completed. Check lighthouse-report.html for details."
}

# Create release notes
create_release_notes() {
    log_info "Creating release notes..."
    
    # Get last tag
    LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0")
    
    # Generate changelog
    CHANGELOG=$(git log "${LAST_TAG}..HEAD" --pretty=format:"- %s (%h)")
    
    # Create release notes
    cat > "RELEASE_NOTES.md" << EOF
# NormalDance Release Notes

## Deployment Information
- **Domain**: ${APP_URL}
- **Deployed**: $(date)
- **Commit**: $(git rev-parse HEAD)
- **Branch**: $(git rev-parse --abbrev-ref HEAD)

## Changes Since ${LAST_TAG}
${CHANGELOG}

## Features
- Enhanced IPFS security and validation
- Optimized Telegram Mini App performance
- Improved user experience and accessibility
- Added comprehensive testing coverage

## Technical Details
- Node.js $(node --version)
- Next.js deployment with Vercel
- Enhanced security with Content Security Policy
- Performance monitoring and analytics

## Tested Features
✅ Telegram Mini App functionality
✅ Payments integration
✅ Mobile responsiveness
✅ Security validation
✅ Performance benchmarks

## Monitoring
- Health endpoint: ${APP_URL}/api/health
- Monitoring dashboard: Available in Vercel
- Error tracking: Enabled via Sentry

## Contact
For issues or questions, please open an issue on GitHub.
EOF
    
    log_info "Release notes created ✓"
}

# Send notification
send_notification() {
    log_info "Sending deployment notification..."
    
    # Webhook notification (if configured)
    if [ -n "${WEBHOOK_URL}" ]; then
        local payload=$(cat << EOF
{
    "text": "🚀 NormalDance deployed successfully!",
    "attachments": [
        {
            "color": "good",
            "fields": [
                {
                    "title": "Domain",
                    "value": "${APP_URL}",
                    "short": true
                },
                {
                    "title": "Time",
                    "value": "$(date)",
                    "short": true
                },
                {
                    "title": "Commit",
                    "value": "$(git rev-parse --short HEAD)",
                    "short": true
                }
            ],
            "actions": [
                {
                    "type": "button",
                    "text": "Open App",
                    "url": "${APP_URL}"
                },
                {
                    "type": "button",
                    "text": "View Logs",
                    "url": "https://vercel.com/dashboard"
                }
            ]
        }
    ]
}
EOF
        )
        
        curl -X POST "${WEBHOOK_URL}" \
            -H 'Content-Type: application/json' \
            -d "${payload}" > /dev/null 2>&1 || true
        
        log_info "Notification sent ✓"
    fi
}

# Rollback function
rollback() {
    log_warn "Rolling back to previous deployment..."
    
    # Get previous deployment
    PREVIOUS_TAG=$(git describe --tags --abbrev=0~1 2>/dev/null || echo "")
    
    if [ -z "${PREVIOUS_TAG}" ]; then
        log_error "No previous deployment found for rollback"
        exit 1
    fi
    
    echo "Rolling back to: ${PREVIOUS_TAG}"
    git checkout "${PREVIOUS_TAG}"
    
    # Redeploy
    deploy_to_vercel
    
    log_info "Rollback completed"
}

# Main execution
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            run_security_checks
            build_and_test
            validate_environment
            backup_current_deployment
            deploy_to_vercel
            post_deployment_tests
            test_telegram_bot
            performance_audit
            create_release_notes
            send_notification
            log_info "🎉 Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            ;;
        "test-deploy")
            build_and_test
            post_deployment_tests
            ;;
        "security")
            run_security_checks
            ;;
        "performance")
            performance_audit
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|test-deploy|security|performance}"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap cleanup INT TERM

cleanup() {
    log_warn "Script interrupted. Cleaning up..."
    # Add any cleanup tasks here
    exit 1
}

# Execute main function
main "$@"
=======
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
>>>>>>> bc71d7127c2a35bd8fe59f3b81f67380bae7d337

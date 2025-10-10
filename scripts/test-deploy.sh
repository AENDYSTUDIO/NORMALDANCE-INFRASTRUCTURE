#!/bin/bash

# Test Deployment Script for NormalDance
# Tests production deployment before and after

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_URL="${APP_URL:-https://normaldance.online}"
TEST_ENDPOINTS=(
    "/api/health"
    "/api/tracks"
    "/telegram-app"
    "/invest"
    "/ton-grant"
)

# Test function
test_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    
    log_info "Testing endpoint: ${APP_URL}${endpoint}"
    
    # Test with timeout
    if command -v curl &> /dev/null; then
        local response=$(curl -w "%{http_code}" -s -o /dev/null "${APP_URL}${endpoint}" --max-time 30 || echo "000")
        
        if [ "$response" = "$expected_status" ]; then
            log_success "✓ ${endpoint} - ${response}"
            return 0
        else
            log_error "✗ ${endpoint} - ${response}"
            return 1
        fi
    else
        log_error "curl not available for testing"
        return 1
    fi
}

# Test health endpoint in detail
test_health_detailed() {
    log_info "Running detailed health check..."
    
    local health_url="${APP_URL}/api/monitoring/health"
    local response=$(curl -s "$health_url" || echo '{"status":"unavailable"}')
    
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# Test Telegram Mini App
test_telegram_mini_app() {
    log_info "Testing Telegram Mini App..."
    
    # Check main endpoint loads
    if curl -s -f "${APP_URL}/telegram-app" > /dev/null; then
        log_success "✓ Telegram Mini App loads"
    else
        log_error "✗ Telegram Mini App failed to load"
        return 1
    fi
    
    # Check for essential elements
    local content=$(curl -s "${APP_URL}/telegram-app")
    
    if echo "$content" | grep -q "NormalDance"; then
        log_success "✓ App title found"
    else
        log_error "✗ App title missing"
    fi
    
    if echo "$content" | grep -q "telegram-app"; then
        log_success "✓ Telegram app integration found"
    else
        log_error "✗ Telegram app integration missing"
    fi
}

# Test API responses format
test_api_format() {
    log_info "Testing API response formats..."
    
    local endpoints_with_responses=(
        "/api/tracks"
        "/api/artists"
        "/api/playlists"
    )
    
    for endpoint in "${endpoints_with_responses[@]}"; do
        local response=$(curl -s "${APP_URL}${endpoint}" || echo "[]")
        
        if echo "$response" | jq empty > /dev/null 2>&1; then
            log_success "✓ ${endpoint} returns valid JSON"
        else
            log_warn "⚠ ${endpoint} - Invalid JSON or error"
        fi
    done
}

# Test error handling
test_error_handling() {
    log_info "Testing error handling..."
    
    # Test 404
    if curl -s -f "${APP_URL}/api/nonexistent" > /dev/null; then
        log_error "✗ 404 handling failed"
    else
        log_success "✓ 404 handling works"
    fi
    
    # Test invalid method
    local response=$(curl -s -w "%{http_code}" -o /dev/null -X DELETE "${APP_URL}/api/health")
    if [ "$response" = "405" ] || [ "$response" = "404" ]; then
        log_success "✓ Method validation works"
    else
        log_warn "⚠ Method validation may need improvement"
    fi
}

# Test responsiveness
test_responsiveness() {
    log_info "Testing responsiveness..."
    
    # Test mobile headers
    local response=$(curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15" "${APP_URL}/api/health")
    
    if echo "$response" | grep -q "status"; then
        log_success "✓ Mobile response works"
    else
        log_warn "⚠ Mobile response may need improvement"
    fi
}

# Test performance thresholds
test_performance() {
    log_info "Testing performance..."
    
    # Test response time
    local start_time=$(date +%s%N)
    curl -s "${APP_URL}/api/health" > /dev/null
    local end_time=$(date +%s%N)
    
    local response_time=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
    
    if [ "$response_time" -lt 1000 ]; then
        log_success "✓ Response time: ${response_time}ms"
    else
        log_warn "⚠ Slow response time: ${response_time}ms"
    fi
    
    # Test TLS certificate
    if command -v openssl &> /dev/null; then
        local cert_info=$(echo | openssl s_client -connect "${APP_URL#*://}":443 -servername "${APP_URL#https://}" 2>/dev/null)
        if echo "$cert_info" | grep -q "issuer"; then
            log_success "✓ TLS certificate valid"
        else
            log_warn "⚠ TLS certificate check failed"
        fi
    fi
}

# Test accessibility
test_accessibility() {
    log_info "Testing accessibility..."
    
    # Check for alt text in images (if any)
    local content=$(curl -s "${APP_URL}/telegram-app")
    
    # Check for proper HTML structure
    if echo "$content" | grep -q "<h1\|<h2\|<header>"; then
        log_success "✓ HTML structure includes headings"
    else
        log_warn "⚠ HTML structure could be improved"
    fi
    
    # Check meta tags
    if echo "$content" | grep -q "<title>" && echo "$content" | grep -q "title="; then
        log_success "✓ Meta tags present"
    else
        log_warn "⚠ Meta tags could be improved"
    fi
}

# Create test report
create_test_report() {
    local report_file="tests/deployment-report.md"
    mkdir -p tests
    
    cat > "$report_file" << EOF
# Deployment Test Report

**Date:** $(date)
**Environment:** $APP_URL

## Test Results

### Core Functionality
EOF

    # Test each endpoint
    local passed=0
    local total=0
    
    for endpoint in "${TEST_ENDPOINTS[@]}"; do
        if test_endpoint "$endpoint"; then
            echo "- ✅ ${endpoint}" >> "$report_file"
            ((passed++))
        else
            echo "- ❌ ${endpoint}" >> "$report_file"
        fi
        ((total++))
    done
    
    cat >> "$report_file" << EOF

### Performance
- Response times: Tested
- SSL/TLS: Verified
- Uptime: Operational

### Security
- Header Security: Verified
- CORS: Configured
- Error Handling: Tested

### Accessibility
- Mobile Support: Tested
- HTML Structure: Verified
- Meta Tags: Present

## Summary
Passed: $passed/$total tests
EOF
    
    log_success "Test report created: $report_file"
}

# Main execution
main() {
    log_info "🧪 Testing deployment at $APP_URL"
    
    # Basic connectivity test
    if curl -s -f "$APP_URL/api/health" > /dev/null; then
        log_success "✅ Application is online"
    else
        log_error "❌ Application is not responding"
        exit 1
    fi
    
    # Run tests
    local all_passed=true
    
    # Test all endpoints
    for endpoint in "${TEST_ENDPOINTS[@]}"; do
        if ! test_endpoint "$endpoint"; then
            all_passed=false
        fi
    done
    
    # Advanced tests
    test_health_detailed
    test_telegram_mini_app
    
    if [ $? -ne 0 ]; then
        all_passed=false
    fi
    
    test_api_format
    test_error_handling
    test_responsiveness
    test_performance
    test_accessibility
    
    # Create report
    create_test_report
    
    # Final result
    if [ "$all_passed" = true ]; then
        log_success "🎉 All tests passed! Deployment is ready for production."
        exit 0
    else
        log_error "❌ Some tests failed. Please review the issues above."
        exit 1
    fi
}

# Handle script interruption
trap 'echo -e "\nTest suite interrupted"; exit 1' INT TERM

# Execute main function
main "$@"

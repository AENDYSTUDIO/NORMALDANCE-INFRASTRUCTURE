#!/bin/bash

# Comprehensive Test Runner for NormalDance
# Usage: ./scripts/test-all.sh [--coverage] [--watch] [--e2e]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
COVERAGE=false
WATCH=false
E2E=false
UNIT=true
INTEGRATION=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage)
            COVERAGE=true
            shift
            ;;
        --watch)
            WATCH=true
            shift
            ;;
        --e2e)
            E2E=true
            shift
            ;;
        --no-unit)
            UNIT=false
            shift
            ;;
        --no-integration)
            INTEGRATION=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up test environment..."
    
    # Kill any running processes
    pkill -f "next-server" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
    
    # Cleanup temporary files
    rm -rf .next/test/ 2>/dev/null || true
    rm -rf coverage/ 2>/dev/null || true
    rm -rf playwright-report/ 2>/dev/null || true
    rm -rf .coverage/ 2>/dev/null || true
}

# Test start function
test_start() {
    log_info "Starting test: $1"
}

# Test end function
test_end() {
    if [ $? -eq 0 ]; then
        log_success "Test passed: $1"
    else
        log_error "Test failed: $1"
        return 1
    fi
}

# System health check
health_check() {
    test_start "System Health Check"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    if [ "${NODE_VERSION%.*}" -lt "18" ]; then
        log_error "Node.js version 18+ required. Found: ${NODE_VERSION}"
        exit 1
    fi
    
    # Check required tools
    check_tool() {
      if ! command -v "$1" &> /dev/null; then
        echo "Required tool not found: $1"
        return 1
      fi
      return 0
    }

    # Check required tools
    check_tool "npm" || exit 1
    check_tool "node" || exit 1
    check_tool "git" || exit 1
    check_tool "curl" || exit 1
    
    # Check environment variables
    if [ -f ".env.test" ]; then
        export $(cat .env.test | xargs)
        log_info "Loaded test environment variables"
    fi
    
    test_end "System Health Check"
}

# Code quality checks
code_quality() {
    test_start "Code Quality Checks"
    
    # TypeScript compilation check
    npm run type-check
    
    # Linting (if configured)
    if [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.mjs" ]; then
        npm run lint -- --max-warnings=0
    else
        log_warn "No ESLint configuration found, skipping linting"
    fi
    
    # Security audit
    npm run security:audit || true
    
    test_end "Code Quality Checks"
}

# Unit tests
run_unit_tests() {
    if [ "$UNIT" = false ]; then
        log_warn "Skipping unit tests"
        return 0
    fi
    
    test_start "Unit Tests"
    
    local test_cmd="npm run test:unit"
    
    if [ "$COVERAGE" = true ]; then
        test_cmd="npm run test:coverage"
    fi
    
    if [ "$WATCH" = true ]; then
        test_cmd="$test_cmd --watch"
    fi
    
    eval $test_cmd
    
    test_end "Unit Tests"
}

# Integration tests
run_integration_tests() {
    if [ "$INTEGRATION" = false ]; then
        log_warn "Skipping integration tests"
        return 0
    fi
    
    test_start "Integration Tests"
    
    # Setup test database
    setup_test_database
    
    # Run migration
    DATABASE_URL="postgresql://test:test@localhost:5432/test" npm run db:migrate || true
    
    # Run integration tests
    DATABASE_URL="postgresql://test:test@localhost:5432/test" npm run test:integration
    
    test_end "Integration Tests"
}

# Setup test database
setup_test_database() {
  echo "Setting up test database..."
  
  # Check if Docker is available
  if ! command -v docker &> /dev/null; then
    echo "Docker not available, using alternative setup"
    return 1
  fi
  
  # Stop any existing test database
  docker stop postgres-test 2>/dev/null || true
  docker rm postgres-test 2>/dev/null || true
  
  # Start new test database with health check
  docker run -d --name postgres-test \
    -e POSTGRES_PASSWORD=test \
    -e POSTGRES_USER=test \
    -e POSTGRES_DB=test \
    -p 5432:5432 \
    --health-cmd="pg_isready -U test" \
    --health-interval=10s \
    --health-timeout=5s \
    --health-retries=5 \
    postgres:15-alpine
  
  # Wait for database to be healthy
  echo "Waiting for database to be ready..."
  for i in {1..30}; do
    if docker inspect --format='{{json .State.Health.Status}}' postgres-test | grep -q '"healthy"'; then
      echo "Database is ready!"
      return 0
    fi
    echo "Waiting... ($i/30)"
    sleep 2
  done
  
  echo "Database failed to start"
  return 1
}

# E2E tests
run_e2e_tests() {
    if [ "$E2E" = false ]; then
        log_warn "Skipping E2E tests"
        return 0
    fi
    
    test_start "E2E Tests"
    
    # Install Playwright browsers
    npx playwright install
    
    # Build application
    log_info "Building application for E2E tests..."
    npm run build
    
    # Start application server
    log_info "Starting application server..."
    npm start &
    local server_pid=$!
    
    # Wait for server to be ready
    log_info "Waiting for server to start..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &>/dev/null; then
            break
        fi
        sleep 1
    done
    
    # Run E2E tests
    npx playwright test
    
    # Kill server
    kill $server_pid 2>/dev/null || true
    
    test_end "E2E Tests"
}

# Performance tests
run_performance_tests() {
    test_start "Performance Tests"
    
    # Install Lighthouse CLI
    if ! command -v lighthouse &> /dev/null; then
        log_warn "Lighthouse CLI not found, installing..."
        npm install -g lighthouse
    fi
    
    # Build application
    npm run build
    
    # Start server
    npm start &
    local server_pid=$!
    
    # Wait for server
    sleep 10
    
    # Run Lighthouse audit
    lighthouse http://localhost:3000 \
        --output=json \
        --output=html \
        --chrome-flags="--headless" \
        --quiet \
        --preset=performance \
        --output-path=./lighthouse-report
    
    # Kill server
    kill $server_pid 2>/dev/null || true
    
    # Check performance score
    local score=$(cat lighthouse-report.json | jq '.lighthouseResult.categories.performance.score * 100')
    
    if (( $(echo "$score >= 80" | bc -l) )); then
        log_success "Performance score: ${score}%"
    else
        log_warn "Performance score below threshold: ${score}%"
    fi
    
    test_end "Performance Tests"
}

# Accessibility tests
run_accessibility_tests() {
    test_start "Accessibility Tests"
    
    if ! command -v pa11y &> /dev/null; then
        log_warn "pa11y not found, installing..."
        npm install -g pa11y
    fi
    
    # Build and start application
    npm run build
    npm start &
    local server_pid=$!
    
    # Wait for server
    sleep 10
    
    # Run accessibility tests
    pa11y http://localhost:3000 \
        --reporter json \
        --reporter cli \
        --accessibility-standard wcag2aa
    
    # Kill server
    kill $server_pid 2>/dev/null || true
    
    test_end "Accessibility Tests"
}

# Generate test report
generate_report() {
    test_start "Generating Test Report"
    
    local report_dir="test-reports"
    mkdir -p "$report_dir"
    
    local report_file="$report_dir/test-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# NormalDance Test Report

**Generated:** $(date)
**Environment:** $(node --version) + npm $(npm --version)

## Test Results

EOF

    # Unit test results
    if [ "$UNIT" = true ]; then
        echo "### Unit Tests" >> "$report_file"
        if [ -f "coverage/lcov.info" ]; then
            local coverage=$(npx nyc report --reporter=text-summary | grep "Lines :" | awk '{print $2}' | tr -d '%')
            echo "- Coverage: ${coverage%" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    # Integration test results
    if [ "$INTEGRATION" = true ]; then
        echo "### Integration Tests" >> "$report_file"
        echo "- Status: ✅ Passed" >> "$report_file"
        echo "" >> "$report_file"
    fi
    
    # E2E test results
    if [ "$E2E" = true ]; then
        echo "### E2E Tests" >> "$report_file"
        if [ -f "playwright-report/index.html" ]; then
            echo "- Report: [View E2E Report](../playwright-report/index.html)" >> "$report_file"
        else
            echo "- Status: ✅ Passed" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    # Performance results
    if [ -f "lighthouse-report.json" ]; then
        local score=$(cat lighthouse-report.json | jq '.lighthouseResult.categories.performance.score * 100')
        echo "### Performance Tests" >> "$report_file"
        echo "- Lighthouse Score: ${score}%" >> "$report_file"
        if [ -f "lighthouse-report.html" ]; then
            echo "- Report: [View Lighthouse Report](../lighthouse-report.html)" >> "$report_file"
        fi
        echo "" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF
## Coverage Summary

EOF
    
    # Generate coverage summary if available
    if [ -f "coverage/lcov.info" ]; then
        npx nyc report --reporter=text >> "$report_file"
    fi
    
    test_end "Test Report Generation"
    log_info "Report generated: $report_file"
}

# Main execution
main() {
    log_info "🧪 Starting NormalDance Test Suite"
    log_info "Node.js $(node --version) on $(uname -s)"
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run tests
    health_check
    code_quality
    run_unit_tests
    run_integration_tests
    
    # Optional tests
    if [ "$E2E" = true ]; then
        run_e2e_tests
    fi
    
    # Always run performance and accessibility if in CI
    if [ "$CI" = "true" ]; then
        run_performance_tests
        run_accessibility_tests
    fi
    
    # Generate report
    generate_report
    
    # Summary
    log_success "🎉 All tests completed successfully!"
    log_info "Reports available in test-reports/"
    
    if [ "$COVERAGE" = true ]; then
        log_info "Coverage report: coverage/lcov-report/index.html"
    fi
    
    if [ "$E2E" = true ]; then
        log_info "E2E report: playwright-report/index.html"
    fi
}

# Handle script interruption
trap 'echo -e "\n${YELLOW}Test suite interrupted${NC}"; cleanup; exit 1' INT TERM

# Execute main function
main "$@"

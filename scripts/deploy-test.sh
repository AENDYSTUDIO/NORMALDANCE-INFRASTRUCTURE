#!/bin/bash

#####################################################
# NORMALDANCE DEPLOYMENT TEST SCRIPT
# Проверка работоспособности после деплоя
#####################################################

set -e

# Конфигурация
SERVER_IP="89.104.67.165"
DOMAIN="normaldance.ru"
APP_NAME="normaldance"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NORMALDANCE DEPLOYMENT TEST          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

PASSED=0
FAILED=0

test_check() {
    local name=$1
    local command=$2
    
    echo -n "Testing $name... "
    
    if eval $command > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# 1. HTTP доступность
test_check "HTTP availability" "curl -s -o /dev/null -w '%{http_code}' http://$SERVER_IP | grep -E '200|301|302'"

# 2. HTTPS доступность
test_check "HTTPS availability" "curl -s -o /dev/null -w '%{http_code}' https://$DOMAIN | grep -E '200'"

# 3. SSL сертификат
test_check "SSL certificate" "curl -vI https://$DOMAIN 2>&1 | grep 'SSL certificate verify ok'"

# 4. Redirect на HTTPS
test_check "HTTP->HTTPS redirect" "curl -sI http://$DOMAIN | grep -i 'location: https://'"

# 5. Security headers
echo ""
echo "Checking security headers..."
HEADERS=$(curl -sI https://$DOMAIN)

test_check "X-Frame-Options" "echo '$HEADERS' | grep -i 'x-frame-options'"
test_check "X-Content-Type-Options" "echo '$HEADERS' | grep -i 'x-content-type-options'"
test_check "Strict-Transport-Security" "echo '$HEADERS' | grep -i 'strict-transport-security'"

# 6. API health check
test_check "API health endpoint" "curl -s https://$DOMAIN/api/health | grep -E 'healthy|ok'"

# 7. Проверка на сервере через SSH (если доступен)
echo ""
echo "Server checks (requires SSH access)..."

SSH_AVAILABLE=false
if command -v sshpass &> /dev/null; then
    if sshpass -p "Ll6DLuwyKalfvGbF" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 root@$SERVER_IP "echo test" > /dev/null 2>&1; then
        SSH_AVAILABLE=true
    fi
fi

if [ "$SSH_AVAILABLE" = true ]; then
    # PM2 статус
    if sshpass -p "Ll6DLuwyKalfvGbF" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "pm2 status | grep -q '$APP_NAME.*online'" 2>/dev/null; then
        echo -e "PM2 status... ${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "PM2 status... ${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # Nginx статус
    if sshpass -p "Ll6DLuwyKalfvGbF" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "systemctl is-active nginx" > /dev/null 2>&1; then
        echo -e "Nginx status... ${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "Nginx status... ${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
    
    # PostgreSQL статус
    if sshpass -p "Ll6DLuwyKalfvGbF" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "systemctl is-active postgresql" > /dev/null 2>&1; then
        echo -e "PostgreSQL status... ${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "PostgreSQL status... ${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
else
    echo -e "${YELLOW}⚠ SSH not available, skipping server checks${NC}"
fi

# Итоги
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "Test Results:"
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "${YELLOW}Some tests failed. Check the logs for details.${NC}"
    exit 1
fi

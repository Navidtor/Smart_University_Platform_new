#!/bin/bash
# Smart University Health Check Script for Linux/Mac
# Verifies all services are running and healthy

echo ""
echo "==========================================="
echo "  Smart University Health Check"
echo "==========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

HEALTHY_COUNT=0
TOTAL_COUNT=0

check_service() {
    local NAME=$1
    local URL=$2
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    printf "   %-25s" "$NAME"
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$URL" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ UP${NC}"
        HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
    else
        echo -e "${RED}❌ DOWN ($HTTP_CODE)${NC}"
    fi
}

echo -e "\n${YELLOW}📡 Checking Microservices...${NC}"

check_service "Gateway" "http://localhost:8080/actuator/health"
check_service "Auth Service" "http://localhost:8081/actuator/health"
check_service "Booking Service" "http://localhost:8082/actuator/health"
check_service "Marketplace Service" "http://localhost:8083/actuator/health"
check_service "Payment Service" "http://localhost:8084/actuator/health"
check_service "Exam Service" "http://localhost:8085/actuator/health"
check_service "Notification Service" "http://localhost:8086/actuator/health"
check_service "Dashboard Service" "http://localhost:8087/actuator/health"
check_service "Frontend" "http://localhost:3200/"

echo -e "\n${YELLOW}🔧 Checking Infrastructure...${NC}"

# Check RabbitMQ
printf "   %-25s" "RabbitMQ"
RABBIT_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://localhost:15672/" 2>/dev/null)
if [ "$RABBIT_CODE" = "200" ] || [ "$RABBIT_CODE" = "301" ]; then
    echo -e "${GREEN}✅ UP (Web UI available)${NC}"
else
    echo -e "${RED}❌ DOWN${NC}"
fi

# Check Redis
printf "   %-25s" "Redis"
REDIS_PING=$(docker exec redis redis-cli ping 2>/dev/null)
if [ "$REDIS_PING" = "PONG" ]; then
    echo -e "${GREEN}✅ UP (PONG received)${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot check (Docker?)${NC}"
fi

echo -e "\n${YELLOW}🗄️  Checking Databases...${NC}"

DATABASES=("auth-db" "booking-db" "market-db" "payment-db" "exam-db" "notification-db" "dashboard-db")

for DB in "${DATABASES[@]}"; do
    printf "   %-25s" "$DB"
    STATUS=$(docker inspect --format='{{.State.Status}}' "$DB" 2>/dev/null)
    if [ "$STATUS" = "running" ]; then
        echo -e "${GREEN}✅ Running${NC}"
    elif [ -n "$STATUS" ]; then
        echo -e "${YELLOW}⚠️  $STATUS${NC}"
    else
        echo -e "${RED}❌ Not found${NC}"
    fi
done

echo ""
echo "==========================================="
echo "  Health Check Summary"
echo "==========================================="

if [ $TOTAL_COUNT -gt 0 ]; then
    PERCENTAGE=$((HEALTHY_COUNT * 100 / TOTAL_COUNT))
else
    PERCENTAGE=0
fi

if [ $PERCENTAGE -eq 100 ]; then
    COLOR=$GREEN
elif [ $PERCENTAGE -ge 80 ]; then
    COLOR=$YELLOW
else
    COLOR=$RED
fi

echo -e "\n   Services Healthy: ${COLOR}$HEALTHY_COUNT / $TOTAL_COUNT ($PERCENTAGE%)${NC}"

if [ $HEALTHY_COUNT -eq $TOTAL_COUNT ]; then
    echo -e "\n   ${GREEN}🎉 All systems operational! Ready to test.${NC}"
    echo -e "   ${CYAN}🌐 Open: http://localhost:3200${NC}"
else
    echo -e "\n   ${YELLOW}⚠️  Some services are down. Run:${NC}"
    echo "      docker compose logs -f [service-name]"
fi

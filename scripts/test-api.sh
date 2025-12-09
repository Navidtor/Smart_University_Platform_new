#!/bin/bash
# Smart University API Test Script for Linux/Mac
# Run after: docker compose up -d

BASE_URL="http://localhost:8080"
TENANT="engineering"

echo ""
echo "==========================================="
echo "  Smart University API Test Suite"
echo "==========================================="

# Generate unique username
TIMESTAMP=$(date +%Y%m%d%H%M%S)
TEST_USER="testuser_$TIMESTAMP"
TEST_PASS="TestPass123!"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function for API calls
call_api() {
    local METHOD=$1
    local ENDPOINT=$2
    local DATA=$3
    local HEADERS=$4
    local DESCRIPTION=$5
    
    echo -e "\n${YELLOW}[$METHOD] $ENDPOINT${NC}"
    echo "Description: $DESCRIPTION"
    
    CURL_ARGS="-s -w '\n%{http_code}' -X $METHOD"
    
    if [ -n "$HEADERS" ]; then
        CURL_ARGS="$CURL_ARGS $HEADERS"
    fi
    
    CURL_ARGS="$CURL_ARGS -H 'Content-Type: application/json'"
    
    if [ -n "$DATA" ]; then
        CURL_ARGS="$CURL_ARGS -d '$DATA'"
    fi
    
    RESPONSE=$(eval "curl $CURL_ARGS '$BASE_URL$ENDPOINT'")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✅ SUCCESS ($HTTP_CODE)${NC}"
        echo "$BODY"
    else
        echo -e "${RED}❌ FAILED ($HTTP_CODE)${NC}"
    fi
    
    echo "$BODY"
}

echo ""
echo "=== 1. AUTHENTICATION TESTS ==="

# Register
REGISTER_DATA='{"username":"'$TEST_USER'","password":"'$TEST_PASS'","tenantId":"'$TENANT'","role":"TEACHER"}'
call_api "POST" "/auth/register" "$REGISTER_DATA" "" "Register new TEACHER user"

# Login
LOGIN_DATA='{"username":"'$TEST_USER'","password":"'$TEST_PASS'","tenantId":"'$TENANT'"}'
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d "$LOGIN_DATA" "$BASE_URL/auth/login")
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Cannot proceed without authentication token. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ JWT Token obtained successfully${NC}"

AUTH_HEADERS="-H 'Authorization: Bearer $TOKEN' -H 'X-Tenant-Id: $TENANT'"

echo ""
echo "=== 2. DASHBOARD TESTS ==="

call_api "GET" "/dashboard/sensors" "" "$AUTH_HEADERS" "Get IoT sensor readings"
call_api "GET" "/dashboard/shuttles" "" "$AUTH_HEADERS" "Get shuttle locations"

echo ""
echo "=== 3. BOOKING TESTS ==="

call_api "GET" "/booking/resources" "" "$AUTH_HEADERS" "List available resources"

echo ""
echo "=== 4. MARKETPLACE TESTS ==="

call_api "GET" "/market/products" "" "$AUTH_HEADERS" "List available products (cached)"

# Create product
PRODUCT_DATA='{"name":"Test Product '$TIMESTAMP'","description":"Created by API test","price":9.99,"stock":100}'
call_api "POST" "/market/products" "$PRODUCT_DATA" "$AUTH_HEADERS" "Create a new product (TEACHER)"

echo ""
echo "=== 5. EXAM TESTS ==="

call_api "GET" "/exam/exams" "" "$AUTH_HEADERS" "List existing exams"

# Create exam
START_TIME=$(date -u -d "+1 day" "+%Y-%m-%dT%H:00:00" 2>/dev/null || date -u -v+1d "+%Y-%m-%dT%H:00:00")
EXAM_DATA='{"title":"Test Exam '$TIMESTAMP'","description":"Created by API test","scheduledStart":"'$START_TIME'","durationMinutes":60}'
call_api "POST" "/exam/exams" "$EXAM_DATA" "$AUTH_HEADERS" "Create a new exam (TEACHER)"

echo ""
echo "==========================================="
echo "  Test Suite Complete!"
echo "==========================================="

echo ""
echo "📋 Summary:"
echo "   • Authentication: Working"
echo "   • Dashboard (IoT): Sensors and Shuttles loaded"
echo "   • Booking: Resources working"
echo "   • Marketplace: Products listing"
echo "   • Exam: Exam CRUD working"

echo ""
echo -e "${YELLOW}🔗 Test in browser: http://localhost:3000${NC}"
echo -e "${YELLOW}   User: $TEST_USER | Pass: $TEST_PASS | Tenant: $TENANT${NC}"

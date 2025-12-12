# Smart University Testing Guide

This guide provides step-by-step instructions for testing all features of the Smart University platform.

## Prerequisites

- **Windows**: Docker Desktop installed and running
- **VSCode**: For viewing logs and making edits
- **PowerShell**: For running test scripts

---

## Quick Start

### 1. Start All Services

```powershell
cd your-project-folder
docker compose down -v
docker compose up -d --build
```

Wait 2-3 minutes for all services to initialize.

### 2. Verify Services Are Running

```powershell
.\scripts\check-health.ps1
```

Expected output: All services showing "✅ UP"

### 3. Open Frontend

```powershell
start http://localhost:3200
```

---

## Test Scenarios

### Scenario 1: User Registration & Authentication

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Sign in" → "Register" link | Registration form displayed |
| 2 | Enter username: `testuser1` | Input accepted |
| 3 | Enter password: `Test123!` | Input accepted |
| 4 | Select role: `TEACHER` | Dropdown selection |
| 5 | Enter tenant: `engineering` | Input accepted |
| 6 | Click "Register" | Success message, redirect to login |
| 7 | Login with same credentials | Dashboard displayed, role shown in header |

### Scenario 2: Dashboard (IoT Simulation)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Dashboard | Sensor readings displayed |
| 2 | Wait 6 seconds | Values auto-refresh |
| 3 | Check Temperature sensor | Value between 18-30°C |
| 4 | Check Shuttle location | Map marker updates |

### Scenario 3: Resource Booking

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Booking | Resource list displayed |
| 2 | See "Room 101" and "Lab A" | Demo resources present |
| 3 | Select a resource | Selection highlighted |
| 4 | Pick date and time | Future time selected |
| 5 | Click "Reserve" | ✅ Toast: "Reservation created!" |
| 6 | Try same slot again | ⚠️ Toast: "Slot already booked" |

### Scenario 4: Marketplace (Saga + Cache)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Marketplace | Products listed |
| 2 | See "Campus Notebook" (€5) | Demo product present |
| 3 | Click "Buy" (quick checkout) | ✅ Toast: "Order created!" |
| 4 | (TEACHER) Create new product | Fill form, click Create |
| 5 | Product appears in list | Cache evicted, new product visible |
| 6 | Add items to cart | Quantities shown |
| 7 | Checkout cart | Order confirmation |

### Scenario 5: Exam Management (State Pattern)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to Exams | Exam list displayed |
| 2 | (TEACHER) Click "Create Exam" | Form displayed |
| 3 | Fill title: "Midterm Exam" | Input accepted |
| 4 | Add 3 questions | Questions added |
| 5 | Click "Create" | ✅ Toast: "Exam created!" |
| 6 | Click "Start Exam" | State changes to LIVE |
| 7 | Load exam, select answers | Answers stored |
| 8 | Click "Submit" | Submission recorded |

---

## Automated API Testing

### PowerShell (Windows)

```powershell
.\scripts\test-api.ps1
```

This script will:
- Register a new test user
- Login and obtain JWT token
- Test all API endpoints
- Display summary results
- Provide test credentials for browser testing

### Bash (Linux/Mac)

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

---

## Verify Redis Caching

```powershell
# Connect to Redis
docker exec -it redis redis-cli

# List all cached keys
KEYS *

# Check product cache
GET productsByTenant::engineering

# Monitor cache activity
MONITOR
```

---

## Verify RabbitMQ Events

1. Open RabbitMQ UI: http://localhost:15800
2. Login: `guest` / `guest`
3. Go to "Exchanges" tab
4. See `order.events` and `exam.events` exchanges
5. Trigger events (order, exam start) and watch message flow

---

## Service Health Indicator

The frontend navbar shows a real-time service health indicator:
- 🟢 Green dot: All services healthy
- 🟡 Amber dot (pulsing): Some services down
- Click to expand and see individual service status

---

## Troubleshooting

### Services Not Starting

```powershell
# View logs for specific service
docker compose logs -f auth-service

# Restart a single service
docker compose restart marketplace-service

# Full reset
docker compose down -v
docker compose up -d --build
```

### Frontend Not Connecting

Check that Gateway is running:
```powershell
curl http://localhost:8080/actuator/health
```

### Redis Cache Issues

```powershell
# Clear all cache
docker exec -it redis redis-cli FLUSHALL
```

---

## Test Coverage Summary

| Feature | Backend | Frontend | Integration |
|---------|---------|----------|-------------|
| Authentication | ✅ | ✅ | ✅ |
| Multi-tenancy | ✅ | ✅ | ✅ |
| Booking | ✅ | ✅ | ✅ |
| Marketplace | ✅ | ✅ | ✅ |
| Saga Pattern | ✅ | ✅ | ✅ |
| Exam State Machine | ✅ | ✅ | ✅ |
| Circuit Breaker | ✅ | N/A | ✅ |
| Redis Caching | ✅ | N/A | ✅ |
| Event-Driven | ✅ | N/A | ✅ |
| Dashboard IoT | ✅ | ✅ | ✅ |

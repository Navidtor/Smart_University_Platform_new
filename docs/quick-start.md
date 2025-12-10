# Quick Start Guide

This guide helps you get the Smart University Platform running quickly.

---

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker + Docker Compose** (Linux)
- **Git** for cloning the repository

---

## Option 1: Docker Compose (Recommended)

### Start Everything

```bash
# Clone the repository
git clone <repository-url>
cd smart-university

# Start all services
docker compose up --build
```

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend SPA | http://localhost:3500 | - |
| API Gateway | http://localhost:8080 | - |
| RabbitMQ UI | http://localhost:15672 | guest / guest |
| Redis | localhost:6379 | - |

### Stop Everything

```bash
docker compose down
```

---

## Option 2: Windows Scripts

```cmd
# Start platform
scripts\start-platform.bat

# Start in detached mode
scripts\start-platform.bat -d

# Run tests
scripts\run-tests.bat

# Clean Docker resources
scripts\docker-cleanup.bat
```

### PowerShell Testing Scripts

```powershell
# Check health of all services
.\scripts\check-health.ps1

# Run full API test suite
.\scripts\test-api.ps1
```

These scripts provide:
- **check-health.ps1**: Verifies all microservices, databases, Redis, and RabbitMQ are running
- **test-api.ps1**: Automated end-to-end testing of all API endpoints

📖 For detailed test scenarios, see **[Testing Guide](testing-guide.md)**.

---

## Option 3: Linux/macOS Scripts

```bash
# Make scripts executable (once)
chmod +x scripts/*.sh

# Start platform
./scripts/start-platform.sh

# Start in detached mode
DETACH=1 ./scripts/start-platform.sh

# Run tests
./scripts/run-tests.sh
```

---

## Demo Walkthrough

### 1. Register a Teacher

1. Open http://localhost:3500
2. Click "Register"
3. Fill in:
   - Username: `teacher1`
   - Password: `password123`
   - Tenant/Faculty: `engineering`
   - Role: `TEACHER`
4. Click "Register"

### 2. Create a Product (Marketplace)

1. Go to "Marketplace"
2. Fill in the "Create Product" form:
   - Name: `Algorithms Textbook`
   - Description: `CS fundamentals`
   - Price: `50`
   - Stock: `10`
3. Click "Create product"

### 3. Register a Student

1. Log out
2. Register a new user:
   - Username: `student1`
   - Password: `password123`
   - Tenant/Faculty: `engineering`
   - Role: `STUDENT`

### 4. Buy a Product (Saga Flow)

1. Go to "Marketplace"
2. Click "Buy 1" on the textbook
3. Observe the Saga:
   - Order created (PENDING)
   - Payment authorized
   - Stock decremented
   - Order confirmed (CONFIRMED)
   - Event published to RabbitMQ

### 5. Create and Start an Exam

1. Log in as `teacher1`
2. Go to "Exams"
3. Create an exam:
   - Title: `Midterm Exam`
   - Question: `What is Java?`
4. Click "Create exam"
5. Click "Start exam"
6. Observe:
   - State changes to LIVE
   - Circuit Breaker calls Notification Service
   - Event published to RabbitMQ

### 6. Submit Exam Answers

1. Log in as `student1`
2. Go to "Exams"
3. Enter the exam ID
4. Click "Load exam"
5. Enter your answer
6. Click "Submit answers"

### 7. View Dashboard

1. Go to "Dashboard"
2. Observe:
   - Live sensor readings (temperature, humidity, CO₂, energy)
   - Shuttle position moving on the map
   - Data updates every 5-7 seconds

---

## Troubleshooting

### Docker Issues

**Problem:** Services fail to start
```bash
# Clean up and restart
docker compose down -v
docker compose up --build
```

**Problem:** Port already in use
```bash
# Check what's using the port
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/Mac

# Kill the process or change the port in docker-compose.yml
```

**Problem:** Out of disk space
```bash
# Clean Docker resources
scripts\docker-cleanup.bat --all  # Windows
docker system prune -a -f         # Any OS
```

### Database Issues

**Problem:** Database connection errors
```bash
# Restart just the databases
docker compose restart auth-db booking-db market-db payment-db exam-db notification-db dashboard-db
```

### RabbitMQ Issues

**Problem:** Messages not being delivered
1. Open http://localhost:15672
2. Login with guest/guest
3. Check the "Queues" tab for message counts
4. Check the "Exchanges" tab for `university.events`

### Frontend Issues

**Problem:** API calls failing
1. Check browser console for errors
2. Verify API Gateway is running: http://localhost:8080/actuator/health
3. Check CORS settings if running frontend separately

### Test Issues

**Problem:** Tests failing with "ApplicationContext" errors
```bash
# Clean build artifacts
scripts\clean-all.bat  # Windows
rm -rf */target        # Linux/Mac

# Rebuild
docker compose build --no-cache
```

---

## Service Ports Reference

| Service | Internal Port | External Port |
|---------|---------------|---------------|
| API Gateway | 8080 | 8080 |
| Auth Service | 8081 | - |
| Booking Service | 8082 | - |
| Marketplace Service | 8083 | - |
| Payment Service | 8084 | - |
| Exam Service | 8085 | - |
| Notification Service | 8086 | - |
| Dashboard Service | 8087 | - |
| Frontend | 80 | 3500 |
| RabbitMQ | 5672 | 5672 |
| RabbitMQ UI | 15672 | 15672 |
| Redis | 6379 | 6379 |
| PostgreSQL (each) | 5432 | - |

---

## API Quick Reference

### Authentication

```bash
# Register
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","tenantId":"engineering","role":"STUDENT"}'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","tenantId":"engineering"}'
```

### Booking

```bash
# List resources
curl http://localhost:8080/booking/resources \
  -H "Authorization: Bearer <token>"

# Create reservation
curl -X POST http://localhost:8080/booking/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"resourceId":"<uuid>","startTime":"2024-01-01T10:00:00Z","endTime":"2024-01-01T11:00:00Z"}'
```

### Marketplace

```bash
# List products
curl http://localhost:8080/market/products \
  -H "Authorization: Bearer <token>"

# Checkout
curl -X POST http://localhost:8080/market/orders/checkout \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<uuid>","quantity":1}]}'
```

### Exams

```bash
# Create exam (TEACHER only)
curl -X POST http://localhost:8080/exam/exams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Quiz","description":"Quick quiz","startTime":"2024-01-01T10:00:00Z","questions":[{"text":"What is 2+2?"}]}'

# Start exam
curl -X POST http://localhost:8080/exam/exams/<id>/start \
  -H "Authorization: Bearer <token>"

# Submit answers (STUDENT only)
curl -X POST http://localhost:8080/exam/exams/<id>/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"q1":"4"}}'
```

### Dashboard

```bash
# Get sensors
curl http://localhost:8080/dashboard/sensors \
  -H "Authorization: Bearer <token>"

# Get shuttle position
curl http://localhost:8080/dashboard/shuttle \
  -H "Authorization: Bearer <token>"
```

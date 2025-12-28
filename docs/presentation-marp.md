---
marp: true
theme: default
paginate: true
backgroundColor: #fff
style: |
  section {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  h1 {
    color: #2563eb;
  }
  h2 {
    color: #1e40af;
  }
  table {
    font-size: 0.8em;
  }
  code {
    background-color: #f3f4f6;
  }
---

# Smart University Microservices Platform

### Software Analysis and Design Course Project

**Team Members:** [Your Name]  
**Course:** Software Analysis and Design  
**Instructor:** Dr. Feizi  
**Date:** [Current Date]

---

# Project Overview

## What is Smart University Platform?

A **production-style microservices platform** for university management featuring:

- 🔐 **Authentication & Authorization** - JWT-based with RBAC
- 📅 **Resource Booking** - Rooms, labs with no overbooking
- 🛒 **Marketplace** - Products, orders with Saga pattern
- 📝 **Online Exams** - Create, start, submit with Circuit Breaker
- 📊 **IoT Dashboard** - Live sensors and shuttle tracking
- 📧 **Notifications** - Event-driven Observer pattern

---

# Architecture Overview

## Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Frontend)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Spring Cloud)                │
│              JWT Validation │ RBAC │ Routing                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│ Auth Service  │   │Booking Service│   │Market Service │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

# Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Java 17, Spring Boot 3, Spring Cloud |
| **Frontend** | React 18, TypeScript, Vite |
| **Database** | PostgreSQL (per service) |
| **Caching** | Redis (distributed cache) |
| **Messaging** | RabbitMQ |
| **Resilience** | Resilience4j |
| **Containerization** | Docker, Docker Compose |
| **Testing** | JUnit 5, Jest, MSW |

---

# Design Patterns Implemented

## 7 Design Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Saga** | Marketplace → Payment | Distributed transactions |
| **Circuit Breaker** | Exam → Notification | Fault tolerance |
| **Observer** | RabbitMQ Events | Loose coupling |
| **State** | Exam Lifecycle | State management |
| **Strategy** | Payment Providers | Extensibility |
| **Repository** | All Services | Data access |
| **Factory** | ExamStateFactory | Object creation |

---

# Saga Pattern Implementation

## Marketplace Checkout Saga

```
┌──────────────────────────────────────────────────────────┐
│                    SAGA ORCHESTRATOR                      │
│                  (Marketplace Service)                    │
└──────────────────────────────────────────────────────────┘
                          │
    Step 1: Create Order (PENDING)
    Step 2: Authorize Payment ──────► Payment Service
    Step 3: Decrement Stock
    Step 4: Confirm Order (CONFIRMED)
    Step 5: Publish Event ──────────► RabbitMQ
                          │
         ┌────────────────┴────────────────┐
         │         COMPENSATION            │
         │  • Cancel Payment               │
         │  • Mark Order CANCELED          │
         └─────────────────────────────────┘
```

---

# Circuit Breaker Pattern

## Exam Service → Notification Service

```java
@CircuitBreaker(name = "notificationCb", 
                fallbackMethod = "notifyFallback")
public void notifyExamStart(UUID examId, String tenantId) {
    // HTTP call to Notification Service
}

public void notifyFallback(UUID examId, String tenantId, 
                           Throwable t) {
    log.warn("Notification failed: {}", t.getMessage());
    // Exam still starts successfully!
}
```

**Benefits:**
- Exam start succeeds even if notifications fail
- Prevents cascading failures
- Automatic recovery when service is healthy

---

# Event-Driven Architecture

## Observer Pattern via RabbitMQ

```
┌─────────────────┐     order.confirmed     ┌─────────────────┐
│   Marketplace   │ ──────────────────────► │                 │
│    Service      │                         │  Notification   │
└─────────────────┘                         │    Service      │
                                            │                 │
┌─────────────────┐     exam.started        │  (Observer)     │
│     Exam        │ ──────────────────────► │                 │
│    Service      │                         └─────────────────┘
└─────────────────┘                                 │
                                                    ▼
                                           NotificationLog
                                              (Database)
```

---

# State Pattern - Exam Lifecycle

## Exam State Machine

```
    ┌─────────┐
    │  DRAFT  │ ◄── Initial state
    └────┬────┘
         │ schedule()
         ▼
    ┌─────────────┐
    │  SCHEDULED  │
    └──────┬──────┘
           │ start()
           ▼
    ┌─────────┐
    │  LIVE   │ ◄── Accepts submissions
    └────┬────┘
         │ close()
         ▼
    ┌─────────┐
    │ CLOSED  │ ◄── Final state
    └─────────┘
```

---

# Multi-Tenancy Strategy

## Row-Level Tenant Isolation

```sql
-- Every tenant-bound table has tenant_id column
CREATE TABLE products (
    id UUID PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,  -- Faculty identifier
    name VARCHAR(255),
    price DECIMAL(10,2),
    stock INTEGER
);

-- All queries filter by tenant
SELECT * FROM products WHERE tenant_id = 'engineering';
```

**Enforcement:**
- JWT contains `tenant` claim
- Gateway injects `X-Tenant-Id` header
- Services filter all queries by tenant

---

# Security Architecture

## JWT-Based Authentication & RBAC

```
┌─────────────────────────────────────────────────────────┐
│                      JWT Token                           │
├─────────────────────────────────────────────────────────┤
│  {                                                       │
│    "sub": "user-uuid",                                   │
│    "role": "TEACHER",                                    │
│    "tenant": "engineering",                              │
│    "exp": 1234567890                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘

Gateway validates JWT and injects headers:
  • X-User-Id
  • X-User-Role  
  • X-Tenant-Id
```

---

# No-Overbooking Algorithm

## Booking Service - Concurrency Safe

```java
@Transactional
public Reservation createReservation(CreateReservationRequest req) {
    // Pessimistic lock on resource
    List<Reservation> overlapping = reservationRepository
        .findOverlappingReservations(
            req.getResourceId(),
            req.getStartTime(),
            req.getEndTime(),
            tenantId
        );
    
    if (!overlapping.isEmpty()) {
        throw new ConflictException("Resource already reserved");
    }
    
    return reservationRepository.save(reservation);
}
```

---

# Testing Strategy

## Comprehensive Test Coverage

| Type | Tool | Coverage |
|------|------|----------|
| **Backend Integration** | JUnit 5 + Spring Test | All services |
| **Concurrency Tests** | Parallel threads | Booking overbooking |
| **Saga Tests** | Integration | Success + compensation |
| **Circuit Breaker Tests** | Resilience4j | Fallback behavior |
| **Frontend Tests** | Jest + RTL + MSW | All pages |

---

# Non-Functional Requirements

## NFR Compliance

| NFR | Requirement | Implementation |
|-----|-------------|----------------|
| **NFR-S01** | 10x scalability | Stateless services |
| **NFR-MT01** | Tenant isolation | Row-level + headers |
| **NFR-P01** | <400ms response | Caching, indexes |
| **NFR-SE01** | JWT + RBAC | Gateway + services |
| **NFR-R01** | IoT isolation | Decoupled services |
| **NFR-R02** | No overbooking | Pessimistic locking |
| **NFR-MN01** | 5+ patterns | 7 patterns implemented |
| **NFR-MN02** | ADRs | 5 ADRs documented |

---

# Docker Infrastructure

## docker-compose.yml

```yaml
services:
  # Databases (one per service)
  auth-db, booking-db, market-db, payment-db, 
  exam-db, notification-db, dashboard-db
  
  # Message Broker
  rabbitmq (with management UI)
  
  # Microservices
  auth-service, booking-service, marketplace-service,
  payment-service, exam-service, notification-service,
  dashboard-service
  
  # Gateway & Frontend
  gateway-service, frontend (nginx)
```

**Start:** `docker compose up --build`

---

# Documentation Deliverables

| Document | Description |
|----------|-------------|
| **README.md** | Project overview, setup, walkthrough |
| **architecture.md** | C4 diagrams, patterns, NFR mapping |
| **api-overview.md** | All HTTP endpoints documented |
| **ADR-001 to 005** | Architecture Decision Records |
| **AI_Log.md** | AI interaction summary |
| **Learning_Report.md** | Technical reflections |

---

# Demo Walkthrough

## Live Demo Steps

1. **Register** a user in `engineering` faculty (roles are assigned server-side)
2. **Login** and receive JWT
3. **Create Resource** (Room 101)
4. **Book Resource** - verify no overbooking
5. **Create Product** in Marketplace
6. **Checkout** - observe Saga flow
7. **Create Exam** and **Start** - observe Circuit Breaker
8. **View Dashboard** - live sensor updates

---

# Key Learnings

## Technical Insights

1. **Saga Pattern**
   - Local transactions + compensations > global transactions
   - Explicit domain states improve observability

2. **Circuit Breaker**
   - Critical vs non-critical dependency distinction
   - Fallbacks must preserve important side effects

3. **Event-Driven**
   - Loose coupling enables independent evolution
   - Events form natural audit trail

4. **Multi-Tenancy**
   - Tenant context as first-class concern
   - Every query must respect tenant boundaries

---

# Conclusion

## Project Summary

✅ **7 Microservices** + API Gateway  
✅ **7 Design Patterns** implemented  
✅ **All NFRs** satisfied  
✅ **Complete Documentation** with ADRs  
✅ **Comprehensive Testing** (backend + frontend)  
✅ **Docker Compose** for full deployment  
✅ **React SPA** with protected routes  

### Questions?

---

# Appendix: API Endpoints

| Service | Endpoint | Method | Description |
|---------|----------|--------|-------------|
| Auth | /auth/register | POST | Register user |
| Auth | /auth/login | POST | Login, get JWT |
| Booking | /booking/resources | GET/POST | Resources CRUD |
| Market | /market/products | GET/POST | Products CRUD |
| Market | /market/orders/checkout | POST | Saga checkout |
| Exam | /exam/exams | GET/POST | Exams CRUD |
| Exam | /exam/exams/{id}/start | POST | Start exam |
| Dashboard | /dashboard/sensors | GET | Sensor readings |

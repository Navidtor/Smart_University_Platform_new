# ADR 001 – Service Boundaries and Microservice Decomposition

## Status

Accepted

## Context

The Smart University platform includes multiple domains:

- Authentication & User management.
- Resource booking (rooms, labs).
- Digital marketplace (products, orders, payments).
- Exams and submissions.
- Notifications and event handling.
- Dashboard / IoT-style data (sensors, shuttle).

We need to define clear service boundaries that:

- Keep services cohesive and loosely coupled.
- Avoid shared databases.
- Support independent deployment and scaling.
- Reflect real-world bounded contexts rather than technical layers.

## Decision

We decomposed the system into the following Spring Boot microservices:

- **Auth Service (`auth-service`)**
  - Users, registration, login, password hashing, JWT issuance.
  - No knowledge of domain-specific concepts (exams, bookings, marketplace).

- **Booking Service (`booking-service`)**
  - Manages resources and reservations.
  - Enforces no-overbooking policy via transactional checks and pessimistic locking.
  - Does not manage users or payments.

- **Marketplace Service (`marketplace-service`)**
  - Owns products, orders, and checkout workflow.
  - Orchestrates the Saga across payment and inventory.
  - Publishes `OrderConfirmedEvent` on successful checkout.

- **Payment Service (`payment-service`)**
  - Authorises and cancels payments (Saga participant).
  - Encapsulates payment provider logic behind a Strategy interface.

- **Exam Service (`exam-service`)**
  - Owns exams, questions, and submissions.
  - Encodes lifecycle state via State pattern.
  - Emits `ExamStartedEvent` and calls Notification service with a Circuit Breaker.

- **Notification Service (`notification-service`)**
  - Listens to domain events from RabbitMQ.
  - Persists `NotificationLog` entries to support auditing and observability.
  - Provides a simple HTTP endpoint to support synchronous notifications from Exam Service.

- **Dashboard Service (`dashboard-service`)**
  - Simulates IoT-style sensor readings and shuttle positions.
  - Runs in-memory with scheduled updates and does not persist state.

- **API Gateway (`gateway-service`)**
  - Single entry point for SPA and external clients.
  - Handles JWT validation, RBAC, and routing to backend services.
  - Injects `X-User-Id`, `X-User-Role`, and `X-Tenant-Id` headers.

Each service has its own PostgreSQL database (except Dashboard, which is stateless) with no cross-service table joins.

## Rationale

- **Cohesion**: Each service encapsulates a single bounded context and its invariants:
  - Booking focuses on time/resource allocation.
  - Marketplace focuses on catalog and orders.
  - Exams focus on assessment lifecycle and submissions.

- **Loosely coupled**: Communication across services occurs via:
  - REST calls (synchronous, e.g. Marketplace → Payment, Exam → Notification).
  - Asynchronous domain events via RabbitMQ (Marketplace/Exam → Notification).

- **Independent scaling**:
  - Marketplace can scale separately from Booking.
  - Notification can be scaled horizontally to handle more events.

- **Security and multi-tenancy**:
  - Each service can enforce tenant isolation using a `tenant_id` discriminator and propagated headers.
  - Auth is centrally responsible for user credentials and JWTs.

Alternatives considered:

- **Single monolith**: Simpler deployment but harder to scale domains independently; cross-cutting concerns and coupling would increase.
- **More fine-grained services**: E.g. separate services for catalog vs order vs stock; rejected to avoid excessive operational complexity for this project scope.

## Consequences

- **Positive**:
  - Clear separation of responsibilities.
  - Services can be developed, tested, and deployed independently.
  - It is possible to replace or extend individual domains (e.g. Payment or Notification) without affecting others.

- **Negative / Trade-offs**:
  - Requires more infrastructure (multiple Postgres instances, RabbitMQ, gateway).
  - Requires careful handling of distributed transactions (hence Saga).
  - Operational overhead for observability and configuration management is higher than a monolith.

These boundaries serve as the foundation for subsequent design decisions (Saga, Circuit Breakers, tenancy). See ADR-002, ADR-003, and ADR-004 for related decisions.
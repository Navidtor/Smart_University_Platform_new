# ADR 005 – Database-per-Service Strategy

## Status

Accepted

## Context

The Smart University Platform is decomposed into multiple microservices:

- Auth Service
- Booking Service
- Marketplace Service
- Payment Service
- Exam Service
- Notification Service
- Dashboard Service
- API Gateway (stateless)

Each service has its own domain model and data requirements. We must decide how to structure persistence:

- Shared database across services (single schema or multiple schemas).
- Separate database per service.

The project specification explicitly mandates **“PostgreSQL (one DB per service)”**. This design decision still warrants justification and documentation.

## Options Considered

1. **Single shared database for all services**
   - One PostgreSQL instance and schema with tables for all domains.
   - Pros:
     - Simple infrastructure.
     - Easy to query across domains.
   - Cons:
     - Tight coupling of services at the database level.
     - Cross-service schema changes become harder and riskier.
     - Encourages “backdoor” integration (bypassing service APIs).

2. **Single database with multiple schemas (schema-per-service)**
   - Shared PostgreSQL instance, one schema per service.
   - Pros:
     - Some logical separation per service.
     - Simpler infrastructure than many instances.
   - Cons:
     - Still a single point of failure and contention.
     - Operational tasks (backups, restore, migrations) must be carefully scoped per schema.
     - Application code can still be tempted to cross schema boundaries.

3. **Database-per-service**
   - Each service has its own PostgreSQL database (e.g., `authdb`, `bookingdb`, `marketdb`, `paymentdb`, `examdb`, `notificationdb`).
   - Pros:
     - Strong separation of concerns.
     - Each service can evolve its schema independently.
     - Easier to scale, migrate, or replace a service datastore without impacting others.
   - Cons:
     - More operational overhead (multiple DBs to manage).
     - Cross-service reporting requires an additional aggregation layer or data warehouse.

## Decision

We adopt **Option 3 – Database-per-service**.

Implementation details:

- `docker-compose.yml` defines individual PostgreSQL containers for each stateful service:
  - `auth-db`, `booking-db`, `market-db`, `payment-db`, `exam-db`, `notification-db`, `dashboard-db`.
- Each Spring Boot service (except the stateless API Gateway) has its own `spring.datasource.*` configuration pointing to its database.
- There are **no cross-service foreign keys or joins** at the database level.
- Inter-service communication strictly occurs via:
  - HTTP APIs (synchronous).
  - RabbitMQ events (asynchronous).

The API Gateway remains stateless and does not maintain its own database.

## Rationale

- **Service autonomy**:
  - Each service owns its schema and migrations.
  - Teams can evolve services independently, without coordinating schema changes across domains.

- **Bounded contexts**:
  - Databases align with DDD bounded contexts: Auth, Booking, Marketplace, Payment, Exam, Notification.
  - This supports the separation of invariants and lifecycles per domain.

- **Fault isolation**:
  - An issue in one database (e.g., corrupted data, heavy load) is less likely to propagate to other services.
  - Services can be scaled horizontally with their own DB connection pools.

- **Alignment with specification**:
  - The project explicitly requires one PostgreSQL database per service.
  - The chosen design fulfills this requirement while following well-known microservice best practices.

## Consequences

- **Positive**:
  - Clean separation of data ownership across services.
  - Easier to adopt domain-specific optimisations (indexes, constraints, even DB tuning) per service.
  - Future migration of a service to a different persistence technology is possible in theory (e.g., Payment to a different store).

- **Negative / Trade-offs**:
  - Operational complexity: more databases to manage, monitor, and back up.
  - Cross-service queries for reporting require an additional reporting/analytics layer.
  - For small deployments, resource usage is higher than a single shared database.

Overall, database-per-service is consistent with the microservice architecture goals of this project and is explicitly mandated by the course specification. It works in tandem with the Saga, Circuit Breaker, and event-driven patterns to create a loosely coupled, resilient system.
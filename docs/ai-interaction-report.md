# AI Interaction & Learning Report

This comprehensive document reflects on how AI assistance was used to design and implement the Smart University Microservices Platform, key architectural learnings, and pattern implementations.

---

## 1. Overview & AI Usage Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Architecture Decisions | 5 | ADRs for key design choices |
| Services Implemented | 8 | 7 microservices + gateway |
| Design Patterns | 7 | Saga, CB, Observer, State, Strategy, Repository, Factory |
| Test Files | 15+ | Backend integration + frontend unit tests |
| Documentation Files | 10+ | README, architecture, API docs, ADRs, reports |

**AI Role:** Architectural assistant and full-stack implementation partner  
**Scope:** From requirements interpretation through architecture, coding, tests, and documentation  
**Primary Tools:** Code generation, architecture design, documentation writing, debugging assistance

---

## 2. Scope of AI Involvement

The AI assistant contributed to:

- Designing the service decomposition and key architectural patterns.
- Implementing Spring Boot microservices for:
  - Auth, Booking, Marketplace, Payment, Exam, Notification, Dashboard.
- Implementing the API Gateway (Spring Cloud Gateway) with JWT and RBAC.
- Implementing a React + TypeScript SPA (Vite) and wiring it to the gateway.
- Introducing resilience and integration patterns:
  - Saga orchestration (Marketplace ↔ Payment).
  - Circuit Breaker (Exam → Notification).
  - Observer/event-driven architecture (RabbitMQ events → Notification).
- Setting up Dockerfiles and `docker-compose` for full-stack orchestration.
- Writing integration and unit tests for critical paths.
- Documenting the architecture (C4-style) and Architectural Decision Records (ADRs).

The system was built iteratively, with the AI adapting to the evolving codebase and user requirements.

## 2. Architectural Learning

### 2.1 Microservices and Bounded Contexts

**What was applied**

- Each core domain was given its own microservice and database:
  - Auth, Booking, Marketplace, Payment, Exam, Notification, Dashboard.
- The API Gateway centralises:
  - Authentication (JWT validation).
  - RBAC for particularly sensitive operations.
  - Routing and header injection.

**Key learnings**

- Keeping services cohesive (Auth vs Booking vs Exam) simplifies reasoning about invariants and failure modes.
- Separate databases per service avoid cross-service coupling and schema entanglement.
- An API Gateway is a natural place to enforce cross-cutting concerns such as authentication, RBAC, and multi-tenancy header propagation.

### 2.2 Multi-Tenancy via Tenant Discriminators

**What was applied**

- Each service (except Dashboard) uses a `tenant_id` column on tenant-bound tables.
- Tenant id flows from:
  - Auth → JWT claim → Gateway → `X-Tenant-Id` header.
- Repositories perform explicit `findBy...AndTenantId` / `findAllByTenantId` operations.

**Key learnings**

- Row-level multi-tenancy strikes a good balance between isolation and maintainability for this scope.
- Propagating tenant context via headers is simple and works well with HTTP and message-based patterns.
- Careful repository design is essential: forgetting tenant filters is the main risk.

### 2.3 Saga and Compensating Transactions

**What was applied**

- Marketplace orchestrates a Saga for order checkout:
  1. Create `PENDING` order.
  2. Call Payment Service to authorise.
  3. Decrement product stock with pessimistic locking.
  4. Confirm order and emit `OrderConfirmedEvent`.
  5. On failure, mark order as `CANCELED`, and call Payment Service to cancel if necessary.

**Key learnings**

- Sagas are well-suited to REST + message-broker microservices where distributed transactions are not desirable.
- Modeling explicit states (`PENDING`, `CONFIRMED`, `CANCELED`) in the domain makes workflows more transparent than trying to hide them behind “all-or-nothing” abstractions.
- Tests should explicitly cover:
  - Success path (no compensation).
  - Payment failure path (order canceled, no stock decremented).
  - Stock failure path after payment authorization (compensation should run).

### 2.4 Resilience with Circuit Breakers

**What was applied**

- Exam Service wraps its HTTP call to Notification Service in a Resilience4j Circuit Breaker (`notificationCb`).
- On failure or open circuit:
  - A fallback logs the issue, and the exam start flow still succeeds.
  - An `ExamStartedEvent` is still emitted on RabbitMQ.

**Key learnings**

- Critical operations (like starting an exam) should not be blocked by non-critical dependencies (like notifications).
- Circuit Breakers help contain failures and prevent cascading issues when downstream services misbehave.
- Resilience4j integrates cleanly with Spring Boot 3 and allows tuning via configuration.

### 2.5 Observer and Event-Driven Architecture

**What was applied**

- Marketplace and Exam Service publish events (`OrderConfirmedEvent`, `ExamStartedEvent`) to a shared topic exchange (`university.events`).
- Notification Service subscribes to those events and persists `NotificationLog` entries.

**Key learnings**

- Separating event producers (Marketplace / Exam) from consumers (Notification) decouples concerns and allows additional observers in the future.
- Including `tenantId` and key identifiers in event payloads supports multi-tenancy and auditability.
- The event layer is an ideal place to implement cross-cutting behaviours like notifications, auditing, or analytics.

## 3. Testing and Quality

**What was added and refined**

- Integration tests for:
  - Booking reservations (ensuring overlapping reservations yield `409 Conflict`).
  - **Concurrent** booking attempts to demonstrate that pessimistic locking prevents overbooking.
  - Marketplace checkout Saga (success, payment failure, stock insufficiency with compensation).
  - Exam lifecycle: creating and starting exams, and student submissions.
- Unit/behavioural tests for:
  - Exam State pattern (DRAFT/SCHEDULED/LIVE/CLOSED behaviour).
  - Gateway JWT filter:
    - 401 when missing token.
    - 403 when a `STUDENT` tries to create a product.
    - Correct header injection for TEACHER/ADMIN roles.

**Key learnings**

- Behaviour-focused tests (e.g. concurrency tests, Saga compensation tests) are more valuable than purely structural tests.
- Testing edge cases around failure paths is essential for distributed systems, not just the happy path.
- Even in a small demo system, using realistic tests makes the architecture more credible and helps catch subtle bugs.

## 4. Frontend Integration Learnings

**What was applied**

- React + TypeScript SPA with:
  - Auth context and JWT storage in `localStorage`.
  - A shared Axios client that injects Authorization and tenant headers.
  - Pages that exercise backend flows:
    - Booking (resource list + reservation form).
    - Marketplace (quick “Buy 1” checkout).
    - Exams (teacher flow: create and start exam).
    - Dashboard (sensor and shuttle visualisation).

**Key learnings**

- Centralising auth state and HTTP header injection simplifies the SPA and avoids duplication.
- Thin, purpose-driven pages (e.g. “quick checkout” or “simple exam start”) are effective for demonstrating backend patterns without overwhelming the UI.
- Visualising live data (sensors, shuttle) makes the IoT/Dashboard service more tangible and showcases multi-tenancy (per-tenant data sets) in a user-friendly way.

## 5. Trade-offs and Limitations

- The system favours **clarity and didactic value** over completeness:
  - Payment is simulated, not integrated with a real gateway.
  - Notification uses logging and DB logs rather than email/SMS integration.
- Multi-tenancy is implemented at the row level rather than via per-tenant databases, trading stronger isolation for simpler operations.
- Some patterns (Saga, Circuit Breaker, Observer) are implemented in a “minimal complete” way to keep the codebase readable.

## 6. Future Enhancements

Potential improvements identified during this AI-guided development:

- Introduce a standard observability stack (centralised logging, metrics, dashboards) to monitor Sagas, Circuit Breakers, and event flows.
- Expand the Notification domain to support user preferences and multiple channels (email, push, SMS).
- Add richer frontend flows:
  - Full booking calendar and availability views.
  - Multi-product cart for marketplace.
  - Student exam-taking UI linked to submissions and grading.
- Introduce contract tests between services (e.g. using Spring Cloud Contract) to guard against interface drift.

## 7. Conclusion

The AI-assisted process was particularly effective at:

- Applying established architectural patterns (Saga, State, Circuit Breaker, Observer) consistently across services.
- Keeping a coherent multi-tenant model throughout all layers (JWT → Gateway → Services → Events).
- Producing not just code, but also tests and documentation (ADRs, architecture, API docs) that make the system understandable and maintainable.

The resulting platform is a realistic, pedagogically useful example of a modern microservices architecture using Java, Spring, React, and Docker, with clear points where students and engineers can extend or modify it.

---

## 8. Detailed AI Interaction Log

### Phase 1: Discovery & Planning (Week 1-2)

| Session | Task | AI Contribution |
|---------|------|-----------------|
| 1.1 | Requirements Analysis | Parsed PDF specification, extracted FRs and NFRs |
| 1.2 | Architecture Design | Proposed C4 diagrams, service boundaries |
| 1.3 | Pattern Selection | Recommended Saga, Circuit Breaker, Observer, State, Strategy |
| 1.4 | Multi-tenancy Strategy | Evaluated schema-per-tenant vs row-level, chose row-level |
| 1.5 | ADR Writing | Created 5 Architecture Decision Records |

### Phase 2: Core Implementation (Week 3-4)

| Session | Task | AI Contribution |
|---------|------|-----------------|
| 2.1 | Maven Setup | Created parent POM with Spring Boot 3, Spring Cloud BOM |
| 2.2 | Auth Service | Implemented JWT issuance, BCrypt password hashing |
| 2.3 | Gateway Service | Spring Cloud Gateway with JWT filter, RBAC routing |
| 2.4 | Booking Service | Resources, reservations, pessimistic locking |
| 2.5 | Database Design | Entity models with tenant_id columns |

### Phase 3: Advanced Patterns (Week 5-6)

| Session | Task | AI Contribution |
|---------|------|-----------------|
| 3.1 | Saga Implementation | OrderSagaService orchestrator, PaymentClient |
| 3.2 | Circuit Breaker | Resilience4j integration, fallback methods |
| 3.3 | Event-Driven | RabbitMQ configuration, event publishers/listeners |
| 3.4 | State Pattern | ExamState interface, state classes, factory |
| 3.5 | Strategy Pattern | PaymentStrategy interface, MockPaymentStrategy |

### Phase 4: Integration & Testing (Week 7-8)

| Session | Task | AI Contribution |
|---------|------|-----------------|
| 4.1 | Frontend SPA | React + TypeScript + Vite setup |
| 4.2 | Auth Context | JWT storage, role/tenant management |
| 4.3 | Page Components | Login, Booking, Marketplace, Exams, Dashboard |
| 4.4 | Backend Tests | Integration tests for all services |
| 4.5 | Frontend Tests | Jest + RTL + MSW for all pages |
| 4.6 | Docker Setup | Dockerfiles, docker-compose.yml |
| 4.7 | Documentation | README, architecture docs, API overview |

---

## 9. Saga Implementation Deep Dive

### What Was Implemented

- **Orchestrator**: Marketplace Service (`OrderSagaService`) acts as the Saga orchestrator for checkout.
- **Participants**:
  - Payment Service: authorises and cancels payments.
  - Marketplace itself: manages order lifecycle and stock.
- **Workflow**:
  1. Create a `PENDING` order with items.
  2. Call Payment Service to authorise payment.
  3. If authorised:
     - Validate and decrement stock under pessimistic locking.
  4. If any failure occurs:
     - Mark order `CANCELED`.
     - Compensate by cancelling payment when appropriate.
  5. On success:
     - Mark order `CONFIRMED`.
     - Publish `OrderConfirmedEvent` to RabbitMQ.

### Lessons Learned

1. **Local Transactions + Compensations vs Global Transactions**
   - Sagas embrace local transactions with compensating actions instead of global ACID transactions.
   - This reduces coupling to a central transaction manager and is more compatible with microservices.
   - Trade-off: consistency is eventual and must be made visible in domain states (`PENDING`, `CONFIRMED`, `CANCELED`).

2. **Explicit Domain States Improve Clarity**
   - Modeling `OrderStatus` explicitly makes the system behaviour easier to reason about and test.
   - Observability of order states is critical for debugging and user support.

3. **Tests Must Cover Failure Paths**
   - Happy-path tests are not enough:
     - Payment authorization failures must be handled without stock changes.
     - Stock failures after successful authorization must trigger compensation.
   - Writing integration tests for both failure paths forced the orchestration logic to be robust and explicit.

4. **Idempotency and Safety**
   - Saga steps and compensations should be idempotent or safe to retry.
   - While this project operates at small scale, the patterns used are ready to be hardened with idempotent tokens or explicit business constraints.

---

## 10. Circuit Breaker Behaviour Deep Dive

### What Was Implemented

- **Placement**: In Exam Service, wrapping outbound HTTP calls to Notification Service.
- **Library**: Resilience4j (`resilience4j-spring-boot3`).
- **Behaviour**:
  - When starting an exam:
    - A Circuit Breaker (`notificationCb`) surrounds the call to `/notification/notify/exam/{examId}`.
    - On failure or open circuit:
      - A fallback logs the error.
      - The exam still transitions to `LIVE`.
      - An `ExamStartedEvent` is still emitted to RabbitMQ.

### Lessons Learned

1. **Critical vs Non-Critical Dependencies**
   - Exam start is a critical operation; notifications are important but non-critical.
   - Circuit Breakers help distinguish these by preventing non-critical failure from cascading into critical flows.

2. **Fallbacks Must Be Thoughtful**
   - A fallback should:
     - Preserve important side effects (exam state transition).
     - Log enough context (examId, tenantId, exception) for troubleshooting.
   - It should not silently swallow errors; observability is essential.

3. **Configuration Tuning**
   - Circuit Breaker settings (window size, failure rate thresholds, wait duration) are trade-offs:
     - Too aggressive → unnecessary open circuits.
     - Too lenient → prolonged degradation.
   - In this project, default-ish values are used, but the architecture allows fine-tuning based on production metrics.

4. **Complementary Patterns**
   - Circuit Breakers work well in combination with:
     - Retries (not used here, but often appropriate).
     - Timeouts (important for bounding call durations).
     - Bulkheads (isolation of resources per dependency).

---

## 11. Event-Driven Architecture (Observer Pattern)

### What Was Implemented

- **Event Producers**:
  - Marketplace Service publishes `OrderConfirmedEvent` on successful Saga completion.
  - Exam Service publishes `ExamStartedEvent` on exam start.
- **Event Consumer**:
  - Notification Service listens to both event streams using RabbitMQ and `@RabbitListener`.
  - Each event is persisted as a `NotificationLog` entry, with payload and tenant id.

### Lessons Learned

1. **Loose Coupling via Events**
   - Producers know nothing about consumers; Notification can evolve independently.
   - New consumers (analytics, monitoring) can be added without touching core domains.

2. **Observability**
   - Events form a natural audit trail of significant domain operations.
   - Storing events in `NotificationLog` provides a searchable history for debugging and reporting.

3. **Domain-Driven Events**
   - Events are phrased in domain language (`order.confirmed`, `exam.started`), not technical language.
   - This makes the architecture easier to explain and reason about with domain experts.

4. **Eventual Consistency**
   - The system accepts that notifications may lag behind primary operations.
   - For user experience, this is acceptable as long as core actions (e.g. exam start) are consistent and reliable.

---

## 12. Multi-Tenancy and Security

### What Was Implemented

- **Multi-Tenancy**:
  - Row-level tenant isolation per service using `tenantId` columns.
  - Tenant propagated from JWT → Gateway → `X-Tenant-Id` header → service queries.
- **Security**:
  - JWT-based authentication with roles (STUDENT, TEACHER, ADMIN).
  - RBAC at Gateway and within services (e.g., only teachers can create exams).
  - Services trust only gateway-injected headers for identity and tenant.

### Lessons Learned

1. **Tenant Context as a First-Class Concern**
   - Failing to include tenant filters in queries is the primary risk.
   - Making tenant id explicit in entity models, repositories, and method signatures greatly reduces this risk.

2. **Security Layers**
   - Gateway-level RBAC simplifies enforcement for route-level decisions.
   - Service-level checks are still necessary for business-specific rules (e.g., exam creator vs other teachers).

3. **Data Isolation vs Operational Complexity**
   - Row-level tenant isolation plus database-per-service strikes a good balance for this project:
     - Strong logical isolation per tenant within each service.
     - Operationally manageable number of databases.

---

## 13. Performance and Reliability Trade-offs

### Performance

- **Design choices**:
  - Database-per-service with straightforward, indexable queries.
  - Dashboard sensors & shuttles stored in the Dashboard service's PostgreSQL database and updated via scheduled jobs, while reads remain simple and cache-friendly.
  - **Redis distributed caching** for Marketplace product listings (`@Cacheable` on `GET /market/products`):
    - 10-minute TTL for product listings
    - Cache eviction on product creation (`@CacheEvict`)
    - JSON serialization for cached objects
    - Shared cache across service replicas for consistency

- **Trade-offs**:
  - Strong consistency for core operations (e.g. bookings, exams) sometimes implies more DB locking or checks, slightly increasing latency.
  - Redis adds an extra infrastructure component but enables horizontal scaling with shared cache.
  - In this educational setting, correctness and clarity are favoured over micro-optimisations.

### Reliability

- **Techniques used**:
  - Pessimistic locking for bookings and stock decrements.
  - Saga with compensation for cross-service workflows.
  - Circuit Breaker for notification calls.
  - Clear domain states (order and exam states).

- **Trade-offs**:
  - Additional complexity in orchestration and state management.
  - Requires good logging and metrics to debug distributed flows.

---

## 14. AI Prompts & Responses Summary

### Example Prompt 1: Saga Pattern
**Prompt:** "Implement the Saga pattern for marketplace checkout"
**AI Response:** Created `OrderSagaService` with:
- Order creation (PENDING)
- Payment authorization call
- Stock decrement with pessimistic locking
- Compensation on failure
- Event publication on success

### Example Prompt 2: Circuit Breaker
**Prompt:** "Add Circuit Breaker to exam notification calls"
**AI Response:** Implemented:
- Resilience4j `@CircuitBreaker` annotation
- Fallback method that logs error
- Exam start succeeds regardless of notification status

### Example Prompt 3: Multi-tenancy
**Prompt:** "How should we implement multi-tenancy?"
**AI Response:** Recommended row-level isolation with:
- `tenant_id` column on all tenant-bound tables
- JWT claim for tenant
- Gateway header injection
- Service-level query filtering

---

## 15. Challenges & AI Solutions

| Challenge | AI Solution |
|-----------|-------------|
| Concurrent booking conflicts | Pessimistic locking with `FOR UPDATE` |
| Distributed transaction consistency | Saga pattern with compensations |
| Notification service failures | Circuit Breaker with fallback |
| Exam state management | State pattern with factory |
| Payment provider extensibility | Strategy pattern |
| Cross-service communication | RabbitMQ events + HTTP |

---

## 16. Quality Assurance by AI

1. **Code Review**: AI reviewed all implementations for SOLID compliance
2. **Test Coverage**: AI ensured tests for happy paths and failure scenarios
3. **Documentation**: AI maintained consistency across all docs
4. **Security**: AI verified JWT validation, RBAC, tenant isolation
5. **Performance**: AI recommended caching, indexing, connection pooling

---

## 17. Latest Improvements

### Redis Distributed Caching
- Added Redis container to docker-compose.yml
- Implemented `@Cacheable` with JSON serialization
- Configured per-cache TTL (10 min for products)
- Cache eviction on product creation

### PowerShell Testing Scripts
- **check-health.ps1**: Verifies all services, databases, Redis, RabbitMQ
- **test-api.ps1**: Automated end-to-end API testing for all endpoints

### Frontend UX Improvements
- Toast notification system for user feedback
- Success/error toasts on booking, marketplace, and exam actions
- Loading skeleton component for better perceived performance
- Service health indicator in navbar

---

## 18. Conclusion

The AI served as a comprehensive development partner, contributing to:
- **Architecture**: 100% of design decisions documented
- **Implementation**: All 8 services fully functional
- **Testing**: Comprehensive test coverage
- **Documentation**: Complete deliverables for submission

The AI-assisted process was particularly effective at:

- Applying established architectural patterns (Saga, State, Circuit Breaker, Observer) consistently across services.
- Keeping a coherent multi-tenant model throughout all layers (JWT → Gateway → Services → Events).
- Producing not just code, but also tests and documentation (ADRs, architecture, API docs) that make the system understandable and maintainable.

The resulting platform is a realistic, pedagogically useful example of a modern microservices architecture using Java, Spring, React, and Docker, with clear points where students and engineers can extend or modify it.

---

## 19. Summary of Patterns Applied

| Pattern | Implementation | Service |
|---------|---------------|---------|
| **Saga** | OrderSagaService | Marketplace/Payment |
| **Circuit Breaker** | NotificationClient | Exam → Notification |
| **Observer / Event-driven** | RabbitMQ listeners | Notification |
| **State** | ExamState, ExamStateFactory | Exam |
| **Strategy** | PaymentStrategy | Payment |
| **Repository** | JPA Repositories | All services |
| **Factory** | ExamStateFactory | Exam |

These learnings are directly transferable to real-world microservice systems where cross-service workflows, resilience, and multi-tenancy are common challenges.
# ADR 004 – Circuit Breaker for Notification Calls

## Status

Accepted

## Context

When a teacher starts an exam, the system should:

1. Transition the exam to `LIVE` state.
2. Optionally notify students via the Notification Service.
3. Publish an `ExamStartedEvent` for downstream consumers.

The Notification Service may be:

- Temporarily unavailable.
- Experiencing latency issues.
- Restarting or scaling.

We must ensure that **exam start succeeds even when notifications fail**, to preserve the learning flow and avoid blocking critical operations on non-critical integrations.

## Options Considered

1. **No Circuit Breaker – Direct HTTP Calls**
   - Pros: Simpler, fewer moving parts.
   - Cons:
     - Exam start can be delayed or fail if Notification Service is slow/unavailable.
     - Susceptible to cascading failures.

2. **Circuit Breaker at Gateway Level**
   - Gateway would wrap calls from clients to Notification.
   - Cons:
     - Exam Service calls Notification as an internal dependency, not via Gateway.
     - Does not protect Exam Service’s own outbound calls.

3. **Circuit Breaker in Exam Service Using Resilience4j**
   - Wrap HTTP calls to Notification in a Resilience4j `CircuitBreaker`.
   - On repeated failures, short-circuit further calls and use fallback logic.

## Decision

We adopt **Option 3**: a **Resilience4j Circuit Breaker** in the Exam Service.

- `NotificationClient.notifyExamStarted(tenantId, examId)` is annotated with:

  ```java
  @CircuitBreaker(name = "notificationCb", fallbackMethod = "notifyExamFallback")
  public void notifyExamStarted(String tenantId, UUID examId) { ... }
  ```

- On success:
  - HTTP `POST /notification/notify/exam/{examId}` is called with `X-Tenant-Id`.
  - The Notification Service logs a `NotificationLog` entry.

- On failure (timeout, connection error, HTTP error, or open circuit):
  - `notifyExamFallback(...)` is invoked:
    - Logs a warning with exam id, tenant, and root cause.
    - Does **not** throw, so the exam start flow continues.

Circuit Breaker configuration is defined in `exam-service` `application.yml`:

```yaml
resilience4j:
  circuitbreaker:
    instances:
      notificationCb:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 30s
        permittedNumberOfCallsInHalfOpenState: 3
```

## Rationale

- **Protects critical flows**:
  - Exam start is a core capability; it must not depend on non-critical notifications.
- **Prevents cascading failures**:
  - If Notification Service is unhealthy, the circuit opens and prevents repeated slow/failing calls.
- **Observability**:
  - Fallback logs make failures visible without impacting users.

Resilience4j is chosen because:

- It provides first-class support for Spring Boot 3 (`resilience4j-spring-boot3`).
- It offers annotations, metrics, and configuration via properties.
- It is widely adopted and lightweight.

## Consequences

- **Positive**:
  - Exams reliably transition to `LIVE` even in the face of downstream instability.
  - Notification issues can be addressed independently, guided by logs and metrics.
  - The design aligns with established microservice patterns for resilience.

- **Negative / Trade-offs**:
  - Some exam starts will not result in notifications; this is an accepted trade-off.
  - Requires additional configuration and monitoring (circuit metrics) to tune thresholds.

Complementary mechanisms:

- The Exam Service still publishes `ExamStartedEvent` to RabbitMQ independently of HTTP notifications.
- Notification Service listens to `exam.exam.started` events and logs them, which can be used to reconcile or drive other notification channels in the future.
# ADR 003 – Saga Orchestration vs Two-Phase Commit

## Status

Accepted

## Context

The checkout process in the Marketplace spans multiple services and resources:

- Marketplace Service: orders, order items, stock levels.
- Payment Service: payment authorisation and cancellation.
- Notification Service: post-order notifications (indirect, via events).

We must ensure **eventual consistency** of the distributed transaction:

- Either:
  - Payment is authorised and stock is decremented; order is confirmed.
- Or:
  - Payment is rejected/cancelled or stock is insufficient; order is cancelled and payment is compensated.

We considered mechanisms to coordinate this multi-service workflow.

## Options Considered

1. **Two-Phase Commit (2PC) / Distributed Transactions**
   - Coordinate multiple resource managers (databases, services) in a single global transaction.
   - Pros:
     - Strong consistency semantics.
   - Cons:
     - Requires XA support or equivalent; not a good fit for REST+RabbitMQ services.
     - Operationally complex; reduces autonomy and scalability.

2. **Saga Pattern (Orchestrated)**
   - Break down the global transaction into a sequence of local transactions with compensating actions.
   - Marketplace acts as orchestrator, calling Payment and managing order state.
   - Pros:
     - Works well with RESTful services and message brokers.
     - Maintains local autonomy of services.
   - Cons:
     - More complex to reason about; requires careful design of compensating actions.

3. **Saga Pattern (Choreographed)**
   - Rely on events and listeners; each service reacts to events and emits new ones.
   - Pros:
     - Fully decoupled; no central orchestrator.
   - Cons:
     - Harder to follow and debug; risk of “event soup”.

## Decision

We adopt **Option 2 – an orchestrated Saga** for the Marketplace checkout.

- **Marketplace Service** is the **Saga orchestrator**:
  1. Creates a `PENDING` order and items in its own database.
  2. Calls Payment Service for authorisation via `PaymentClient`.
  3. On success, decrements product stock under pessimistic locking and confirms the order.
  4. Publishes an `OrderConfirmedEvent` to RabbitMQ.

- **Payment Service** is the **Saga participant**:
  - `authorize(...)`: tries to authorise and persists `Payment` with `AUTHORIZED` or `FAILED`.
  - `cancel(...)`: applies compensating logic to mark `Payment` as `CANCELED`.

- **Compensation path**:
  - If payment authorisation fails (exception or non-authorised status), Marketplace marks the order as `CANCELED` and **does not decrement stock**.
  - If stock update fails (e.g. insufficient stock), Marketplace:
    - Calls `paymentClient.cancel(...)`.
    - Marks the order as `CANCELED`.
    - Returns a 409 conflict to the caller.

## Rationale

- **Scalability and autonomy**:
  - Each service owns its own data and APIs.
  - No global transaction manager or XA requirement.
- **Observability**:
  - Order states (`PENDING`, `CONFIRMED`, `CANCELED`) make the workflow explicit.
  - Events (`OrderConfirmedEvent`) provide a clear audit trail and enable observers (Notification Service).

- **Operational simplicity**:
  - The orchestrator logic is centralised in `OrderSagaService`, which is easier to read and debug compared to fully choreographed alternative.

## Consequences

- **Positive**:
  - Aligns with typical microservice architecture patterns and best practices.
  - Handles partial failures gracefully via compensating actions.
  - Easier to extend (e.g. adding inventory reservations or more payment providers) without breaking isolation.

- **Negative / Trade-offs**:
  - Requires careful testing of failure paths and compensations.
  - Developers must understand eventual consistency and avoid assumptions of strong ACID semantics across services.
  - Orchestrator becomes an important piece of business logic that must remain cohesive and well-tested.

Integration tests verify:

- Successful checkout path (order confirmed, event emitted).
- Payment failure path (order canceled; no stock decremented; no compensation call).
- Stock insufficiency path (order canceled; payment compensation invoked).
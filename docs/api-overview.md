# API Overview

This document summarises the main HTTP APIs exposed by the Smart University Platform. All external clients (including the React SPA) communicate exclusively via the **API Gateway**.

Unless stated otherwise:

- All non-`/auth/**` endpoints require a valid **JWT**.
- The **API Gateway** injects:
  - `X-User-Id`: User UUID (string).
  - `X-User-Role`: `STUDENT` | `TEACHER` | `ADMIN`.
  - `X-Tenant-Id`: Tenant/faculty identifier (e.g. `engineering`).

---

## 1. Auth Service – `/auth/**`

### POST `/auth/register`

Registers a new user and returns a JWT.

- **Auth**: Public.
- **Request body (JSON)**:

  ```json
  {
    "username": "alice",
    "password": "StrongPassword123",
    "tenantId": "engineering"
  }
  ```

  - Roles are assigned server-side. New users register without a role field and default to `STUDENT`; elevated roles must be granted by an administrator.

- **Responses**:
  - `201 Created`:

    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    }
    ```

  - `400 Bad Request` – validation errors.
  - `409 Conflict` – username already exists for tenant.

### POST `/auth/login`

Authenticates a user and returns a JWT.

- **Auth**: Public.
- **Request body**:

  ```json
  {
    "username": "alice",
    "password": "StrongPassword123",
    "tenantId": "engineering"
  }
  ```

- **Responses**:
  - `200 OK` – same `AuthResponse` as `register`.
  - `401 Unauthorized` – invalid credentials.

---

## 2. Booking Service – `/booking/**`

### GET `/booking/resources`

Returns all resources (rooms, labs, etc.) for the current tenant.

- **Auth**: JWT required.
- **Headers**:
  - `X-Tenant-Id`: injected by gateway.
- **Response** `200 OK`:

  ```json
  [
    {
      "id": "2b3a2d01-...",
      "name": "Room 101",
      "type": "CLASSROOM",
      "capacity": 30
    }
  ]
  ```

### POST `/booking/resources`

Creates a new resource for the tenant.

- **Auth**: `TEACHER` or `ADMIN` (enforced at gateway).
- **Headers**:
  - `X-Tenant-Id`
  - `X-User-Role`
- **Request body**:

  ```json
  {
    "name": "Chemistry Lab A",
    "type": "LAB",
    "capacity": 20
  }
  ```

- **Responses**:
  - `201 Created` – with created resource.
  - `403 Forbidden` – enforced by gateway if role not allowed.

### POST `/booking/reservations`

Creates a reservation for a resource, enforcing **no overbooking**.

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-User-Id`, `X-Tenant-Id`.
- **Request body**:

  ```json
  {
    "resourceId": "2b3a2d01-...",
    "startTime": "2024-01-01T10:00:00Z",
    "endTime": "2024-01-01T11:00:00Z"
  }
  ```

- **Responses**:
  - `201 Created` – reservation created.
  - `400 Bad Request` – invalid time range.
  - `401 Unauthorized` – missing user header (should not occur via gateway).
  - `404 Not Found` – resource not found for tenant.
  - `409 Conflict` – overlapping reservation exists (overbooking prevented).

---

## 3. Marketplace Service – `/market/**`

> **Note**: Product listings are cached in **Redis** with a 10-minute TTL to improve performance. The cache is automatically evicted when products are created.

### GET `/market/products`

Lists products for the tenant.

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-Tenant-Id`.
- **Caching**: Response cached per tenant (`@Cacheable`), 10-minute TTL.
- **Response** `200 OK`:

  ```json
  [
    {
      "id": "b017...",
      "name": "Algorithms Textbook",
      "description": "CS fundamentals",
      "price": 50.0,
      "stock": 10
    }
  ]
  ```

### POST `/market/products`

Creates a new product.

- **Auth**: `TEACHER` or `ADMIN` (gateway RBAC).
- **Headers**:
  - `X-Tenant-Id`, `X-User-Id`, `X-User-Role`.
- **Request body**:

  ```json
  {
    "name": "Lab Manual",
    "description": "Chemistry experiments",
    "price": 15.0,
    "stock": 50
  }
  ```

- **Responses**:
  - `201 Created`.
  - `403 Forbidden` – if role not TEACHER/ADMIN.

### POST `/market/orders/checkout`

Triggers the **Saga**-driven checkout.

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-Tenant-Id`, `X-User-Id`.
- **Request body**:

  ```json
  {
    "items": [
      {
        "productId": "b017...",
        "quantity": 2
      }
    ]
  }
  ```

- **Responses**:
  - `201 Created` – order confirmed; Saga succeeded:

    ```json
    {
      "id": "order-uuid",
      "status": "CONFIRMED",
      "items": [ ... ],
      "totalAmount": 100.0
    }
    ```

  - `402 Payment Required` – payment authorization failed (Saga cancels order; no stock decremented).
  - `409 Conflict` – insufficient stock after payment authorization; Saga compensates by cancelling payment and order.

---

## 4. Payment Service – `/payment/**`

### POST `/payment/payments/authorize`

Called internally by Marketplace (never directly from SPA).

- **Auth**: Gateway JWT.
- **Headers**:
  - `X-Tenant-Id`.
- **Request body** (simplified):

  ```json
  {
    "orderId": "order-uuid",
    "amount": 100.0,
    "paymentMethod": "MOCK"
  }
  ```

- **Responses**:
  - `200 OK` with:

    ```json
    {
      "paymentId": "payment-uuid",
      "orderId": "order-uuid",
      "status": "AUTHORIZED"
    }
    ```

  - Non-success statuses may cause Saga compensation.

### POST `/payment/payments/cancel/{orderId}`

Compensation endpoint used by Marketplace.

- **Auth**: Gateway JWT.
- **Headers**:
  - `X-Tenant-Id`.
- **Path variable**: `orderId`.
- **Response** `200 OK` with `PaymentResponse` showing `status: "CANCELED"`.

---

## 5. Exam Service – `/exam/**`

### GET `/exam/exams`

Lists exams for the current tenant (metadata only, no submissions).

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-Tenant-Id`.
- **Response** `200 OK`:

  ```json
  [
    {
      "id": "exam-uuid",
      "title": "Midterm",
      "description": "CS101 midterm",
      "startTime": "2024-05-01T09:00:00Z",
      "state": "SCHEDULED"
    }
  ]
  ```

### GET `/exam/exams/{id}`

Returns exam metadata and its questions for the current tenant.

- **Auth**: Any authenticated user in the same tenant.
- **Headers**:
  - `X-Tenant-Id`.
- **Path variable**: `id` – exam UUID.
- **Response** `200 OK`:

  ```json
  {
    "id": "exam-uuid",
    "title": "Midterm",
    "description": "CS101 midterm",
    "startTime": "2024-05-01T09:00:00Z",
    "state": "LIVE",
    "questions": [
      { "id": "q-1", "text": "What is Java?", "sortOrder": 1 }
    ]
  }
  ```

  - If the exam does not exist for the tenant, returns `404 Not Found`.

### POST `/exam/exams`

Creates an exam (teacher/admin only).

- **Auth**: `TEACHER` or `ADMIN`, enforced by gateway and service.
- **Headers**:
  - `X-User-Id`, `X-User-Role`, `X-Tenant-Id`.
- **Request body**:

  ```json
  {
    "title": "Midterm",
    "description": "CS101 midterm",
    "startTime": "2024-05-01T09:00:00Z",
    "questions": [
      { "text": "What is Java?" }
    ]
  }
  ```

- **Responses**:
  - `201 Created` – returns `ExamDto`:

    ```json
    {
      "id": "exam-uuid",
      "title": "Midterm",
      "description": "CS101 midterm",
      "startTime": "2024-05-01T09:00:00Z",
      "state": "SCHEDULED"
    }
    ```

  - `403 Forbidden` – if role is not TEACHER/ADMIN.

### POST `/exam/exams/{id}/start`

Starts an exam and transitions its state using the **State pattern**, invokes Notification via **Circuit Breaker**, and emits an `ExamStartedEvent`.

- **Auth**: Exam creator with role `TEACHER`/`ADMIN`.
- **Headers**:
  - `X-User-Id`, `X-User-Role`, `X-Tenant-Id`.
- **Responses**:
  - `200 OK` – returns updated `ExamDto` with `state: "LIVE"`.
  - `403 Forbidden` – if caller is not exam creator or lacks required role.
  - `404 Not Found` – exam not found for tenant.
  - `409 Conflict` – if state transition invalid (e.g. exam already live or closed).

**Resilience**:

- Notification failures do **not** prevent exam from starting; Circuit Breaker fallback logs and continues.

### POST `/exam/exams/{id}/submit`

Submits answers for an exam.

- **Auth**: `STUDENT` only (service-level check).
- **Headers**:
  - `X-User-Id`, `X-User-Role`, `X-Tenant-Id`.
- **Request body**:

  ```json
  {
    "answers": {
      "q1": "42",
      "q2": "Because microservices"
    }
  }
  ```

- **Responses**:
  - `201 Created` – submission accepted.
  - `403 Forbidden` – non-student role.
  - `404 Not Found` – exam not found.
  - `409 Conflict` – exam not accepting submissions (state not `LIVE`) or duplicate submission.

---

## 6. Notification Service – `/notification/**` and Events

### POST `/notification/notify/exam/{examId}`

Exam Service uses this endpoint to request notifications.

- **Auth**: Gateway JWT.
- **Headers**:
  - `X-Tenant-Id`.
- **Path variable**: `examId`.
- **Responses**:
  - `202 Accepted` – notification request logged.
  - `401 Unauthorized` – missing tenant header (service-side guard).

### RabbitMQ Subscriptions

Notification Service listens to:

- Queue `notification.order-confirmed` (routing key `market.order.confirmed`).
- Queue `notification.exam-started` (routing key `exam.exam.started`).

For each event, a `NotificationLog` entry is stored.

---

## 7. Dashboard Service – `/dashboard/**`

### GET `/dashboard/sensors`

Returns live sensor readings per tenant, backed by the Dashboard service's PostgreSQL database.

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-Tenant-Id`.
- **Response** `200 OK`:

  ```json
  [
    {
      "id": "sensor-uuid",
      "type": "TEMPERATURE",
      "label": "Lecture Hall Temp",
      "value": 22.5,
      "unit": "°C",
      "updatedAt": "2024-05-01T09:00:05Z"
    }
  ]
  ```

### GET `/dashboard/shuttles`

Returns simulated shuttle locations.

- **Auth**: Any authenticated user.
- **Headers**:
  - `X-Tenant-Id`.
- **Response**:

  ```json
  [
    {
      "id": "shuttle-uuid",
      "name": "Campus Shuttle A",
      "latitude": 52.5201,
      "longitude": 13.4049,
      "updatedAt": "2024-05-01T09:00:07Z"
    }
  ]
  ```

---

## 8. API Gateway Behaviour

All calls from the SPA go to the Gateway (default `http://localhost:8080`):

- `/auth/**` – forwarded directly to Auth, without JWT requirement.
- `/booking/**`, `/market/**`, `/payment/**`, `/exam/**`, `/notification/**`, `/dashboard/**`:
  - Require `Authorization: Bearer <JWT>`.
  - On success, Gateway:
    - Validates JWT using shared secret.
    - Performs basic RBAC for sensitive routes:
      - `POST /market/products` → TEACHER/ADMIN.
      - `POST /booking/resources` → TEACHER/ADMIN.
      - `POST /exam/exams` → TEACHER/ADMIN.
    - Injects `X-User-Id`, `X-User-Role`, `X-Tenant-Id`.

Typical SPA configuration:

- `VITE_API_BASE_URL=http://localhost:8080`
- Axios instance adds the `Authorization` header from the stored JWT; Gateway takes care of the rest.

---

## 9. OpenAPI / Swagger Endpoints

In addition to this textual overview, each Spring Boot service (except the Gateway) exposes an OpenAPI description and Swagger UI when running in local dev:

- **Auth Service** (port 8081):
  - OpenAPI JSON: `http://localhost:8081/v3/api-docs`
  - Swagger UI: `http://localhost:8081/swagger-ui.html`

- **Booking Service** (port 8082):
  - OpenAPI JSON: `http://localhost:8082/v3/api-docs`
  - Swagger UI: `http://localhost:8082/swagger-ui.html`

- **Marketplace Service** (port 8083):
  - OpenAPI JSON: `http://localhost:8083/v3/api-docs`
  - Swagger UI: `http://localhost:8083/swagger-ui.html`

- **Payment Service** (port 8084):
  - OpenAPI JSON: `http://localhost:8084/v3/api-docs`
  - Swagger UI: `http://localhost:8084/swagger-ui.html`

- **Exam Service** (port 8085):
  - OpenAPI JSON: `http://localhost:8085/v3/api-docs`
  - Swagger UI: `http://localhost:8085/swagger-ui.html`

- **Notification Service** (port 8086):
  - OpenAPI JSON: `http://localhost:8086/v3/api-docs`
  - Swagger UI: `http://localhost:8086/swagger-ui.html`

- **Dashboard Service** (port 8087):
  - OpenAPI JSON: `http://localhost:8087/v3/api-docs`
  - Swagger UI: `http://localhost:8087/swagger-ui.html`

These documents are generated from the controllers and DTO annotations (via `springdoc-openapi`) and are useful for interactive exploration and client generation.

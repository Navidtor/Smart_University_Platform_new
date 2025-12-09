# ADR 002 – Multi-Tenancy Strategy

## Status

Accepted

## Context

The platform must support multiple **faculties / tenants** (e.g. Engineering, Business), with:

- Shared infrastructure (clusters, services).
- Strict data isolation between tenants.
- Simple development and local deployment experience.

We must choose a multi-tenancy strategy that balances:

- Isolation and security.
- Operational complexity.
- Implementation effort within this project.

## Options Considered

1. **Separate database per tenant per service**
   - Pros: Strongest isolation; easy data export.
   - Cons: Explosive number of schemas/instances; significant operational overhead.

2. **Single database per service with a `tenant_id` discriminator (row-level multi-tenancy)**
   - Pros: Simple to implement; manageable for our scale; still enforces separation.
   - Cons: Logical rather than physical isolation; queries must respect tenant filters.

3. **Schema per tenant within the same database**
   - Pros: Some isolation benefits of (1) with fewer instances.
   - Cons: More complex migration and connection management.

## Decision

We use **Option 2**: **row-level multi-tenancy per service**.

- Each *service* has its own **PostgreSQL database**, but within that database we store data for multiple tenants.
- Every tenant-specific table includes a `tenant_id` column, e.g.:
  - `users(tenant_id, ...)`
  - `resources(tenant_id, ...)`
  - `products(tenant_id, ...)`
  - `exams(tenant_id, ...)`
  - etc.
- Service-layer code always uses the tenant id when querying and modifying data, for example:
  - `findByIdAndTenantId(...)`
  - `findAllByTenantId(...)`

Tenant id is propagated and enforced as follows:

1. **Auth Service**
   - Attaches `tenant` claim into the JWT.
2. **Gateway Service**
   - Validates JWT.
   - Extracts `tenant` claim.
   - Injects `X-Tenant-Id` header on downstream requests.
3. **Backend services**
   - Expect `X-Tenant-Id` header and treat it as mandatory for tenant-scoped endpoints.
   - Use it in repository methods to scope database access.

## Rationale

- **Balanced isolation**: Each bounded context has its own database, preventing cross-context coupling while still allowing multiple tenants per context.
- **Operational simplicity**: A fixed number of Postgres instances (one per service) is easy to manage with docker-compose and CI.
- **Sufficient security** for project scope:
  - Tenant id flows from JWT, through gateway, into each service.
  - No endpoints allow omitting or overriding the tenant context.

The approach also integrates well with:

- **Saga & Event-driven patterns**:
  - Events include `tenantId` so consumers can log and process within tenant context.
- **Caching and read-optimisation**:
  - Common patterns like per-tenant caches remain straightforward.

## Consequences

- **Positive**:
  - Simple multi-tenancy model that developers can reason about.
  - The same service instance can serve multiple tenants, reducing duplication.
  - Easy local setup via docker-compose.

- **Negative / Trade-offs**:
  - Strong isolation (e.g. per-tenant backups or geo-distribution) is not as straightforward as dedicated databases per tenant.
  - All queries must be carefully written to include `tenant_id` filters to avoid data leakage.

This decision is appropriate for the scale and educational nature of this project. If requirements evolve to strict per-client isolation, we can revisit using per-tenant databases or separate clusters.
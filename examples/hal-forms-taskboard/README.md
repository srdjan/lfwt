# HAL-FORMS Taskboard

This example assembles a small task board service to demonstrate the LFTS web primitives:

- `router` and `middleware` for typed HTTP handling.
- HAL discovery documents and HAL-FORMS templates generated with branded relations.
- Middleware registry (`composeNamed`) to share auth, rate-limit, role, and idempotency policies.

## What you get

- `GET /` – HTMX-driven UI that consumes the hypermedia endpoints.
- `GET /.well-known/hal` – entry point describing available affordances.
- `GET /forms` – HAL-FORMS payload describing how to create tasks.
- `POST /tasks` – idempotent task creation guarded by API key + admin role.
- `GET /tasks` – task listing rendered as JSON or HAL.

The store is in-memory but the service is structured so ports (`KV`, middleware) can be swapped for
production.

## Running the server

```bash
deno run -A examples/hal-forms-taskboard/main.ts
```

Then open `http://localhost:8700`.

Use the following headers on POST requests (HTMX buttons in the page set them for you):

- `x-api-key: demo-admin-123`
- `x-roles: admin`
- `idempotency-key: <uuid>` (HTMX demo uses `task-demo-1`)

## Why it matters

The example focuses on hypermedia-first design: clients start from `/.well-known/hal`, follow links,
and rely on HAL-FORMS templates to understand the actions they can perform. Middleware composition
keeps concerns like auth, rate limiting, and idempotency declarative.

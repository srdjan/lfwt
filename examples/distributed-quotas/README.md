# Distributed Quotas

The rate-limit middleware in LFWT only depends on the `KV` port. This example shows how swapping KV
adapters changes the persistence characteristics of your quota system without touching the
middleware or route logic.

## Scenarios

- `run_memory.ts` – in-memory counters for local development.
- `run_sqlite.ts` – file-backed counters using SQLite (works in containers and serverless functions
  with writable disk).
- `run_denokv.ts` – Deno KV-backed counters for globally replicated quotas.

Each script launches the same minimal API with a single rate-limited endpoint (`GET /quota`).
Requests require an `x-api-key` header; the rate limit is 5 requests per minute per key. Responses
include the current count so you can observe persistence behaviour across runs.

## Running the servers

```bash
# Memory (stateless, resets on server restart)
deno run -A examples/distributed-quotas/run_memory.ts

# SQLite (persists in kv.db)
deno run -A examples/distributed-quotas/run_sqlite.ts

# Deno KV (requires Deno KV support; data stored in deno-kv directory)
deno run -A --unstable examples/distributed-quotas/run_denokv.ts
```

Then call the endpoint:

```bash
curl -H "x-api-key: demo" http://localhost:8800/quota
```

Restart the servers to observe the differences: the memory variant resets on every boot, the SQLite
version keeps the counter on disk, and the Deno KV version shares counts across multiple processes
pointed at the same KV store.

## Why it matters

Rate limiting, idempotency, and other coordination patterns should not hard-code storage choices. By
targeting the `KV` port, applications can fit different deployment targets (local dev, single-node,
globally replicated) with tiny configuration changes.

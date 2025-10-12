# Resilient Data Pipeline

This example turns the `fetchTodo` helper from `packages/core` into a small ingestion pipeline and
contrasts a naive implementation with the MacroFX-powered version.

## What it demonstrates

- Wrapping effectful functions with `withCache`, `withRetry`, and `withTimeout`.
- Structuring code around the `Deps` pattern so infrastructure concerns (logger, HTTP client, KV
  store) stay swappable.
- Observing behaviour via structured logging to understand the impact of resilience policies.

## Files

- `baseline.ts` – sequential fetch loop that has no caching, retries, or timeouts.
- `macrofx.ts` – the same loop wrapped with MacroFX combinators and backed by a KV cache.

Both scripts ingest TODOs `1..3` from `jsonplaceholder.typicode.com` and print the titles.

## Running the scripts

```bash
# Naive version – expect repeated outbound calls and fragile behaviour if the API slows down.
deno run -A examples/resilient-data-pipeline/baseline.ts

# MacroFX version – observe cached hits, retries on simulated failures, and timeout protection.
deno run -A examples/resilient-data-pipeline/macrofx.ts
```

Try running `macrofx.ts` twice; the second run will hit cache for the same TODO ids and skip remote
calls.

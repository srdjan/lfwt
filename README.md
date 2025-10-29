# Light Functional Web Toolkit

A modular TypeScript toolkit for building resilient services with strong nominal typing, reusable
macro-style effects, and HAL/HATEOAS-friendly web surfaces. Everything runs on Deno for a
zero-config developer experience.

- Branded (nominal) types keep IDs, units, and headers unambiguous across services.
- MacroFX-style helpers (`withCache`, `withRetry`, `withTimeout`) wrap side-effecting code with
  resilience policies.
- A lightweight web layer serves HAL and HAL-FORMS documents, HTMX-friendly SSR, and typed
  middleware composition.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Repository Layout](#repository-layout)
- [Getting Started](#getting-started)
- [Packages](#packages)
- [Example Workflows](#example-workflows)
- [Architecture Notes](#architecture-notes)
- [Testing](#testing)
- [Development Tips](#development-tips)
- [Examples](#examples)
- [Next Ideas](#next-ideas)

## Overview

The repo demonstrates how functional-first patterns can improve day-to-day TypeScript work:

- **Branded types** model identifiers, headers, and domain-specific numbers without runtime cost.
- **Macro-style decorators** keep retry, timeout, and caching policies close to the functions they
  protect.
- **HAL/HATEOAS-first HTTP** keeps hypermedia contracts explicit, pairing nicely with HTMX-powered
  SSR.
- **Port/adapter layering** isolates core use-cases behind small interfaces for portability across
  runtimes.

The `apps/` directory hosts runnable demos (CLI + SSR server) that wire the packages together. Each
package is self-contained and can be reused independently.

## Key Features

- ✅ Nominal typing utilities (`Brand`, constructors, validators) with accompanying tests.
- ✅ Core service helpers built on declarative dependency injection (`Deps`) rather than global
  state.
- ✅ Drop-in resilience macros for caching, retrying, and timing out effectful functions.
- ✅ KV abstractions with interchangeable in-memory, Deno KV, and SQLite-backed implementations.
- ✅ Typed router, middleware registry, and HAL/HAL-FORMS helpers for hypermedia APIs.
- ✅ Out-of-the-box HTMX SSR demo showcasing HAL discovery, forms, auth, rate limiting, and
  idempotency.

## Repository Layout

```
apps/
  examples/      # CLI demo (macro composition + branded types)
  ssr/           # HTMX SSR server with HAL/HATEOAS endpoints
  tests/         # Deno tests (validation constructors, etc.)
examples/        # Standalone example applications with focused READMEs
packages/
  core/          # Branded types, ports/adapters, shared services
  macrofx/       # Macro-style effect wrappers (cache/retry/timeout)
  web/           # Router, middleware, HAL utilities, typed headers
  kv-deno/       # Deno KV adapter implementing the core KV port
  kv-sqlite/     # SQLite adapter for the KV port
deno.jsonc       # Deno tasks, fmt configuration, import map
import_map.json  # Aliases for stdlib and 3rd-party deps
```

## Getting Started

### Prerequisites

- [Install Deno](https://deno.land) (v2.5+ recommended).
- Optional: SQLite (`sqlite3`) installed locally when experimenting with the `kv-sqlite` package.

### Install dependencies

The project avoids external package managers. As long as Deno is installed, the repo is ready to
run.

### Useful tasks

Configured in `deno.jsonc`:

```bash
deno task start:ssr   # Launch the HTMX SSR demo on http://localhost:8080
deno task example:cli # Run the CLI example (cache + retry + timeout)
deno task test        # Execute the Deno test suite
```

All tasks execute with `-A` (allow-all) permissions to simplify local development. Adjust flags if
you need a tighter sandbox.

## Packages

### `packages/core`

- `src/types/nominal.ts` and `src/lib/brand.ts`: strongly-typed brand helpers (`UserId`, `ApiKey`,
  `Milliseconds`, etc.).
- `src/types/constructors.ts`: runtime validators (`EmailFrom`, `PositiveIntFrom`, `ApiKeyFrom`, …).
- `src/lib/pipe.ts` & `src/lib/result.ts`: minimal functional primitives.
- `src/ports/*.ts`: tiny interfaces for `Logger`, `Http`, `Clock`, and `KV`.
- `src/adapters/*.ts`: ready-made adapters (`ConsoleLogger`, `FetchHttp`, `MemoryKV`).
- `src/services.ts`: reusable business functions composed from a `Deps` object (e.g., `timeNow`,
  `fetchJson`, `fetchTodo`, `bumpCounter`).

Use this package as the foundation for shared types and side-effect ports across services.

### `packages/macrofx`

Macro-like combinators that wrap dependency-injected functions:

- `withCache(ttl, fn)` caches responses (KV-backed by convention).
- `withRetry(retries, delay, fn)` retries on failure with a linear backoff.
- `withTimeout(ms, fn)` races the inner function against a timeout.

Because they operate on `WithDeps`, you can stack them compositionally:

```ts
const resilientTodo = withTimeout(2000, withRetry(2, 100, withCache(15_000, fetchTodo)))
```

### `packages/web`

- `router.ts`: declarative route table + middleware composer.
- `middleware.ts`: opinionated middlewares (`auth`, `rateLimit`).
- `mw_registry.ts`: a named middleware registry so routes can opt-in by name.
- `extras.ts`: higher-level middleware (role-based access, idempotency).
- `hal_forms.ts`: builders for HAL/HAL-FORMS links, templates, and properties.
- `typed_headers.ts`: parse and brand important headers (`x-api-key`, `idempotency-key`).

This package keeps HTTP concerns modular while retaining strong typing.

### `packages/kv-deno` & `packages/kv-sqlite`

Adapters that fulfill the `KV` port:

- `kv-deno`: wraps `Deno.openKv`, supporting TTL and atomic increments.
- `kv-sqlite`: file-backed store using `deno.land/x/sqlite`, including TTL eviction.

Swap them in wherever the `KV` dependency is supplied.

## Example Workflows

### CLI demo (`apps/examples/cli.ts`)

```ts
const deps = {
  log: ConsoleLogger,
  http: FetchHttp,
  clock: { now: () => new Date() },
  kv: MemoryKV(),
}
const composed = withTimeout(2000, withRetry(2, 100, withCache(10_000, fetchTodo)))
const todo = await composed(deps)(ApiKeyFrom("demo-key-123"), PositiveIntFrom(1))
```

The example showcases:

- Dependency injection via explicit `deps`.
- Branded validators guarding external input (`ApiKeyFrom`, `PositiveIntFrom`).
- Macro composition delivering caching, retry, and timeout in ~3 lines.

### SSR demo (`apps/ssr/main.ts`)

- Serves an HTMX-powered dashboard (`GET /`).
- Streams HAL discovery at `/.well-known/hal` and HAL-FORMS at `/forms`.
- Protects `/ext` with `auth` + `rateLimit` middlewares and optional API keys.
- Adds idempotency guarantees to `/echo`, and role-based guard to `/admin`.
- Demonstrates middleware registry composition (`composeNamed`) and state injection.

Run `deno task start:ssr`, then open http://localhost:8080 to explore links, forms, and HTMX
interactions.

## Architecture Notes

- **Ports & Adapters**: All external effects (logging, HTTP, KV, timing) pass through interfaces,
  making it straightforward to stub or replace them in tests.
- **Nominal Safety**: Brands and constructor functions prevent mixing incompatible IDs, counters, or
  headers. Use `asType` helpers sparingly and prefer the runtime constructors.
- **MacroFX Composition**: Effects stay pure and composable; macros return new `WithDeps` functions
  without losing type information.
- **Hypermedia-first APIs**: HAL helpers keep link relations branded (`Rel`, `Href`), while
  HAL-FORMS builders describe actionable forms for clients.
- **Middleware Registry**: Named middleware stacks allow declarative policies per route and clean
  reuse between SSR handlers and API endpoints.

## Testing

The repo currently includes targeted tests in `apps/tests`. Run them with:

```bash
deno task test
```

Add new tests by placing files under `apps/tests` (or any path matched by Deno’s default glob) and
exporting `Deno.test` suites. Because the code uses ports and explicit dependencies, you can pass in
fakes or in-memory adapters in tests without additional tooling.

## Development Tips

- Prefer composing functions with the `Deps` pattern rather than importing singletons.
- Reach for `withCache`/`withRetry`/`withTimeout` early—tying resilience to the call site keeps
  intent obvious.
- Use branded constructors whenever data crosses trust boundaries (HTTP headers, request bodies, KV
  payloads).
- The import map (`import_map.json`) already maps `@std/` and `sqlite`; extend it as more
  third-party modules are needed.
- Run `deno fmt` before committing to respect the repo’s formatting preferences.

## Examples

- `examples/type-safe-onboarding` – contrasts naive onboarding flows with branded constructors that
  prevent identifier/header mix-ups.
- `examples/resilient-data-pipeline` – demonstrates how MacroFX turns flaky upstream fetches into a
  resilient, cached ingestion loop.
- `examples/hal-forms-taskboard` – showcases HAL discovery, HAL-FORMS templates, and typed
  middleware in an HTMX-friendly task board.
- `examples/distributed-quotas` – swaps `KV` adapters (memory, SQLite, Deno KV) to power rate limits
  without touching route logic.

## Next Ideas

- Add more branded constructors (`Currency`, `Locale`, etc.) and domain modules under
  `packages/core`.
- Build additional middleware (e.g., tracing, structured logging) and register them by name.
- Expand the test suite with integration tests that exercise both KV backends.
- Experiment with deploying the SSR app to Deno Deploy or another edge runtime by swapping adapters.

Happy hacking! Contributions and experiments are welcome—fork, branch, and start composing macros.

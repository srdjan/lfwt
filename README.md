# Monorepo: Light Functional TypeScript + MacroFX-style Macros (Deno, No Build)

This monorepo demonstrates:
- **Light Functional TypeScript** with interfaces as ports/capabilities
- **MacroFX-style macros**: cache, retry, timeout (+ sink/logger)
- **Durable KV** via Deno KV and SQLite adapters
- **HAL/HTMX SSR demo** sharing the same pure core services
- **Typed Router + Middleware** (auth, rate limit) as composable functions

## Structure

```
apps/
  ssr/                # SSR app: HAL JSON + HTMX HTML, typed routing, middleware
  examples/           # CLI and workflows using shared packages
packages/
  core/               # pure domain, ports, adapters (console, fetch, memory kv)
  macrofx/            # macros: cache, retry, timeout, sink (console), env
  kv-deno/            # Deno KV adapter implementing the KV port
  kv-sqlite/          # SQLite adapter implementing the KV port
  web/                # tiny typed router + middleware (auth, rate limit)
```

## Run

```bash
deno task start:ssr     # starts SSR server on :8080
deno task example:cli   # run CLI demo
deno task test          # unit tests
```

Permissions: `-A` recommended for simplicity (KV, net, sqlite file).

---

## Highlights

- **Ports/Capabilities** in `packages/core/src/ports/*`
- **Adapters** in `packages/core/src/adapters/*` + durable `kv-deno` and `kv-sqlite`
- **Macros** in `packages/macrofx/src/*` usable around any `(deps) => ...` function
- **SSR**: HAL endpoint (`application/hal+json`) + HTMX views reuse the same services
- **Router**: typed handlers + composable middleware (`auth`, `rateLimit`)

Enjoy!

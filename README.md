# LFTS Monorepo (Branded Types + HATEOAS + Macros)

- Light Functional TypeScript
- Nominal (branded) types for IDs, units, keys, tokens
- MacroFX-style macros (cache/retry/timeout)
- HAL + HAL-FORMS for HATEOAS (service↔service/agent) + HTMX SSR
- Typed router + middleware registry (auth/rate/idempotency/roles)
- Pluggable KV backends (Memory, DenoKV, SQLite)

Run:
```bash
deno task start:ssr
deno task example:cli
deno task test
```

## SSR App

- `/` — HTMX HTML
- `/time` — server time (auto-updates)
- `/echo` — HTMX POST demo
- `/ext` — cached external fetch (requires `x-api-key` header)
- `/.well-known/hal` — HAL JSON

The SSR app reuses the same pure services and can switch KV backends.

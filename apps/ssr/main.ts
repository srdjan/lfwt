import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { timeNow, bumpCounter, fetchJson } from "../../packages/core/src/services.ts"
import { withCache } from "../../packages/macrofx/src/cache.ts"
import { router } from "../../packages/web/src/router.ts"
import { auth, rateLimit } from "../../packages/web/src/middleware.ts"
import { defineRegistry, composeNamed } from "../../packages/web/src/mw_registry.ts"
import { requireRole, idempotency } from "../../packages/web/src/extras.ts"
import { hal, tmpl, prop } from "../../packages/web/src/hal_forms.ts"

// Switch KV backends here (MemoryKV | DenoKV | SqliteKV)
const kv = MemoryKV()

const deps = { log: ConsoleLogger, http: FetchHttp, clock: { now: () => new Date() }, kv }

// decorated fetch with cache
const cachedFetch = withCache({ key: (url: string) => `cache:${url}`, ttlMs: 15_000 }, fetchJson)

// Middleware registry
const Registry = defineRegistry<{ req: Request; url: URL; state?: any }>()({
  auth: auth((req) => !!req.headers.get("x-api-key")),
  rate: rateLimit(20, 60_000, (r) => r.headers.get("x-api-key") ?? "anon", async (key) => {
    if (deps.kv.incr) return deps.kv.incr(key)
    const cur = (await deps.kv.get<number>(key)) ?? 0; const next = cur + 1; await deps.kv.set(key, next); return next
  }),
  idempotent: idempotency(
    (req) => req.headers.get("idempotency-key"),
    async (key) => (await deps.kv.get(`idem:${key}`)) === true,
    async (key, ttl) => deps.kv.set(`idem:${key}`, true, ttl),
    60_000
  ),
  adminOnly: requireRole("admin"),
})

// Request-scoped state enrichment (demo user from header)
const withUserState = (req: Request) => {
  const roles = (req.headers.get("x-roles") ?? "").split(",").filter(Boolean)
  return { user: { id: "demo", roles } }
}

const routes = router([
  {
    method: "GET", path: "/",
    handler: async ({ url }) => {
      const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>LFTS SSR</title>
  <script src="https://unpkg.com/htmx.org@1.9.12"></script>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    .card { border: 1px solid #ddd; padding: 1rem; border-radius: .5rem; }
    .row { display: flex; gap: 1rem; align-items: center; }
    .muted { color: #666 }
    button { padding: .4rem .7rem; }
    code { background: #f6f6f6; padding: .1rem .3rem; border-radius: .3rem; }
  </style>
</head>
<body>
  <h1>Light Functional TS — SSR + HAL/HTMX</h1>
  <p class="muted">Try: <code>curl -H "x-api-key: demo" http://localhost:8080/ext</code></p>
  <div class="card">
    <div class="row">
      <strong>Server Time:</strong>
      <span id="t" hx-get="/time" hx-trigger="load, every 5s" hx-swap="outerHTML">loading…</span>
    </div>
    <div class="row">
      <button hx-post="/echo" hx-vals='{"msg":"hello"}' hx-target="#echo" hx-swap="innerHTML" hx-headers='{"idempotency-key":"abc"}'>Echo</button>
      <div id="echo" class="muted">click Echo</div>
    </div>
    <div class="row">
      <button hx-get="/ext" hx-target="#ext" hx-swap="innerHTML" hx-headers='{"x-api-key":"demo"}'>Fetch External</button>
      <div id="ext" class="muted">try external fetch</div>
    </div>
    <div class="row">
      <a href="/.well-known/hal">HAL</a>
      <a href="/forms">HAL-FORMS</a>
      <a href="/admin">Admin (requires role)</a>
    </div>
  </div>
</body>
</html>`
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })
    }
  },
  {
    method: "GET", path: "/time",
    handler: async () => {
      const now = timeNow(deps)().toISOString()
      return new Response(`<span id="t">${now}</span>`, { headers: { "content-type": "text/html" } })
    }
  },
  {
    method: "POST", path: "/echo",
    handler: async (ctx) => {
      const body = await ctx.req.json().catch(() => ({}))
      const n = await bumpCounter(deps)("ssr:echo")
      return new Response(`<pre>${JSON.stringify({ n, body }, null, 2)}</pre>`, { headers: { "content-type": "text/html" } })
    }
  },
  {
    method: "GET", path: "/ext",
    handler: async () => {
      const data = await cachedFetch(deps)("https://jsonplaceholder.typicode.com/todos/1")
      return new Response(`<code>${data ? data.title : "fetch failed"}</code>`, { headers: { "content-type": "text/html" } })
    }
  },
  {
    method: "GET", path: "/admin",
    handler: async (ctx) => {
      return new Response("Welcome, admin!", { headers: { "content-type": "text/plain" } })
    }
  },
  {
    method: "GET", path: "/.well-known/hal",
    handler: async ({ url }) => {
      const doc = hal({
        self: { href: "/.well-known/hal" },
        time: { href: "/time" },
        echo: { href: "/echo" },
        ext: { href: "/ext" },
        forms: { href: "/forms" }
      }, undefined, { name: "LFTS SSR Demo" })
      return new Response(JSON.stringify(doc, null, 2), { headers: { "content-type": "application/hal+json" } })
    }
  },
  {
    method: "GET", path: "/forms",
    handler: async ({ url }) => {
      const forms = hal({
        self: { href: "/forms" }
      }, {
        echo: tmpl({
          title: "Echo message",
          method: "POST",
          contentType: "application/json",
          target: "/echo",
          properties: [
            prop({ name: "msg", prompt: "Message", required: true })
          ]
        }),
        ext: tmpl({
          title: "Fetch external TODO",
          method: "GET",
          target: "/ext",
          properties: []
        })
      })
      return new Response(JSON.stringify(forms, null, 2), { headers: { "content-type": "application/prs.hal-forms+json" } })
    }
  }
])

// Wire base app
const base = routes({})

// Lift into middleware-aware server
const serveWith = (names: string[]) => {
  const apply = composeNamed(Registry, names)
  const handler = apply(base as any)
  return (req: Request) => handler({ req, url: new URL(req.url), state: withUserState(req) })
}

Deno.serve({ port: 8080 }, (req) => {
  const url = new URL(req.url)
  // Protect /ext with auth + rateLimit, /echo with idempotency, /admin with role + auth
  if (url.pathname === "/ext") return serveWith(["auth", "rate"])(req)
  if (url.pathname === "/echo") return serveWith(["idempotent"])(req)
  if (url.pathname === "/admin") return serveWith(["auth"])(req).then(r => {
    // after auth, enforce admin role
    if (r.status === 200) {
      // re-run through admin-only guard using state
      const adminGuard = composeNamed(Registry, ["adminOnly"])(base as any)
      return adminGuard({ req, url, state: withUserState(req) } as any)
    }
    return r
  })
  // default
  return base(req)
})

console.log("SSR server on http://localhost:8080 (HAL, HAL-FORMS, HTMX, typed middleware registry)")

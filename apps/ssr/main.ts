import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { bumpCounter, fetchJson, fetchTodo, timeNow } from "../../packages/core/src/services.ts"
import { withCache, withRetry, withTimeout } from "../../packages/macrofx/src/mod.ts"
import { router } from "../../packages/web/src/router.ts"
import { auth, rateLimit } from "../../packages/web/src/middleware.ts"
import { composeNamed, defineRegistry } from "../../packages/web/src/mw_registry.ts"
import { idempotency, requireRole } from "../../packages/web/src/extras.ts"
import { hal, HREF, prop, REL, tmpl } from "../../packages/web/src/hal_forms.ts"
import { getApiKey, getIdemKey } from "../../packages/web/src/typed_headers.ts"
import { ApiKeyFrom, PositiveIntFrom } from "../../packages/core/src/types/constructors.ts"

const kv = MemoryKV()
const deps = { log: ConsoleLogger, http: FetchHttp, clock: { now: () => new Date() }, kv }

const resilientFetch = withTimeout(2000, withRetry(2, 100, withCache(15_000, fetchJson)))
const resilientTodo = withTimeout(2000, withRetry(2, 100, withCache(15_000, fetchTodo)))

const Registry = defineRegistry<{ req: Request; url: URL; state?: any }>()({
  auth: auth((req) => !!getApiKey(req)),
  rate: rateLimit(
    20,
    60_000,
    (r) => getApiKey(r) ?? "anon",
    async (key) =>
      deps.kv.incr ? deps.kv.incr(String(key)) : (await bumpCounter({ kv: deps.kv })(String(key))),
  ),
  idempotent: idempotency(
    (req) => getIdemKey(req),
    async (key) => (await deps.kv.get(`idem:${key}`)) === true,
    async (key, ttl) => deps.kv.set(`idem:${key}`, true, ttl),
    60_000,
  ),
  adminOnly: requireRole("admin"),
})

const routes = router([
  {
    method: "GET",
    path: "/",
    handler: async ({ url }) => {
      const html = `<!doctype html><html><head>
      <meta charset="utf-8" /><title>LFWT SSR</title>
      <script src="https://unpkg.com/htmx.org@1.9.12"></script>
      <style>body{font-family:system-ui;margin:2rem}.card{border:1px solid #ddd;padding:1rem;border-radius:.5rem}.row{display:flex;gap:1rem;align-items:center}.muted{color:#666}</style>
    </head><body>
      <h1>LFWT — Branded Types + HAL/HATEOAS + Macros</h1>
      <div class="card">
        <div class="row"><strong>Time:</strong><span id="t" hx-get="/time" hx-trigger="load, every 5s" hx-swap="outerHTML">…</span></div>
        <div class="row"><button hx-post="/echo" hx-vals='{"msg":"hello"}' hx-headers='{"idempotency-key":"demo-abc-123"}' hx-target="#out" hx-swap="innerHTML">Echo</button><div id="out" class="muted">click</div></div>
        <div class="row"><button hx-get="/ext" hx-headers='{"x-api-key":"demo-key-123"}' hx-target="#ext" hx-swap="innerHTML">External</button><div id="ext" class="muted">load</div></div>
        <div class="row"><a href="/.well-known/hal">HAL</a> <a href="/forms">HAL-FORMS</a> <a href="/admin">Admin</a></div>
      </div>
    </body></html>`
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } })
    },
  },
  {
    method: "GET",
    path: "/time",
    handler: async () =>
      new Response(`<span id="t">${timeNow(deps)().toISOString()}</span>`, {
        headers: { "content-type": "text/html" },
      }),
  },
  {
    method: "POST",
    path: "/echo",
    handler: async (ctx) => {
      const body = await ctx.req.json().catch(() => ({}))
      const n = await bumpCounter(deps)("ssr:echo")
      return new Response(`<pre>${JSON.stringify({ n, body }, null, 2)}</pre>`, {
        headers: { "content-type": "text/html" },
      })
    },
  },
  {
    method: "GET",
    path: "/ext",
    handler: async (ctx) => {
      const key = getApiKey(ctx.req)
      if (!key) return new Response("Unauthorized", { status: 401 })
      const todo = await resilientTodo(deps)(key, PositiveIntFrom(1))
      return new Response(`<code>${todo ? todo.title : "failed"}</code>`, {
        headers: { "content-type": "text/html" },
      })
    },
  },
  {
    method: "GET",
    path: "/.well-known/hal",
    handler: async ({ url }) => {
      const doc = hal(
        {
          [REL("self")]: { href: HREF("/.well-known/hal") },
          [REL("time")]: { href: HREF("/time") },
          [REL("echo")]: { href: HREF("/echo") },
          [REL("ext")]: { href: HREF("/ext") },
          [REL("forms")]: { href: HREF("/forms") },
        },
        undefined,
        { name: "LFWT SSR Demo (Branded)" },
      )
      return new Response(JSON.stringify(doc, null, 2), {
        headers: { "content-type": "application/hal+json" },
      })
    },
  },
  {
    method: "GET",
    path: "/forms",
    handler: async () => {
      const forms = hal({ [REL("self")]: { href: HREF("/forms") } }, {
        echo: tmpl({
          title: "Echo",
          method: "POST",
          target: "/echo",
          properties: [prop({ name: "msg", prompt: "Message", required: true })],
        }),
        ext: tmpl({ title: "Fetch external TODO", method: "GET", target: "/ext", properties: [] }),
      })
      return new Response(JSON.stringify(forms, null, 2), {
        headers: { "content-type": "application/prs.hal-forms+json" },
      })
    },
  },
  {
    method: "GET",
    path: "/admin",
    handler: async () =>
      new Response("Welcome, admin!", { headers: { "content-type": "text/plain" } }),
  },
])

const base = routes({})

const withUserState = (req: Request) => ({
  user: { id: "demo", roles: (req.headers.get("x-roles") ?? "").split(",").filter(Boolean) },
})

const serveWith = (names: string[]) => {
  const apply = composeNamed(Registry, names)
  const handler = apply(base as any)
  return (req: Request) => handler({ req, url: new URL(req.url), state: withUserState(req) })
}

Deno.serve({ port: 8080 }, (req) => {
  const url = new URL(req.url)
  if (url.pathname === "/ext") return serveWith(["auth", "rate"])(req)
  if (url.pathname === "/echo") return serveWith(["idempotent"])(req)
  if (url.pathname === "/admin") {
    return serveWith(["auth"])(req).then((r) => {
      if (r.status !== 200) return r
      const adminGuard = composeNamed(Registry, ["adminOnly"])(base as any)
      return adminGuard({ req, url, state: withUserState(req) } as any)
    })
  }
  return base(req)
})

console.log("SSR on http://localhost:8080 — Branded types + HATEOAS + Macros")

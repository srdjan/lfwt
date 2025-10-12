import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { bumpCounter } from "../../packages/core/src/services.ts"
import type { KV } from "../../packages/core/src/ports/kv.ts"
import { type Brand, brand } from "../../packages/core/src/lib/brand.ts"
import { NonEmptyFrom } from "../../packages/core/src/types/constructors.ts"
import { type Handler, router } from "../../packages/web/src/router.ts"
import { composeNamed, defineRegistry } from "../../packages/web/src/mw_registry.ts"
import { auth, rateLimit } from "../../packages/web/src/middleware.ts"
import { idempotency, requireRole } from "../../packages/web/src/extras.ts"
import { getApiKey, getIdemKey } from "../../packages/web/src/typed_headers.ts"
import { hal, HREF, prop, REL, tmpl } from "../../packages/web/src/hal_forms.ts"

type TaskId = Brand<string, "TaskId">
type TaskTitle = Brand<string, "TaskTitle">
type Task = { id: TaskId; title: TaskTitle; status: "pending" | "done" }

const asTaskId = brand<string, "TaskId">()
const asTaskTitle = brand<string, "TaskTitle">()

const kv = MemoryKV()
const tasks = new Map<TaskId, Task>()

const ensureTitle = (value: unknown): TaskTitle => {
  const raw = typeof value === "string" ? value.trim() : ""
  const validated = NonEmptyFrom(raw)
  return asTaskTitle(validated as unknown as string)
}

const createTask = (title: TaskTitle) => {
  const id = asTaskId(`task-${crypto.randomUUID()}`)
  const task: Task = { id, title, status: "pending" }
  tasks.set(id, task)
  return task
}

const listTasks = () =>
  Array.from(tasks.values()).map((task) => ({
    id: task.id as unknown as string,
    title: task.title as unknown as string,
    status: task.status,
  }))

const toState = (req: Request) => {
  const roles = (req.headers.get("x-roles") ?? "")
    .split(",")
    .map((r) => r.trim())
    .filter(Boolean)
  return { user: { id: getApiKey(req) ?? "guest", roles } }
}

type AppState = ReturnType<typeof toState>
type AppCtx = { state: AppState }

const baseRouter = router<AppCtx>([
  {
    method: "GET",
    path: "/",
    handler: async () => {
      const page = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>LFTS HAL-FORMS Taskboard</title>
    <script src="https://unpkg.com/htmx.org@1.9.12"></script>
    <style>
      body { font-family: system-ui; margin: 2rem; max-width: 720px; }
      h1 { margin-bottom: 0.5rem; }
      button { padding: 0.5rem 0.75rem; }
      .log { margin-top: 1rem; font-family: monospace; background: #f7f7f8; padding: 1rem; border-radius: 0.5rem; }
    </style>
  </head>
  <body>
    <h1>HAL-FORMS Taskboard</h1>
    <p>This UI reads <code>/.well-known/hal</code> and <code>/forms</code> to understand the available actions.</p>

    <section>
      <h2>Tasks</h2>
      <button hx-get="/tasks" hx-headers='{"x-api-key":"demo-admin-123"}' hx-target="#tasks">Refresh tasks</button>
      <pre id="tasks" class="log">[]</pre>
    </section>

    <section>
      <h2>Create Task</h2>
      <form hx-post="/tasks"
            hx-target="#tasks"
            hx-swap="innerText"
            hx-headers='{"x-api-key":"demo-admin-123","x-roles":"admin","idempotency-key":"task-demo-1"}'>
        <label>
          Title
          <input type="text" name="title" value="Plan release demo" required />
        </label>
        <button type="submit">Create</button>
      </form>
    </section>
  </body>
</html>`
      return new Response(page, { headers: { "content-type": "text/html; charset=utf-8" } })
    },
  },
  {
    method: "GET",
    path: "/tasks",
    handler: () =>
      new Response(JSON.stringify({ tasks: listTasks() }, null, 2), {
        headers: { "content-type": "application/json" },
      }),
  },
  {
    method: "POST",
    path: "/tasks",
    handler: async (ctx) => {
      const contentType = ctx.req.headers.get("content-type") ?? ""
      let payload: Record<string, unknown> = {}
      if (contentType.includes("application/json")) {
        payload = await ctx.req.json()
      } else {
        const form = await ctx.req.formData()
        payload = Object.fromEntries(form.entries())
      }

      const title = ensureTitle(payload.title)
      const task = createTask(title)
      return new Response(
        JSON.stringify(
          {
            task: {
              ...task,
              id: task.id as unknown as string,
              title: task.title as unknown as string,
            },
          },
          null,
          2,
        ),
        {
          headers: { "content-type": "application/json" },
        },
      )
    },
  },
  {
    method: "GET",
    path: "/.well-known/hal",
    handler: () => {
      const doc = hal(
        {
          [REL("self")]: { href: HREF("/.well-known/hal") },
          [REL("ui")]: { href: HREF("/") },
          [REL("tasks")]: { href: HREF("/tasks") },
          [REL("forms")]: { href: HREF("/forms") },
        },
        undefined,
        { name: "HAL-FORMS Taskboard" },
      )
      return new Response(JSON.stringify(doc, null, 2), {
        headers: { "content-type": "application/hal+json" },
      })
    },
  },
  {
    method: "GET",
    path: "/forms",
    handler: () => {
      const forms = hal(
        {
          [REL("self")]: { href: HREF("/forms") },
        },
        {
          createTask: tmpl({
            title: "Create Task",
            method: "POST",
            target: "/tasks",
            properties: [prop({ name: "title", prompt: "Title", required: true })],
          }),
        },
      )
      return new Response(JSON.stringify(forms, null, 2), {
        headers: { "content-type": "application/prs.hal-forms+json" },
      })
    },
  },
])

const baseHandler: Handler<AppCtx> = (ctx) => baseRouter(ctx)(ctx.req)

const rateKey = (req: Request) => getApiKey(req) ?? "anon"

const registry = defineRegistry<AppCtx>()({
  auth: auth((req) => !!getApiKey(req)),
  admin: requireRole("admin"),
  rate: rateLimit(30, 60_000, rateKey, async (key) => {
    if (kv.incr) return kv.incr(`rl:${key}`)
    return bumpCounter({ kv })(`rl:${key}`)
  }),
  idempotent: idempotency(
    (req) => getIdemKey(req),
    async (key) => (await kv.get<boolean>(`idem:${key}`)) === true,
    (key, ttl) => kv.set(`idem:${key}`, true, ttl),
    60_000,
  ),
})

const defaultHandler = baseHandler
const guardedTasks = composeNamed(registry, ["auth", "rate"])(baseHandler)
const createTaskHandler = composeNamed(registry, ["auth", "admin", "idempotent"])(baseHandler)

const port = 8700
console.log(`HAL-FORMS taskboard running on http://localhost:${port}`)

Deno.serve({ port }, (req) => {
  const url = new URL(req.url)
  const ctx = { req, url, state: toState(req) }

  if (url.pathname === "/tasks" && req.method === "GET") {
    return guardedTasks(ctx)
  }

  if (url.pathname === "/tasks" && req.method === "POST") {
    return createTaskHandler(ctx)
  }

  if (url.pathname === "/.well-known/hal" || url.pathname === "/forms") {
    return defaultHandler(ctx)
  }

  if (url.pathname === "/" && req.method === "GET") {
    return defaultHandler(ctx)
  }

  return new Response("Not Found", { status: 404 })
})

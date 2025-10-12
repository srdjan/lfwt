import type { KV } from "../../packages/core/src/ports/kv.ts"
import { type Handler, router } from "../../packages/web/src/router.ts"
import { composeNamed, defineRegistry } from "../../packages/web/src/mw_registry.ts"
import { auth, rateLimit } from "../../packages/web/src/middleware.ts"
import { getApiKey } from "../../packages/web/src/typed_headers.ts"

type QuotaCtx = { label: string }

type Options = {
  label: string
  kv: KV
  limit?: number
  windowMs?: number
}

const DEFAULT_LIMIT = 5
const DEFAULT_WINDOW_MS = 60_000

export const createQuotaHandler = (
  { kv, label, limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS }: Options,
) => {
  const namespace = (key: string) => `quota:${key}`

  const bucketFor = (req: Request) => {
    const apiKey = getApiKey(req) ?? "anon"
    const window = Math.floor(Date.now() / windowMs)
    return { apiKey, bucketId: `${apiKey}:${window}`, window }
  }

  const increment = async (key: string) => {
    const namespaced = namespace(key)
    if (kv.incr) {
      const next = await kv.incr(namespaced)
      return next
    }
    const current = (await kv.get<number>(namespaced)) ?? 0
    const next = current + 1
    await kv.set(namespaced, next)
    return next
  }

  const registry = defineRegistry<QuotaCtx>()({
    auth: auth((req) => !!getApiKey(req)),
    rate: rateLimit(limit, windowMs, (req) => bucketFor(req).bucketId, increment),
  })

  const quotaRouter = router<QuotaCtx>([
    {
      method: "GET",
      path: "/quota",
      handler: async (ctx) => {
        const { apiKey, bucketId, window } = bucketFor(ctx.req)
        const count = (await kv.get<number>(namespace(bucketId))) ?? 0
        const windowEndsAt = new Date((window + 1) * windowMs).toISOString()

        return new Response(
          JSON.stringify(
            {
              adapter: label,
              apiKey,
              limit,
              windowMs,
              windowEndsAt,
              requestCount: count,
            },
            null,
            2,
          ),
          { headers: { "content-type": "application/json" } },
        )
      },
    },
    {
      method: "GET",
      path: "/health",
      handler: () => new Response("ok"),
    },
  ])

  const baseHandler: Handler<QuotaCtx> = (ctx) => quotaRouter(ctx)(ctx.req)
  const quotaWithPolicies = composeNamed(registry, ["auth", "rate"])(baseHandler)

  return (req: Request) => {
    const url = new URL(req.url)
    const ctx = { req, url, label }

    if (url.pathname === "/quota" && req.method === "GET") {
      return quotaWithPolicies(ctx)
    }

    if (url.pathname === "/health" && req.method === "GET") {
      return baseHandler(ctx)
    }

    return new Response("Not Found", { status: 404 })
  }
}

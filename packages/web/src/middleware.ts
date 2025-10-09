import type { Middleware } from "./router.ts"

export const auth = <C>(verify: (req: Request) => boolean): Middleware<C> =>
  (next) => (ctx) => verify(ctx.req) ? next(ctx) : new Response("Unauthorized", { status: 401 })

export const rateLimit = <C>(limit: number, windowMs: number, bucket: (req: Request) => string, incr: (key: string) => Promise<number>): Middleware<C> =>
  (next) => async (ctx) => {
    const k = `rl:${bucket(ctx.req)}`
    const n = await incr(k)
    // naive: reset window by TTL logic assumed in KV incr impl (MemoryKV supports incr but no TTL; prod should set TTL)
    if (n > limit) return new Response("Too Many Requests", { status: 429 })
    return next(ctx)
  }

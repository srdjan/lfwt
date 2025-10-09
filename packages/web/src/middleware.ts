import type { Middleware } from "./router.ts"
export const auth = (verify: (req: Request) => boolean): Middleware<any> => (next) => (ctx) => verify(ctx.req) ? next(ctx) : new Response("Unauthorized", { status: 401 })
export const rateLimit = (limit: number, windowMs: number, bucket: (req: Request) => string, incr: (key: string) => Promise<number>): Middleware<any> =>
  (next) => async (ctx) => { const k = `rl:${bucket(ctx.req)}`; const n = await incr(k); if (n > limit) return new Response("Too Many Requests", { status: 429 }); return next(ctx) }

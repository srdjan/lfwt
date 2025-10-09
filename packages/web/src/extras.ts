import type { Middleware } from "./router.ts"
export const requireRole = <C extends { state?: any }>(role: string): Middleware<C> => (next) => (ctx) => {
  const roles: string[] | undefined = ctx.state?.user?.roles; if (!roles || !roles.includes(role)) return new Response("Forbidden", { status: 403 }); return next(ctx)
}
export const idempotency = <C>(getKey: (req: Request) => string | null, hasSeen: (key: string) => Promise<boolean>, remember: (key: string, ttlMs: number) => Promise<void>, ttlMs: number = 60_000): Middleware<C> =>
  (next) => async (ctx) => { const k = getKey(ctx.req); if (!k) return next(ctx); if (await hasSeen(k)) return new Response("Duplicate", { status: 409 }); await remember(k, ttlMs); return next(ctx) }

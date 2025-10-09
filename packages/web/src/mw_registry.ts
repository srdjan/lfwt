import type { Handler, Middleware } from "./router.ts"

export type CtxBase = { req: Request; url: URL; state?: Record<string, unknown> }

export type Registry<C> = Record<string, Middleware<C>>

export const defineRegistry = <C>() => (defs: Registry<C>) => defs

export const composeNamed = <C>(reg: Registry<C>, names: string[]) => (h: Handler<C>): Handler<C> => {
  const chain = names.map(n => reg[n]).filter(Boolean)
  return chain.reduceRight((acc, m) => m(acc), h)
}

import type { Handler, Middleware } from "./router.ts"
export type Registry<C> = Record<string, Middleware<C>>
export const defineRegistry = <C>() => (defs: Registry<C>) => defs
export const composeNamed = <C>(reg: Registry<C>, names: string[]) => (h: Handler<C>): Handler<C> => names.map(n => reg[n]).filter(Boolean).reduceRight((acc, m) => m(acc), h)

import type { WithDeps, Fn } from "./types.ts"
export const withCache = <D, F extends Fn>(ttlMs: number, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => async (...args: Parameters<F>) => {
    const key = `cache:${fn.name || "fn"}:${JSON.stringify(args)}`
    // @ts-ignore assume deps has kv; in projects, constrain D to include KV
    const hit = await deps.kv.get<any>(key)
    if (hit !== null) return hit
    const out = await (fn(deps) as any)(...args)
    // @ts-ignore
    await deps.kv.set(key, out, ttlMs)
    return out
  }

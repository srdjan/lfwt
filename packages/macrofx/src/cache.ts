import type { WithDeps, Fn } from "./types.ts"
import type { KV } from "../../core/src/ports/kv.ts"

export type CacheDeps = { kv: KV }
export type CacheConfig = { ttlMs?: number; key: (...args: any[]) => string }

export const withCache = <D extends CacheDeps, F extends Fn>(cfg: CacheConfig, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => async (...args: Parameters<F>) => {
    const k = cfg.key(...args)
    const hit = await deps.kv.get<any>(k)
    if (hit !== null) return hit as any
    const out = await (fn(deps) as any)(...args)
    await deps.kv.set(k, out, cfg.ttlMs)
    return out
  }

import type { Logger } from "./ports/logger.ts"
import type { Http } from "./ports/http.ts"
import type { Clock } from "./ports/clock.ts"
import type { KV } from "./ports/kv.ts"

export type Deps = { log: Logger; http: Http; clock: Clock; kv: KV }

export const timeNow = (d: Pick<Deps, "clock">) => () => d.clock.now()

export const fetchJson = (d: Pick<Deps, "http" | "log">) => async (url: string) => {
  d.log.log(`GET ${url}`)
  const res = await d.http.get(url)
  return res.ok ? await res.json() : null
}

export const bumpCounter = (d: Pick<Deps, "kv">) => async (key: string) => {
  if (d.kv.incr) return d.kv.incr(key)
  const cur = (await d.kv.get<number>(key)) ?? 0; const next = cur + 1; await d.kv.set(key, next); return next
}

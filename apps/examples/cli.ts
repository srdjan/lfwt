import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { timeNow, bumpCounter, fetchJson } from "../../packages/core/src/services.ts"
import { withRetry } from "../../packages/macrofx/src/retry.ts"
import { withCache } from "../../packages/macrofx/src/cache.ts"
import { withTimeout } from "../../packages/macrofx/src/timeout.ts"

const deps = { log: ConsoleLogger, http: FetchHttp, clock: { now: () => new Date() }, kv: MemoryKV() }

// decorate fetchJson with macros
const cachedFetch = withCache({ key: (url: string) => `cache:${url}`, ttlMs: 10_000 }, fetchJson)
const resilientFetch = withRetry({ retries: 2, delayMs: 200 }, cachedFetch)
const timelyFetch = withTimeout(2_000, resilientFetch)

const main = async () => {
  const now = timeNow(deps)().toISOString()
  const n = await bumpCounter(deps)("cli:runs")
  deps.log.log(`Now: ${now} | runs=${n}`)

  const data = await timelyFetch(deps)("https://jsonplaceholder.typicode.com/todos/1")
  deps.log.log(`Title: ${data?.title}`)
}

if (import.meta.main) await main()

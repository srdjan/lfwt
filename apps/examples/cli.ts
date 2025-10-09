import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { timeNow, fetchTodo } from "../../packages/core/src/services.ts"
import { withCache, withRetry, withTimeout } from "../../packages/macrofx/src/mod.ts"
import { ApiKeyFrom, PositiveIntFrom } from "../../packages/core/src/types/constructors.ts"
import { ms } from "../../packages/core/src/types/nominal.ts"

const deps = { log: ConsoleLogger, http: FetchHttp, clock: { now: () => new Date() }, kv: MemoryKV() }

const composed = withTimeout(2000, withRetry(2, 100, withCache(10_000, fetchTodo)))

const main = async () => {
  const now = timeNow(deps)().toISOString()
  deps.log.log(`Now: ${now}`)
  const data = await composed(deps)(ApiKeyFrom("demo-key-123"), PositiveIntFrom(1))
  deps.log.log(`Todo: ${data?.title}`)
}

if (import.meta.main) await main()

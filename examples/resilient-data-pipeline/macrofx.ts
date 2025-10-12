import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import type { Deps as CoreDeps } from "../../packages/core/src/services.ts"
import { fetchTodo } from "../../packages/core/src/services.ts"
import { ApiKeyFrom, PositiveIntFrom } from "../../packages/core/src/types/constructors.ts"
import type { ApiKey, PositiveInt } from "../../packages/core/src/types/nominal.ts"
import { withCache, withRetry, withTimeout } from "../../packages/macrofx/src/mod.ts"

type PipelineDeps = Pick<CoreDeps, "http" | "log"> & {
  kv: CoreDeps["kv"]
  clock: CoreDeps["clock"]
}

const remoteFetch = (deps: PipelineDeps) => fetchTodo(deps)

let shouldFailOnce = true
const flakyRemote = (deps: PipelineDeps) => async (apiKey: ApiKey, id: PositiveInt) => {
  if (shouldFailOnce && (id as unknown as number) === 2) {
    shouldFailOnce = false
    deps.log.error(`[macrofx] upstream glitch for todo ${id}, retrying...`)
    throw new Error("upstream glitch")
  }
  deps.log.log(`[macrofx] remote call -> ${id}`)
  return await remoteFetch(deps)(apiKey, id)
}

const resilientPipeline = withTimeout(
  1_500,
  withRetry(2, 200, withCache(10_000, (deps: PipelineDeps) => flakyRemote(deps))),
)

const ids = [1, 2, 3]

const deps: PipelineDeps = {
  log: ConsoleLogger,
  http: FetchHttp,
  clock: { now: () => new Date() },
  kv: MemoryKV(),
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

const run = async (label: string) => {
  deps.log.log(`=== ${label} ingestion run ===`)
  for (const rawId of ids) {
    const id = PositiveIntFrom(rawId)
    try {
      const todo = await resilientPipeline(deps)(ApiKeyFrom("demo-key-123"), id)
      deps.log.log(`[macrofx] processed ${rawId}: ${todo?.title}`)
      await sleep(75)
    } catch (err) {
      deps.log.error(`[macrofx] failed after retries for ${rawId}: ${(err as Error).message}`)
    }
  }
}

if (import.meta.main) {
  await run("first")
  await run("second (cache demonstration)")
}

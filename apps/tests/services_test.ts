import { assertEquals } from "@std/assert"
import { ConsoleLogger } from "../../packages/core/src/adapters/console_logger.ts"
import { FetchHttp } from "../../packages/core/src/adapters/fetch_http.ts"
import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { timeNow, bumpCounter } from "../../packages/core/src/services.ts"

Deno.test("clock injection", () => {
  const now = timeNow({ clock: { now: () => new Date("2020-01-01T00:00:00Z") } })()
  assertEquals(now.toISOString(), "2020-01-01T00:00:00.000Z")
})

Deno.test("kv bump", async () => {
  const n1 = await bumpCounter({ kv: MemoryKV() })("k")
  const n2 = await bumpCounter({ kv: MemoryKV() })("k") // new kv, restarts
  assertEquals([n1, n2], [1, 1])
})

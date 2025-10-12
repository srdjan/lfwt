import { MemoryKV } from "../../packages/core/src/adapters/memory_kv.ts"
import { createQuotaHandler } from "./common.ts"

const port = 8800
const handler = createQuotaHandler({ kv: MemoryKV(), label: "memory" })

console.log(`Quota service (memory) on http://localhost:${port}`)
Deno.serve({ port }, handler)

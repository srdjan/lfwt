import { SqliteKV } from "../../packages/kv-sqlite/src/sqlite_kv.ts"
import { createQuotaHandler } from "./common.ts"

const port = 8800
const handler = createQuotaHandler({ kv: SqliteKV("quota.db"), label: "sqlite" })

console.log(`Quota service (sqlite) on http://localhost:${port} using quota.db`)
Deno.serve({ port }, handler)

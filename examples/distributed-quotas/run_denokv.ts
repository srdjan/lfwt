import { DenoKV } from "../../packages/kv-deno/src/deno_kv.ts"
import { createQuotaHandler } from "./common.ts"

const port = 8800

const main = async () => {
  const kv = await DenoKV()
  const handler = createQuotaHandler({ kv, label: "denokv" })
  console.log(`Quota service (denokv) on http://localhost:${port}`)
  Deno.serve({ port }, handler)
}

if (import.meta.main) {
  await main()
}

import type { KV } from "../../core/src/ports/kv.ts"

export const DenoKV = async (path?: string): Promise<KV> => {
  const kv = await Deno.openKv(path) // requires -A or --allow-read --allow-write
  return {
    async get(key) {
      const r = await kv.get([key])
      return (r.value as any) ?? null
    },
    async set(key, value, ttlMs) {
      if (ttlMs) {
        const expireIn = BigInt(ttlMs)
        await kv.set([key], value, { expireIn })
      } else {
        await kv.set([key], value)
      }
    },
    async delete(key) { await kv.delete([key]) },
    async incr(key) {
      const r = await kv.atomic()
        .sum([key, "counter"], 1n)
        .commit()
      // fallback: read value
      const v = await kv.get([key, "counter"])
      return Number((v.value as bigint) ?? 0n)
    }
  }
}

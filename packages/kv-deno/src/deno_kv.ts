import type { KV } from "../../core/src/ports/kv.ts"
export const DenoKV = async (path?: string): Promise<KV> => {
  const kv = await Deno.openKv(path)
  return {
    async get(key) { const r = await kv.get([key]); return (r.value as any) ?? null },
    async set(key, value, ttlMs) { ttlMs ? await kv.set([key], value, { expireIn: BigInt(ttlMs) }) : await kv.set([key], value) },
    async delete(key) { await kv.delete([key]) },
    async incr(key) { const r = await kv.atomic().sum([key, "counter"], 1n).commit(); const v = await kv.get([key, "counter"]); return Number((v.value as bigint) ?? 0n) }
  }
}

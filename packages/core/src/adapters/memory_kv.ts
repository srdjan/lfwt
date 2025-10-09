import type { KV } from "../ports/kv.ts"
export const MemoryKV = (): KV => {
  const m = new Map<string, { v: unknown; exp?: number }>()
  const now = () => Date.now()
  const purge = (k: string) => {
    const it = m.get(k); if (!it) return
    if (it.exp && it.exp < now()) { m.delete(k) }
  }
  return {
    async get(key) { purge(key); const it = m.get(key); return it ? (it.v as any) : null },
    async set(key, value, ttlMs) { m.set(key, { v: value, exp: ttlMs ? now() + ttlMs : undefined }) },
    async delete(key) { m.delete(key) },
    async incr(key) { purge(key); const n = (m.get(key)?.v as number | undefined) ?? 0; const x = n + 1; m.set(key, { v: x }); return x }
  }
}

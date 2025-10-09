import type { KV } from "../ports/kv.ts"
export const MemoryKV = (): KV => {
  const m = new Map<string, { v: unknown; exp?: number }>()
  const now = () => Date.now()
  const purge = (k: string) => { const it = m.get(k); if (it?.exp && it.exp < now()) m.delete(k) }
  return {
    async get(k) { purge(k); const it = m.get(k); return it ? (it.v as any) : null },
    async set(k, v, ttl) { m.set(k, { v, exp: ttl ? now() + ttl : undefined }) },
    async delete(k) { m.delete(k) },
    async incr(k) { purge(k); const n = (m.get(k)?.v as number | undefined) ?? 0; const x = n + 1; m.set(k, { v: x }); return x }
  }
}

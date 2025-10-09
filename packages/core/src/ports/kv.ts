export interface KV {
  get: <A = unknown>(key: string) => Promise<A | null>
  set: <A = unknown>(key: string, value: A, ttlMs?: number) => Promise<void>
  delete: (key: string) => Promise<void>
  incr?: (key: string) => Promise<number> // optional optimization
}

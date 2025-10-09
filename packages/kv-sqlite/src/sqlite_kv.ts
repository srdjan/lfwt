import type { KV } from "../../core/src/ports/kv.ts"
import { DB } from "sqlite"

export const SqliteKV = (file: string = "kv.db"): KV => {
  const db = new DB(file)
  db.execute(`CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, exp INTEGER)`)
  const now = () => Date.now()
  const purge = (k: string) => {
    const row = db.query("SELECT exp FROM kv WHERE k = ?1", [k]).next()
    if (row && row[0] !== null && Number(row[0]) < now()) db.query("DELETE FROM kv WHERE k = ?1", [k])
  }
  return {
    async get(key) {
      purge(key)
      const it = db.query("SELECT v FROM kv WHERE k = ?1", [key]).next()
      return it ? JSON.parse(it[0]) : null
    },
    async set(key, value, ttlMs) {
      const exp = ttlMs ? now() + ttlMs : null
      db.query("INSERT INTO kv (k, v, exp) VALUES (?1, ?2, ?3) ON CONFLICT(k) DO UPDATE SET v = excluded.v, exp = excluded.exp", [key, JSON.stringify(value), exp])
    },
    async delete(key) { db.query("DELETE FROM kv WHERE k = ?1", [key]) }
  }
}

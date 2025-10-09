import type { KV } from "../../core/src/ports/kv.ts"
import { DB } from "sqlite"
export const SqliteKV = (file: string = "kv.db"): KV => {
  const db = new DB(file)
  db.execute("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT, exp INTEGER)")
  const now = () => Date.now()
  const purge = (k: string) => { const r = db.query("SELECT exp FROM kv WHERE k=?1",[k]).next(); if (r && r[0] !== null && Number(r[0]) < now()) db.query("DELETE FROM kv WHERE k=?1",[k]) }
  return {
    async get(k) { purge(k); const r = db.query("SELECT v FROM kv WHERE k=?1",[k]).next(); return r ? JSON.parse(r[0]) : null },
    async set(k, v, ttl) { const exp = ttl ? now() + ttl : null; db.query("INSERT INTO kv(k,v,exp) VALUES(?1,?2,?3) ON CONFLICT(k) DO UPDATE SET v=excluded.v, exp=excluded.exp",[k, JSON.stringify(v), exp]) },
    async delete(k) { db.query("DELETE FROM kv WHERE k=?1",[k]) }
  }
}

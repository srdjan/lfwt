import type { WithDeps, Fn } from "./types.ts"
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))
export const withRetry = <D, F extends Fn>(retries: number, delayMs: number, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => async (...args: Parameters<F>) => {
    for (let i = 0; i <= retries; i++) {
      try { return await (fn(deps) as any)(...args) }
      catch (e) { if (i === retries) throw e; await sleep(delayMs) }
    }
  }

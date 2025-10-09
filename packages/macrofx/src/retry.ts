import type { WithDeps, Fn } from "./types.ts"

export type RetryConfig = { retries: number; delayMs?: number; shouldRetry?: (e: unknown) => boolean }

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

export const withRetry = <D, F extends Fn>(cfg: RetryConfig, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => async (...args: Parameters<F>) => {
    let attempt = 0
    // deno-lint-ignore no-constant-condition
    while (true) {
      try {
        return await (fn(deps) as any)(...args)
      } catch (e) {
        attempt++
        if (attempt > cfg.retries || (cfg.shouldRetry && !cfg.shouldRetry(e))) throw e
        if (cfg.delayMs) await sleep(cfg.delayMs)
      }
    }
  }

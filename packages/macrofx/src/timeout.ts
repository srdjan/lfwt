import type { WithDeps, Fn } from "./types.ts"

export const withTimeout = <D, F extends Fn>(ms: number, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => (...args: Parameters<F>) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      Promise.resolve((fn(deps) as any)(...args))
        .then(v => { clearTimeout(timer); resolve(v) })
        .catch(e => { clearTimeout(timer); reject(e) })
    }) as any
  }

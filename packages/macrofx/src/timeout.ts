import type { WithDeps, Fn } from "./types.ts"
export const withTimeout = <D, F extends Fn>(ms: number, fn: WithDeps<D, F>): WithDeps<D, F> =>
  (deps: D) => (...args: Parameters<F>) => new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    Promise.resolve((fn(deps) as any)(...args)).then(v => { clearTimeout(t); resolve(v) }).catch(e => { clearTimeout(t); reject(e) })
  }) as any

export type Fn<A extends any[] = any[], R = any> = (...args: A) => Promise<R> | R
export type WithDeps<D, F extends Fn> = (deps: D) => F

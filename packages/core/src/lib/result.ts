export type Ok<A> = { _tag: "Ok"; value: A }
export type Err<E> = { _tag: "Err"; error: E }
export type Result<E, A> = Ok<A> | Err<E>
export const ok = <A>(a: A): Result<never, A> => ({ _tag: "Ok", value: a })
export const err = <E>(e: E): Result<E, never> => ({ _tag: "Err", error: e })

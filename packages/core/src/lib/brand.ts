declare const __brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [__brand]: B }

export const brand = <T, B extends string>() =>
  (value: T) => value as Brand<T, B>

export const unbrand = <T>(value: unknown) => value as T

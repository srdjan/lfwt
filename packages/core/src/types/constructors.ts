import { ApiKey, Email, IdempotencyKey, NonEmpty, PositiveInt } from "./nominal.ts"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const EmailFrom = (s: string): Email => {
  if (!emailRegex.test(s)) throw new Error("Invalid Email")
  return s as Email
}

export const NonEmptyFrom = (s: string): NonEmpty => {
  if (s.trim() === "") throw new Error("Empty string")
  return s as NonEmpty
}

export const PositiveIntFrom = (n: number): PositiveInt => {
  if (!Number.isInteger(n) || n <= 0) throw new Error("Not positive int")
  return n as PositiveInt
}

export const ApiKeyFrom = (s: string): ApiKey => {
  if (!s || s.length < 3) throw new Error("Invalid API key")
  return s as ApiKey
}

export const IdempotencyKeyFrom = (s: string): IdempotencyKey => {
  if (!s || s.length < 8) throw new Error("Invalid idempotency key")
  return s as IdempotencyKey
}

import { assertEquals, assertThrows } from "@std/assert"
import { ApiKeyFrom, PositiveIntFrom } from "../../packages/core/src/types/constructors.ts"

Deno.test("ApiKeyFrom validates", () => {
  assertThrows(() => ApiKeyFrom(""), Error)
  const k = ApiKeyFrom("abc123456")
  assertEquals(typeof k, "string")
})

Deno.test("PositiveIntFrom validates", () => {
  assertThrows(() => PositiveIntFrom(0), Error)
  const n = PositiveIntFrom(5)
  assertEquals(typeof n, "number")
})

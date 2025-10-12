import { MemoryKV } from "../../../packages/core/src/adapters/memory_kv.ts"
import { ConsoleLogger } from "../../../packages/core/src/adapters/console_logger.ts"
import type { KV } from "../../../packages/core/src/ports/kv.ts"
import type { Logger } from "../../../packages/core/src/ports/logger.ts"
import { Email } from "../../../packages/core/src/types/nominal.ts"
import { asUserId, UserId } from "../../../packages/core/src/types/nominal.ts"
import { EmailFrom } from "../../../packages/core/src/types/constructors.ts"

type Deps = { kv: KV; log: Logger }
type User = { id: UserId; email: Email }

const registerUser = (deps: Deps) => async (id: UserId, email: Email) => {
  await deps.kv.set(`users:${id}`, { id, email })
  deps.log.log(`[branded] user stored: ${id}`)
  deps.log.log(`[branded] welcome email queued for: ${email}`)
}

const getUser = (deps: Deps) => async (id: UserId) => {
  return (await deps.kv.get<User>(`users:${id}`)) ?? null
}

const UserIdFrom = (value: string): UserId => {
  const trimmed = value.trim()
  if (!trimmed.startsWith("user-")) throw new Error("User ids must start with `user-`")
  if (trimmed.length < 6) throw new Error("User id too short")
  return asUserId(trimmed)
}

const deps: Deps = { kv: MemoryKV(), log: ConsoleLogger }
const onboard = registerUser(deps)
const lookup = getUser(deps)

const id = UserIdFrom("user-123")
const email = EmailFrom("alice@example.com")

await onboard(id, email)

// Uncommenting the line below makes the compiler flag the bug.
// @ts-expect-error mixing identifiers is disallowed
// await onboard(email, id)

console.log("[branded] user ->", await lookup(id))

type User = { id: string; email: string }

const users = new Map<string, User>()

const upsertUser = (id: string, email: string) => {
  users.set(id, { id, email })
}

const logLogin = (userId: string) => {
  console.log(`[baseline] user logged in: ${userId}`)
}

const sendWelcomeEmail = (email: string) => {
  console.log(`[baseline] welcome email sent to: ${email}`)
}

const registerUser = (id: string, email: string) => {
  upsertUser(id, email)

  // Bug: the parameters are flipped. TypeScript does not catch this.
  logLogin(email)
  sendWelcomeEmail(id)
}

registerUser("user-123", "alice@example.com")

console.log("[baseline] stored users", Array.from(users.values()))

export interface User { id: string; name: string; email: string }
export const create = (name: string, email: string): User => ({ id: crypto.randomUUID(), name, email })

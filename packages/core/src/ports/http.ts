export interface Http {
  get: (url: string, init?: RequestInit) => Promise<Response>
  post: (url: string, body?: unknown, init?: RequestInit) => Promise<Response>
}

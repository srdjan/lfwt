import type { Http } from "../ports/http.ts"
export const FetchHttp: Http = {
  get: (url, init) => fetch(url, { ...init, method: "GET" }),
  post: (url, body, init) =>
    fetch(url, { ...init, method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) } }),
}

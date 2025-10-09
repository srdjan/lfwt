export type State = { tag: "Idle" } | { tag: "Loading" } | { tag: "Success"; data: unknown } | { tag: "Error"; reason: string }
export type Event = { type: "Load" } | { type: "Success"; data: unknown } | { type: "Fail"; reason: string }
export const reducer = (s: State, e: Event): State => {
  switch (s.tag) {
    case "Idle": return e.type === "Load" ? { tag: "Loading" } : s
    case "Loading":
      if (e.type === "Success") return { tag: "Success", data: e.data }
      if (e.type === "Fail") return { tag: "Error", reason: e.reason }
      return s
    default: return s
  }
}

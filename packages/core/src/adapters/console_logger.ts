import type { Logger } from "../ports/logger.ts"
export const ConsoleLogger: Logger = {
  log: (msg) => console.log(`[LOG] ${msg}`),
  error: (msg) => console.error(`[ERR] ${msg}`),
}

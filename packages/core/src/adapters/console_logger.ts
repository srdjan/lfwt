import type { Logger } from "../ports/logger.ts"
export const ConsoleLogger: Logger = { log: (m) => console.log(`[LOG] ${m}`), error: (m) => console.error(`[ERR] ${m}`) }

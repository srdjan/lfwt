import { ApiKey, IdempotencyKey } from "../../core/src/types/nominal.ts"
import { ApiKeyFrom, IdempotencyKeyFrom } from "../../core/src/types/constructors.ts"
export const getApiKey = (req: Request): ApiKey | null => { const raw = req.headers.get("x-api-key"); try { return raw ? ApiKeyFrom(raw) : null } catch { return null } }
export const getIdemKey = (req: Request): IdempotencyKey | null => { const raw = req.headers.get("idempotency-key"); try { return raw ? IdempotencyKeyFrom(raw) : null } catch { return null } }

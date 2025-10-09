import { CacheKey, KvKey, RateBucketKey, asCacheKey, asKvKey, asRateBucketKey } from "./types/nominal.ts"
export const cacheKey = (...parts: string[]): CacheKey => asCacheKey(parts.join(":"))
export const rateBucketKey = (apiKey: string): RateBucketKey => asRateBucketKey(`rl:${apiKey}`)
export const kvKey = (ns: string, id: string): KvKey => asKvKey(`${ns}:${id}`)

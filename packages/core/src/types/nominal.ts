import { Brand, brand } from "../lib/brand.ts"

export type UserId         = Brand<string, "UserId">
export type OrderId        = Brand<string, "OrderId">
export type KvKey          = Brand<string, "KvKey">
export type CacheKey       = Brand<string, "CacheKey">
export type RateBucketKey  = Brand<string, "RateBucketKey">
export type ApiKey         = Brand<string, "ApiKey">
export type IdempotencyKey = Brand<string, "IdempotencyKey">
export type Rel            = Brand<string, "Rel">
export type Href           = Brand<string, "Href">

export type Milliseconds   = Brand<number, "Milliseconds">
export type Seconds        = Brand<number, "Seconds">
export type Bytes          = Brand<number, "Bytes">
export type Percent        = Brand<number, "Percent">

export type Email          = Brand<string, "Email">
export type NonEmpty       = Brand<string, "NonEmpty">
export type PositiveInt    = Brand<number, "PositiveInt">

export const asUserId         = brand<string,"UserId">()
export const asOrderId        = brand<string,"OrderId">()
export const asKvKey          = brand<string,"KvKey">()
export const asCacheKey       = brand<string,"CacheKey">()
export const asRateBucketKey  = brand<string,"RateBucketKey">()
export const asApiKey         = brand<string,"ApiKey">()
export const asIdemKey        = brand<string,"IdempotencyKey">()
export const asRel            = brand<string,"Rel">()
export const asHref           = brand<string,"Href">()

export const ms    = brand<number,"Milliseconds">()
export const sec   = brand<number,"Seconds">()
export const bytes = brand<number,"Bytes">()
export const pct   = brand<number,"Percent">()

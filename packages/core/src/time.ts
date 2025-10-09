import { Milliseconds, Seconds, ms, sec } from "./types/nominal.ts"
export const toMs = (s: Seconds): Milliseconds => ms((s as number) * 1000)
export const toSec = (m: Milliseconds): Seconds => sec(Math.floor((m as number) / 1000))

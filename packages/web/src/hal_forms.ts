import { Rel, Href } from "../../core/src/types/nominal.ts"
export type HalLink = { href: Href; title?: string; type?: string; templated?: boolean }
export type HalLinks = Record<Rel, HalLink | HalLink[]>
export type HalProperty = { name: string; prompt?: string; required?: boolean; readOnly?: boolean; regex?: string; min?: number; max?: number; value?: unknown; options?: { inline?: Array<{ value: string; prompt?: string }> }; type?: "text" | "number" | "email" | "datetime-local" | "hidden" }
export type HalTemplate = { title?: string; method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; contentType?: string; properties?: HalProperty[]; target?: string }
export type HalForms = { _links?: HalLinks; _embedded?: Record<string, unknown>; _templates?: { [name: string]: HalTemplate }; [k: string]: unknown }
export const hal = (links: HalLinks, templates?: HalForms["_templates"], extra?: Record<string, unknown>): HalForms => ({ _links: links, _templates: templates ?? {}, ...(extra ?? {}) })
export const tmpl = (t: HalTemplate): HalTemplate => t
export const prop = (p: HalProperty): HalProperty => p
export const HREF = (s: string) => s as Href
export const REL  = (s: string) => s as Rel

export type Handler<C> = (ctx: C & { req: Request; url: URL }) => Promise<Response> | Response
export type Middleware<C> = (next: Handler<C>) => Handler<C>
export const compose = <C>(...mw: Middleware<C>[]) => (h: Handler<C>): Handler<C> => mw.reduceRight((acc, m) => m(acc), h)
export const router = <C>(routes: Array<{ method: string; path: string; handler: Handler<C> }>) => (ctx: C) => (req: Request) => {
  const url = new URL(req.url)
  const r = routes.find(r => r.method === req.method && r.path === url.pathname)
  return r ? r.handler({ ...ctx, req, url }) : new Response("Not Found", { status: 404 })
}

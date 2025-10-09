export type Handler<C> = (ctx: C & { req: Request; url: URL }) => Promise<Response> | Response
export type Middleware<C> = (next: Handler<C>) => Handler<C>

export const compose = <C>(...mw: Middleware<C>[]) => (h: Handler<C>): Handler<C> =>
  mw.reduceRight((acc, m) => m(acc), h)

export const router = <C>(routes: Array<{ method: string; path: string; handler: Handler<C> }>) =>
  (ctx: C) => (req: Request) => {
    const url = new URL(req.url)
    const found = routes.find(r => r.method === req.method && r.path === url.pathname)
    if (!found) return new Response("Not Found", { status: 404 })
    return found.handler({ ...ctx, req, url })
  }

export const pipe = <A>(a: A, ...fns: Array<(x: any) => any>) => fns.reduce((acc, f) => f(acc), a)

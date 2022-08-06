export * from './Types/generic.mjs'

export const reducingOperation = {
   'undefined': () => u => u,
   'undefined,...any': () => (u, rest) => u,
   'any,undefined': () => (x, u) => u,
   'undefined,undefined': () => (u,v) => u,
   any: () => x => x,
   'any,any,...any': ({
      self
   }) => (a,b,rest) => [b, ...rest].reduce((x,y) => self(x,y), a)
}


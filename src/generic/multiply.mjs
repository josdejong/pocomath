export * from './Types/generic.mjs'

export const multiply = {
   'undefined': () => u => u,
   'undefined,...any': () => (u, rest) => u,
   'any,undefined': () => (x, u) => u,
   'any,any,...any': ({self}) => (a,b,rest) => {
      const later = [b, ...rest]
      return later.reduce((x,y) => self(x,y), a)
   }
}


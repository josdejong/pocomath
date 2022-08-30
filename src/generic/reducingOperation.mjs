import Returns from '../core/Returns.mjs'
export * from './Types/generic.mjs'

export const reducingOperation = {
   'undefined': () => Returns('undefined', u => u),
   'undefined,...any': () => Returns('undefined', (u, rest) => u),
   'any,undefined': () => Returns('undefined', (x, u) => u),
   'undefined,undefined': () => Returns('undefined', (u,v) => u),
   T: ({T}) => Returns(T, x => x),
   // Unfortunately the type language of Pocomath is not (yet?) expressive
   // enough to properly type the full reduction signature here:
   'any,any,...any': ({
      self
   }) => Returns('any', (a,b,rest) => [b, ...rest].reduce((x,y) => self(x,y), a))
}


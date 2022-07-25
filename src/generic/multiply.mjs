export * from './Types/generic.mjs'

export const multiply = {
   'undefined': () => u => u,
   'undefined,...any': () => (u, rest) => u,
   'any,undefined': () => (x, u) => u,
   'any,undefined,...any': () => (x, u, rest) => u,
   'any,any,undefined': () => (x, y, u) => u,
   'any,any,undefined,...any': () => (x, y, u, rest) => u
   // Bit of a hack since this should go on indefinitely...
}


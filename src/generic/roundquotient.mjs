import Returns from '../core/Returns.mjs'

export const roundquotient = {
   'T,T': ({
      T,
      'round(T)': rnd,
      'divide(T,T)':div
   }) => Returns(T, (n,d) => rnd(div(n,d)))
}

import Returns from '../core/Returns.mjs'

export const divide = {
   'T,T': ({
      T,
      'multiply(T,T)': multT,
      'invert(T)': invT
   }) => Returns(T, (x, y) => multT(x, invT(y)))
}


import Returns from '../core/Returns.mjs'

export const subtract = {
   'T,T': ({
      T,
      'add(T,T)': addT,
      'negate(T)': negT
   }) => Returns(T, (x,y) => addT(x, negT(y)))
}

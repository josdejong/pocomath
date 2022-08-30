import Returns from '../core/Returns.mjs'

export const sign = {
   T: ({
      T,
      'compare(T,T)': cmp,
      'zero(T)': Z
   }) => Returns(T, x => cmp(x, Z(x)))
}

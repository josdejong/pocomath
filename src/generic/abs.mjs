import Returns from '../core/Returns.mjs'
export const abs = {
   T: ({
      T,
      'smaller(T,T)': lt,
      'negate(T)': neg,
      'zero(T)': zr
   }) => Returns(T, t => (smaller(t, zr(t)) ? neg(t) : t))
}

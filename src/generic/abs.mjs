export const abs = {
   T: ({
      'smaller(T,T)': lt,
      'negate(T)': neg,
      'zero(T)': zr
   }) => t => (smaller(t, zr(t)) ? neg(t) : t)
}

import Returns from '../core/Returns.mjs'

export const mod = {
   'T,T': ({
      T,
      'subtract(T,T)': subT,
      'multiply(T,T)': multT,
      'quotient(T,T)': quotT
   }) => Returns(T, (a,m) => subT(a, multT(m, quotT(a,m))))
}

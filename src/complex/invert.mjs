import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const invert = {
   'Complex<T>': ({
      T,
      'conjugate(Complex<T>)': conj,
      'absquare(Complex<T>)': asq,
      'complex(T,T)': cplx,
      'divide(T,T)': div
   }) => Returns(`Complex<${T}>`, z => {
      const c = conj(z)
      const d = asq(z)
      return cplx(div(c.re, d), div(c.im, d))
   })
}

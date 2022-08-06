export * from './Types/Complex.mjs'

export const invert = {
   'Complex<T>': ({
      'conjugate(Complex<T>)': conj,
      'absquare(Complex<T>)': asq,
      'complex(T,T)': cplx,
      'divide(T,T)': div
   }) => z => {
      const c = conj(z)
      const d = asq(z)
      return cplx(div(c.re, d), div(c.im, d))
   }
}

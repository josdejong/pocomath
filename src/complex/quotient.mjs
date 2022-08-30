import Returns from '../core/Returns.mjs'
export * from './roundquotient.mjs'

export const quotient = {
   'Complex<T>,Complex<T>': ({
      T,
      'roundquotient(Complex<T>,Complex<T>)': rq
   }) => Returns(`Complex<${T}>`, (w,z) => rq(w,z))
}

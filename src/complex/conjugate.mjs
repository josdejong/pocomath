import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const conjugate = {
   'Complex<T>': ({
      T,
      'negate(T)': neg,
      'complex(T,T)': cplx
   }) => Returns(`Complex<${T}>`, z => cplx(z.re, neg(z.im)))
}


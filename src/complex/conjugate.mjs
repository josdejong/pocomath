export * from './Types/Complex.mjs'

export const conjugate = {
   'Complex<T>': ({
      'negate(T)': neg,
      'complex(T,T)': cplx
   }) => z => cplx(z.re, neg(z.im))
}


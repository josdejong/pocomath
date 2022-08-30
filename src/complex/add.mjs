import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const add = {
   'Complex<T>,Complex<T>': ({
      T,
      'self(T,T)': me,
      'complex(T,T)': cplx
   }) => Returns(`Complex<${T}>`, (w,z) => cplx(me(w.re, z.re), me(w.im, z.im)))
}

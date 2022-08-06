export * from './Types/Complex.mjs'

export const add = {
   'Complex<T>,Complex<T>': ({
      'self(T,T)': me,
      'complex(T,T)': cplx
   }) => (w,z) => cplx(me(w.re, z.re), me(w.im, z.im))
}

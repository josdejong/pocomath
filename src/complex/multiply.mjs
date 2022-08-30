import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const multiply = {
   'Complex<T>,Complex<T>': ({
      T,
      'complex(T,T)': cplx,
      'add(T,T)': plus,
      'subtract(T,T)': subt,
      'self(T,T)': me,
      'conjugate(T)': conj // makes quaternion multiplication work
   }) => Returns(
      `Complex<${T}>`,
      (w,z) => {
         const realpart = subt(me(     w.re,  z.re), me(conj(w.im), z.im))
         const imagpart = plus(me(conj(w.re), z.im), me(     w.im,  z.re))
         return cplx(realpart, imagpart)
      }
   )
}

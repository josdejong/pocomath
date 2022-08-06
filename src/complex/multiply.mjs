export * from './Types/Complex.mjs'

export const multiply = {
   'Complex<T>,Complex<T>': ({
      'complex(T,T)': cplx,
      'add(T,T)': plus,
      'subtract(T,T)': sub,
      'self(T,T)': me,
      'conjugate(T)': conj // makes quaternion multiplication work
   }) => (w,z) => {
      return cplx(
         sub(me(w.re, z.re), me(conj(w.im), z.im)),
         plus(me(conj(w.re), z.im), me(w.im, z.re)))
   }
}

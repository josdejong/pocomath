export * from './Types/Complex.mjs'

export const multiply = {
   'Complex,Complex': ({
      'complex(any,any)': cplx,
      add,
      subtract,
      self
   }) => (w,z) => {
      return cplx(
         subtract(self(w.re, z.re), self(w.im, z.im)),
         add(self(w.re, z.im), self(w.im, z.re)))
   }
}

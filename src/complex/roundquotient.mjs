export * from './Types/Complex.mjs'

export const roundquotient = {
   'Complex,Complex': ({
      'isZero(Complex)': isZ,
      conjugate,
      'multiply(Complex,Complex)': mult,
      absquare,
      self,
      complex
   }) => (n,d) => {
      if (isZ(d)) return d
      const cnum = mult(n, conjugate(d))
      const dreal = absquare(d)
      return complex(self(cnum.re, dreal), self(cnum.im, dreal))
   }
}

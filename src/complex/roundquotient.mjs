export * from './Types/Complex.mjs'

export const roundquotient = {
   'Complex<T>,Complex<T>': ({
      'isZero(Complex<T>)': isZ,
      'conjugate(Complex<T>)': conj,
      'multiply(Complex<T>,Complex<T>)': mult,
      'absquare(Complex<T>)': asq,
      'self(T,T)': me,
      'complex(T,T)': cplx
   }) => (n,d) => {
      if (isZ(d)) return d
      const cnum = mult(n, conj(d))
      const dreal = asq(d)
      return cplx(me(cnum.re, dreal), me(cnum.im, dreal))
   }
}

export * from './roundquotient.mjs'

export const quotient = {
   'Complex<T>,Complex<T>': ({
      'roundquotient(Complex<T>,Complex<T>)': rq
   }) => (w,z) => rq(w,z)
}

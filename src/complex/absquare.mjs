export * from './Types/Complex.mjs'

export const absquare = {
   'Complex<T>': ({
      add, // Calculation of exact type needed in add (underlying numeric of T)
      // is (currently) too involved for Pocomath
      'self(T)': absq
   }) => z => add(absq(z.re), absq(z.im))
}

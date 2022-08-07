export * from './Types/Complex.mjs'

export const abs = {
   'Complex<T>': ({
      sqrt, // Calculation of the type needed in the square root (the
      // underlying numeric type of T, whatever T is, is beyond Pocomath's
      // (current) template abilities, so punt and just do full resolution
      'absquare(Complex<T>)': absq
   }) => z => sqrt(absq(z))
}

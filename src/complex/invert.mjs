export * from './Types/Complex.mjs'

export const invert = {
   Complex: ({conjugate, absquare, complex, divide}) => z => {
      const c = conjugate(z)
      const d = absquare(z)
      return complex(divide(c.re, d), divide(c.im, d))
   }
}

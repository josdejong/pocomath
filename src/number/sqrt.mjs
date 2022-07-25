export { Types } from './Types/number.mjs'

export const sqrt = {
   number: ({config, complex, 'self(Complex)': complexSqrt}) => {
      if (config.predictable || !complexSqrt) {
         return n => isNaN(n) ? NaN : Math.sqrt(n)
      }
      return n => {
         if (isNaN(n)) return NaN
         if (n >= 0) return Math.sqrt(n)
         return complexSqrt(complex(n))
      }
   }
}

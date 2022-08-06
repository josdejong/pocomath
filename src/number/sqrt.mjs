export * from './Types/number.mjs'

export const sqrt = {
   number: ({
      config,
      'complex(number,number)': cplx,
      'negate(number)': neg}) => {
      if (config.predictable || !cplx) {
         return n => isNaN(n) ? NaN : Math.sqrt(n)
      }
      return n => {
         if (isNaN(n)) return NaN
         if (n >= 0) return Math.sqrt(n)
         return cplx(0, Math.sqrt(neg(n)))
      }
   }
}

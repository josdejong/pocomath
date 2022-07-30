export * from './Types/bigint.mjs'

export const divide = {
   'bigint,bigint': ({config, 'quotient(bigint,bigint)': quot}) => {
      if (config.predictable) return quot
      return (n, d) => {
         const q = n/d
         if (q * d == n) return q
         return undefined
      }
   }
}

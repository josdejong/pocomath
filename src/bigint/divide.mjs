import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

export const divide = {
   'bigint,bigint': ({config, 'quotient(bigint,bigint)': quot}) => {
      if (config.predictable) return Returns('bigint', (n,d) => quot(n,d))
      return Returns('bigint|undefined', (n, d) => {
         const q = n/d
         if (q * d == n) return q
         return undefined
      })
   }
}

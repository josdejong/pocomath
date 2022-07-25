export * from './Types/bigint.mjs'

export const divide = {
   'bigint,bigint': ({config, 'sign(bigint)': sgn}) => {
      if (config.predictable) {
         return (n, d) => {
            if (sgn(n) === sgn(d)) return n/d
            const quot = n/d
            if (quot * d == n) return quot
            return quot - 1n
         }
      } else {
         return (n, d) => {
            const quot = n/d
            if (quot * d == n) return quot
            return undefined
         }
      }
   }
}

import Returns from '../core/Returns.mjs'
export * from './Types/bigint.mjs'

/* Returns the floor integer approximation to n/d */
export const quotient = {
   'bigint,bigint': ({'sign(bigint)': sgn}) => Returns('bigint', (n, d) => {
      const dSgn = sgn(d)
      if (dSgn === 0n) return 0n
      if (sgn(n) === dSgn) return n/d
      const quot = n/d
      if (quot * d == n) return quot
      return quot - 1n
   })
}

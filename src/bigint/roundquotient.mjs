export * from './Types/bigint.mjs'

/* Returns the closest integer approximation to n/d */
export const roundquotient = {
   'bigint,bigint': ({'sign(bigint)': sgn}) => (n, d) => {
      const dSgn = sgn(d)
      if (dSgn === 0n) return 0n
      const candidate = n/d
      const rem = n - d*candidate
      const absd = d*dSgn
      if (2n * rem > absd) return candidate + dSgn
      if (-2n * rem >= absd) return candidate - dSgn
      return candidate
   }
}

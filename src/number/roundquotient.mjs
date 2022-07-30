export * from './Types/number.mjs'

export const roundquotient = {
   'number,number': () => (n,d) => {
      if (d === 0) return d
      return Math.round(n/d)
   }
}

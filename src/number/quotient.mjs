export * from './Types/number.mjs'

export const quotient = {
   'number,number': () => (n,d) => {
      if (d === 0) return d
      return Math.floor(n/d)
   }
}

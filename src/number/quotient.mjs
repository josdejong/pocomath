import Returns from '../core/Returns.mjs'

export * from './Types/number.mjs'

export const quotient = {
   'T:number,T': () => Returns('NumInt', (n,d) => {
      if (d === 0) return d
      return Math.floor(n/d)
   })
}

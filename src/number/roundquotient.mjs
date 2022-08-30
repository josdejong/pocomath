import Returns from '../core/Returns.mjs'

export * from './Types/number.mjs'

export const roundquotient = {
   'number,number': () => Returns('NumInt', (n,d) => {
      if (d === 0) return d
      return Math.round(n/d)
   })
}

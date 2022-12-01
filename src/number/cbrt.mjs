import Returns from '../core/Returns.mjs'
export * from './Types/number.mjs'

/* Returns just the real cube root, following mathjs implementation */
export const cbrt = {
   number: ({'negate(number)': neg}) => Returns('number', x => {
      if (x === 0) return x
      const negate = x < 0
      if (negate) x = neg(x)
      let result = x
      if (isFinite(x)) {
         result = Math.exp(Math.log(x) / 3)
         result = (x / (result * result) + (2 * result)) / 3
      }
      if (negate) return neg(result)
      return result
   })
}
                                                

import {numComplex} from './Complex.mjs'

export const add = {
   '...Complex': [['self'], ref => addends => {
      if (addends.length === 0) return {re:0, im:0}
      const seed = addends.shift()
      return addends.reduce((w,z) => {
         /* Need a "base case" to avoid infinite self-reference loops */
         if (numComplex(z) && numComplex(w)) {
            return {re: w.re + z.re, im: w.im + z.im}
         }
         return {re: ref.self(w.re, z.re), im: ref.self(w.im, z.im)}
      }, seed)
   }]
}

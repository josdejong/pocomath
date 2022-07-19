import {numComplex} from './Complex.mjs'
export const negate = {
   /* need a "base case" to avoid infinite self-reference */
   Complex: [['self'], ref => z => {
      if (numComplex(z)) return {re: -z.re, im: -z.im}
      return {re: ref.self(z.re), im: ref.self(z.im)}
   }]
}

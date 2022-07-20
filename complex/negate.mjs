import {numComplex} from './Complex.mjs'
export const negate = {
   Complex: [['self'], ref => z => {
      /* need a "base case" to avoid infinite self-reference */
      if (numComplex(z)) return {re: -z.re, im: -z.im}
      return {re: ref.self(z.re), im: ref.self(z.im)}
   }]
}

import Returns from '../core/Returns.mjs'
import {Complex} from '../complex/Types/Complex.mjs'

/* Note we don't **export** any types here, so that only the options
 * below that correspond to types that have been installed are activated.
 */

export const floor = {
   /* Because Pocomath isn't part of typed-function, nor does it have access
    * to the real typed-function parse, we unfortunately can't coalesce the
    * first several implementations into one entry with type
    * `bigint|NumInt|GaussianInteger` because then they couldn't
    * be separately activated
    */
   bigint: () => Returns('bigint', x => x),
   NumInt: () => Returns('NumInt', x => x),
   'Complex<bigint>': () => Returns('Complex<bigint>', x => x),

   number: ({'equalTT(number,number)': eq}) => Returns('NumInt', n => {
      if (eq(n, Math.round(n))) return Math.round(n)
      return Math.floor(n)
   }),

   'Complex<T>': Complex.promoteUnary['Complex<T>'],

   // OK to include a type totally not in Pocomath yet, it'll never be
   // activated.
   BigNumber: ({
      'round(BigNumber)': rnd,
      'equal(BigNumber,BigNumber)': eq
   }) => Returns('BigNumber', x => eq(x,round(x)) ? round(x) : x.floor())

}

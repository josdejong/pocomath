import {Complex} from '../complex/Types/Complex.mjs'

/* Note we don't **export** any types here, so that only the options
 * below that correspond to types that have been installed are activated.
 */

export const floor = {
   bigint: () => x => x,
   NumInt: () => x => x, // Because Pocomath isn't part of typed-function, or
   GaussianInteger: () => x => x, // at least have access to the real
   // typed-function parse, we unfortunately can't coalesce these into one
   // entry with type `bigint|NumInt|GaussianInteger` because they couldn't
   // be separately activated then

   number: ({'equal(number,number)': eq}) => n => {
      if (eq(n, Math.round(n))) return Math.round(n)
      return Math.floor(n)
   },

   Complex: Complex.promoteUnary.Complex,

   // OK to include a type totally not in Pocomath yet, it'll never be
   // activated.
   Fraction: ({quotient}) => f => quotient(f.n, f.d),
}

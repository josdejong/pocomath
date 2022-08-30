import Returns from '../core/Returns.mjs'

/* Plain functions are OK, too, and they can be decorated with a return type
 * just like an implementation.
 */
const factorial = Returns('bigint', function factorial(n) {
   n = BigInt(n)
   let prod = 1n
   for (let i = n; i > 1n; --i) {
      prod *= i
   }
   return prod
})

export {factorial}

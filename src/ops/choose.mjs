import Returns from '../core/Returns.mjs'

/* Note this is _not_ a good algorithm for computing binomial coefficients,
 * it's just for demonstration purposes
 */
export const choose = {
   'NumInt,NumInt': ({factorial}) => Returns(
      'NumInt', (n,k) => Number(factorial(n) / (factorial(k)*factorial(n-k)))),
   'bigint,bigint': ({
      factorial
   }) => Returns('bigint', (n,k) => factorial(n) / (factorial(k)*factorial(n-k)))
}
        

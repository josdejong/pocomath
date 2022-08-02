/* Note this is not a good algorithm for computing binomial coefficients,
 * it's just for demonstration purposes
 */
export const choose = {
   'NumInt,NumInt': ({factorial}) => (n,k) => Number(
      factorial(n) / (factorial(k)*factorial(n-k))),
   'bigint,bigint': ({
      factorial
   }) => (n,k) => factorial(n) / (factorial(k)*factorial(n-k))
}
        

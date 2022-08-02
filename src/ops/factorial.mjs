export function factorial(n) {
   n = BigInt(n)
   let prod = 1n
   for (let i = n; i > 1n; --i) {
      prod *= i
   }
   return prod
}

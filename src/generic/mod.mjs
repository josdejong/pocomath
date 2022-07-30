export const mod = {
   'any,any': ({
      subtract,
      multiply,
      quotient}) => (a,m) => subtract(a, multiply(m, quotient(a,m)))
}

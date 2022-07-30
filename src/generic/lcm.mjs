export const lcm = {
   'any,any': ({
      multiply,
      quotient,
      gcd}) => (a,b) => multiply(quotient(a, gcd(a,b)), b)
}

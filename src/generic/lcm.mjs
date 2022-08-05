import {reducingOperation} from './reducingOperation.mjs'

export const lcm = {
   'T,T': ({
      'multiply(T,T)': multT,
      'quotient(T,T)': quotT,
      'gcd(T,T)': gcdT
   }) => (a,b) => multT(quotT(a, gcdT(a,b)), b)
}
Object.assign(lcm, reducingOperation)

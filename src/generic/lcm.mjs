import Returns from '../core/Returns.mjs'
import {reducingOperation} from './reducingOperation.mjs'

export const lcm = {
   'T,T': ({
      T,
      'multiply(T,T)': multT,
      'quotient(T,T)': quotT,
      'gcd(T,T)': gcdT
   }) => Returns(T, (a,b) => multT(quotT(a, gcdT(a,b)), b))
}
Object.assign(lcm, reducingOperation)

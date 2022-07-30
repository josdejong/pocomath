import PocomathInstance from '../core/PocomathInstance.mjs'
import * as Complex from './Types/Complex.mjs'
import gcdType from '../generic/gcdType.mjs'

const imps = {
   gcdComplexRaw: gcdType('Complex'),
   gcd: { // Only return gcds with positive real part
      'Complex, Complex': ({gcdComplexRaw, sign, one, negate}) => (z,m) => {
         const raw = gcdComplexRaw(z, m)
         if (sign(raw.re) === one(raw.re)) return raw
         return negate(raw)
      }
   }
}

export const gcd = PocomathInstance.merge(Complex, imps)


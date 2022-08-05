import PocomathInstance from '../core/PocomathInstance.mjs'
import * as Complex from './Types/Complex.mjs'
import gcdType from '../generic/gcdType.mjs'

const imps = {
   gcdGIRaw: gcdType('GaussianInteger'),
   gcd: { // Only return gcds with positive real part
      'GaussianInteger,GaussianInteger': ({
         'gcdGIRaw(GaussianInteger,GaussianInteger)': gcdRaw,
         'sign(bigint)': sgn,
         'negate(GaussianInteger)': neg
      }) => (z,m) => {
         const raw = gcdRaw(z, m)
         if (sgn(raw.re) === 1n) return raw
         return neg(raw)
      }
   }
}

export const gcd = PocomathInstance.merge(Complex, imps)

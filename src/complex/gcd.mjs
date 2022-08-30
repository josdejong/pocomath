import PocomathInstance from '../core/PocomathInstance.mjs'
import Returns from '../core/Returns.mjs'
import * as  Complex from './Types/Complex.mjs'
import gcdType from '../generic/gcdType.mjs'

const gcdComplexRaw = {}
Object.assign(gcdComplexRaw, gcdType('Complex<bigint>'))
Object.assign(gcdComplexRaw, gcdType('Complex<NumInt>'))
const imps = {
   gcdComplexRaw,
   gcd: { // Only return gcds with positive real part
      'Complex<T>,Complex<T>': ({
         T,
         'gcdComplexRaw(Complex<T>,Complex<T>)': gcdRaw,
         'sign(T)': sgn,
         'one(T)': uno,
         'negate(Complex<T>)': neg
      }) => Returns(`Complex<${T}>`, (z,m) => {
         const raw = gcdRaw(z, m)
         if (sgn(raw.re) === uno(raw.re)) return raw
         return neg(raw)
      })
   }
}

export const gcd = PocomathInstance.merge(Complex, imps)

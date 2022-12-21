import { Add, Equal } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'

export type IsReal<T> = (z: T) => boolean
export type IsRealNumber = IsReal<number>
export type IsRealComplex<T> = IsReal<Complex<T>>

export const isReal = {
   'infer:1': function <T>(): IsRealNumber {
      return (z) => true
   },

   'infer:2': function <T>({ equal, add }: {
      equal: Equal<T>,
      add: Add<T>
   }): IsRealComplex<T> {
      return z => equal(z.re, add(z.re, z.im))
   }
}

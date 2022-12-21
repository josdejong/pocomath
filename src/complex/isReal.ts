import { Add, Equal } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'

export type IsReal<T> = (z: Complex<T>) => boolean

export const isReal = {
   infer: function <T>({ equal, add }: {
      equal: Equal<T>,
      add: Add<T>
   }): IsReal<T> {
      return z => equal(z.re, add(z.re, z.im))
   }
}

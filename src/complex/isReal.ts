import { Add, Equal } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'

export type IsReal<T> = (z: T) => boolean
export type IsRealNumber = IsReal<number>
export type IsRealComplex<T> = IsReal<Complex<T>>

export type AddDep<T> = {
   add: Add<T>
}

export type EqualDep<T> = {
   equal: Equal<T>
}

// we could bundle dependencies in logical groups
// not sure if this is something we should want 
export type ArithmeticDeps<T> = AddDep<T> & EqualDep<T> // & ...

export const isReal = {
   'infer:0': function <T>(): IsRealNumber {
      return (z) => true
   },

   // approach 1 (name 3x)
   'infer:1': function <T>({ equal, add }: {
      equal: Equal<T>,
      add: Add<T>
   }): IsRealComplex<T> {
      return z => equal(z.re, add(z.re, z.im))
   },

   // approach 2 (name 2x, but no destructuring, have to write dep.equal and dep.add)
   'infer:2': function <T>(dep: {
      equal: Equal<T>,
      add: Add<T>
   }): IsRealComplex<T> {
      return z => dep.equal(z.re, dep.add(z.re, z.im))
   },

   // approach 3 (name 2x)
   'infer:3': function <T>({ equal, add }: AddDep<T> & EqualDep<T>): IsRealComplex<T> {
      return z => equal(z.re, add(z.re, z.im))
   },

   // approach 4 (name 1x, but no destructuring, have to write dep.equal and dep.add)
   'infer:4': function <T>(dep: AddDep<T> & EqualDep<T>): IsRealComplex<T> {
      return z => dep.equal(z.re, dep.add(z.re, z.im))
   },

   // approach 5 (name 2x, injecting a bunch of deps in one go)
   'infer:5': function <T>({ equal, add }: ArithmeticDeps<T>): IsRealComplex<T> {
      return z => equal(z.re, add(z.re, z.im))
   }
}

import { Zero } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'

export type ComplexFn1<T> = (x: T) => Complex<T>
export type ComplexFn2<T> = (re: T, im: T) => Complex<T>
export type ComplexFn<T> = ComplexFn1<T> & ComplexFn2<T>

export const complex = {
   'infer:1': function <T>({ zero }: {
      zero: Zero<T>
   }): ComplexFn1<T> {
      return (x) => ({ re: x, im: zero(x) })
   },
   'infer:2': function <T>(): ComplexFn2<T> {
      return (re, im) => ({ re, im })
   }
}

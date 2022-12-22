import { Zero } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'

export type ComplexUnary<T> = (x: T) => Complex<T>
export type ComplexBinary<T> = (re: T, im: T) => Complex<T>
export type ComplexFn<T> = ComplexUnary<T> & ComplexBinary<T>

export const complex = {
   'infer:1': function <T>({ zero }: {
      zero: Zero<T>
   }): ComplexUnary<T> {
      return (x) => ({ re: x, im: zero(x) })
   },
   'infer:2': function <T>(): ComplexBinary<T> {
      return (re, im) => ({ re, im })
   }
}

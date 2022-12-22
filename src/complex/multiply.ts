import { Add, Multiply, Subtract } from '../interfaces/arithmetic.js'
import { Complex } from './interfaces.js'
import { ComplexBinary } from './complex.js'
import { Conjugate } from './conjugate.js'

export const multiply = {
   'infer': <T>({
      complex,
      add,
      subtract,
      multiply,
      conjugate
   }: {
      complex: ComplexBinary<T>,
      add: Add<T>,
      subtract: Subtract<T>,
      multiply: Multiply<T>,
      conjugate: Conjugate<T>
   }): Multiply<Complex<T>> => (w, z) => {
      const realpart = subtract(multiply(w.re, z.re), multiply(conjugate(w.im), z.im))
      const imagpart = add(multiply(conjugate(w.re), z.im), multiply(w.im, z.re))
      return complex(realpart, imagpart)
   }
}

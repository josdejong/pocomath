import { Sum, Mean } from '../interfaces/arithmetic'
import { NumInt } from '../number/interfaces'

export const mean = {
   'infer': function <T>({
      sum,
      divide
   }: {
      sum: Sum<T>,
      divide: (a: T, b: NumInt) => T
   }): Mean<T> {
      return (...args) => divide(sum(...args), args.length)
   }
}

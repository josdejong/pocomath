import { Multiply } from '../interfaces/arithmetic.js'

export const square = {
   'infer': function <T>({ multiply }: {
      multiply: Multiply<T>
   }) {
      return (x: T) => multiply(x, x)
   }
}

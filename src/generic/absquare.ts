import { Abs, Square } from "../interfaces/arithmetic"

export type AbsSquare<T> = (x: T) => T

export const absquare = {
   'infer': function <T>({ square, abs }: {
      square: Square<T>,
      abs: Abs<T>
   }): AbsSquare<T> {
      return (t) => square(abs(t))
   }
}

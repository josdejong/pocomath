import { Abs, Square } from "../interfaces/arithmetic"

export type AbsSquare<T> = (x: T) => T

export type AbsDep<T> = {
   abs: Abs<T>
}
export type SquareDep<T> = {
   square: Square<T>
}

// we could bundle dependencies in logical groups
// not sure if this is something we should want 
export type ArithmeticDeps<T> = AbsDep<T> & SquareDep<T> // & ...

export const absquare = {
   // approach 1: destructuring and an object with dependencies
   'infer:1': function <T>({ square, abs }: {
      square: Square<T>,
      abs: Abs<T>
   }): AbsSquare<T> {
      return (t) => square(abs(t))
   },

   // approach 2: no destructuring
   'infer:2': function <T>(dep: {
      square: Square<T>,
      abs: Abs<T>
   }): AbsSquare<T> {
      return (t) => dep.square(dep.abs(t))
   },

   // approach 3: use a union of special Dependency types
   'infer:3': function <T>({ square, abs }: AbsDep<T> & SquareDep<T>): AbsSquare<T> {
      return (t) => square(abs(t))
   },

   // approach 4: use a bundle of special Dependency types
   'infer:4': function <T>({ square, abs }: ArithmeticDeps<T>): AbsSquare<T> {
      return (t) => square(abs(t))
   }
}

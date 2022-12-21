import { Abs, Smaller, Negate, Zero } from "../interfaces/arithmetic"

export const abs = {
   infer: function <T>({ smaller, negate, zero }: {
      smaller: Smaller<T>,
      negate: Negate<T>,
      zero: Zero<T>
   }): Abs<T> {
      return t => (smaller(t, zero()) ? negate(t) : t)
   }
}

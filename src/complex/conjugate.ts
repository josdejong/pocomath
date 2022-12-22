import { Negate, Zero } from "../interfaces/arithmetic"
import { ComplexBinary } from "./complex"
import { Complex } from "./interfaces"

export type ConjugateReal<T> = (z: T) => T
export type ConjugateComplex<T> = (z: Complex<T>) => Complex<T>
export type Conjugate<T> = ConjugateReal<T> & ConjugateComplex<T>

export const conjugate = {
   'infer:1': <T>(): ConjugateReal<T> => z => z,

   'infer:2': <T>({ complex, negate }: {
      complex: ComplexBinary<T>,
      negate: Negate<T>
   }): ConjugateComplex<T> => z => complex(z.re, negate(z.im))
}

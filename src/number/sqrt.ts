import { Negate } from '../interfaces/arithmetic'
import { Complex } from '../complex/interfaces'
import { ComplexFn } from '../complex/complex'
import { Config } from '../core/Config'

export type SqrtNumber = (x: number) => number | Complex<number>

export const sqrt = {
   'infer': ({
      config,
      complex,
      negate
   }: {
      config: Config,
      complex?: ComplexFn<number>,
      negate: Negate<number>
   }): SqrtNumber => {
      if (config.predictable || !complex) {
         return n => isNaN(n) ? NaN : Math.sqrt(n)
      } else {
         return n => {
            if (isNaN(n)) return NaN
            if (n >= 0) return Math.sqrt(n)
            return complex(0, Math.sqrt(negate(n)))
         }
      }
   }
}

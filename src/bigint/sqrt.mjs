import Returns from '../core/Returns.mjs'
import isqrt from 'bigint-isqrt'
export * from './Types/bigint.mjs'

export const sqrt = {
   bigint: ({
      config,
      'complex(bigint,bigint)': cplx,
      'negate(bigint)': neg
   }) => {
      if (config.predictable) {
         // Don't just return the constant isqrt here because the object
         // gets decorated with info that might need to be different
         // for different PocomathInstancss
         return Returns('bigint', b => isqrt(b))
      }
      if (!cplx) {
         return Returns('bigint|undefined', b => {
            if (b >= 0n) {
               const trial = isqrt(b)
               if (trial * trial === b) return trial
            }
            return undefined
         })
      }
      return Returns('bigint|Complex<bigint>|undefined', b => {
         if (b === undefined) return undefined
         let real = true
         if (b < 0n) {
            b = neg(b)
            real = false
         }
         const trial = isqrt(b)
         if (trial * trial !== b) return undefined
         if (real) return trial
         return cplx(0n, trial)
      })
   }
}

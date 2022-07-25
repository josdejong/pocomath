export * from './Types/bigint.mjs'
import isqrt from 'bigint-isqrt'

export const sqrt = {
   bigint: ({config, complex, 'self(Complex)': complexSqrt}) => {
      if (config.predictable) {
         // Don't just return the constant isqrt here because the object
         // gets decorated with info that might need to be different
         // for different PocomathInstancss
         return b => isqrt(b)
      }
      if (!complexSqrt) {
         return b => {
            if (b >= 0n) {
               const trial = isqrt(b)
               if (trial * trial === b) return trial
            }
            return undefined
         }
      }
      return b => {
         if (b >= 0n) {
            const trial = isqrt(b)
            if (trial * trial === b) return trial
            return undefined
         }
         return complexSqrt(complex(b))
      }
   }
}

export * from './Types/Complex.mjs'

export const sqrt = {
   Complex: ({
      config,
      zero,
      sign,
      one,
      add,
      complex,
      multiply,
      self,
      divide,
      'abs(Complex)': abs,
      subtract
   }) => {
      if (config.predictable) {
         return z => {
            const imZero = zero(z.im)
            const imSign = sign(z.im)
            const reOne = one(z.re)
            const reSign = sign(z.re)
            if (imSign === imZero && reSign === reOne) return complex(self(z.re))
            const reTwo = add(reOne, reOne)
            return complex(
               multiply(sign(z.im), self(divide(add(abs(z),z.re), reTwo))),
               self(divide(subtract(abs(z),z.re), reTwo))
            )
         }
      }
      return z => {
         const imZero = zero(z.im)
         const imSign = sign(z.im)
         const reOne = one(z.re)
         const reSign = sign(z.re)
         if (imSign === imZero && reSign === reOne) return self(z.re)
         const reTwo = add(reOne, reOne)
         const partial = add(abs(z), z.re)
         return complex(
            multiply(sign(z.im), self(divide(add(abs(z),z.re), reTwo))),
            self(divide(subtract(abs(z),z.re), reTwo))
         )
      }
   }
}


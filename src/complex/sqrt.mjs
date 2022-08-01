export * from './Types/Complex.mjs'

export const sqrt = {
   Complex: ({
      config,
      isZero,
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
            const reOne = one(z.re)
            if (isZero(z.im) && sign(z.re) === reOne) return complex(self(z.re))
            const reTwo = add(reOne, reOne)
            return complex(
               multiply(sign(z.im), self(divide(add(abs(z),z.re), reTwo))),
               self(divide(subtract(abs(z),z.re), reTwo))
            )
         }
      }
      return z => {
         const reOne = one(z.re)
         if (isZero(z.im) && sign(z.re) === reOne) return self(z.re)
         const reTwo = add(reOne, reOne)
         return complex(
            multiply(sign(z.im), self(divide(add(abs(z),z.re), reTwo))),
            self(divide(subtract(abs(z),z.re), reTwo))
         )
      }
   }
}


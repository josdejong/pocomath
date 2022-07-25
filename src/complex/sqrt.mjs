export { Types } from './Types/Complex.mjs'

export const sqrt = {
   Complex: ({
      config,
      complex,
      multiply,
      sign,
      self,
      divide,
      add,
      'abs(Complex)': abs,
      subtract
   }) => {
      if (config.predictable) {
         return z => {
            const imSign = sign(z.im)
            const reSign = sign(z.re)
            if (imSign === 0 && reSign === 1) return complex(self(z.re))
            return complex(
               multiply(sign(z.im), self(divide(add(abs(z),z.re), 2))),
               self(divide(subtract(abs(z),z.re), 2))
            )
         }
      }
      return z => {
         const imSign = sign(z.im)
         const reSign = sign(z.re)
         if (imSign === 0 && reSign === 1) return self(z.re)
         return complex(
            multiply(sign(z.im), self(divide(add(abs(z),z.re), 2))),
            self(divide(subtract(abs(z),z.re), 2))
         )
      }
   }
}


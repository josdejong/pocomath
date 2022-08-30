import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const sqrt = {
   'Complex<T>': ({
      config,
      'isZero(T)': isZ,
      'sign(T)': sgn,
      'one(T)': uno,
      'add(T,T)': plus,
      'complex(T)': cplxU,
      'complex(T,T)': cplxB,
      'multiply(T,T)': mult,
      'self(T)': me,
      'divide(T,T)': div,
      'absquare(Complex<T>)': absqC,
      'subtract(T,T)': sub
   }) => {
      let baseReturns = returnTypeOf(me)
      if (baseReturns.includes('|')) {
         // Bit of a hack, because it is relying on other implementations
         // to list the "typical" value of sqrt first
         baseReturns = baseReturns.split('|', 1)[0]
      }

      if (config.predictable) {
         return Returns(`Complex<${baseReturns}>`, z => {
            const reOne = uno(z.re)
            if (isZ(z.im) && sgn(z.re) === reOne) return cplxU(me(z.re))
            const reTwo = plus(reOne, reOne)
            const myabs = me(absqC(z))
            return cplxB(
               mult(sgn(z.im), me(div(plus(myabs, z.re), reTwo))),
               me(div(sub(myabs, z.re), reTwo))
            )
         })
      }

      return Returns(
         `Complex<${baseReturns}>|${baseReturns}|undefined`,
         z => {
            const reOne = uno(z.re)
            if (isZ(z.im) && sgn(z.re) === reOne) return me(z.re)
            const reTwo = plus(reOne, reOne)
            const myabs = me(absqC(z))
            const reSqrt = me(div(plus(myabs, z.re), reTwo))
            const imSqrt = me(div(sub(myabs, z.re), reTwo))
            if (reSqrt === undefined || imSqrt === undefined) return undefined
            return cplxB(mult(sgn(z.im), reSqrt), imSqrt)
         }
      )
   }
}

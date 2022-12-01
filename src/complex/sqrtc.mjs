import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const sqrtc = {
   'Complex<T>': ({
      'isZero(T)': isZ,
      'sign(T)': sgn,
      'one(T)': uno,
      'add(T,T)': plus,
      'complex(T)': cplxU,
      'complex(T,T)': cplxB,
      'multiply(T,T)': mult,
      'sqrt(T)': sqt,
      'divide(T,T)': div,
      'absquare(Complex<T>)': absqC,
      'subtract(T,T)': sub
   }) => {
      if (isZ.checkingDependency) return undefined
      let baseReturns = returnTypeOf(sqt)
      if (baseReturns.includes('|')) {
         // Bit of a hack, because it is relying on other implementations
         // to list the "typical" value of sqrt first
         baseReturns = baseReturns.split('|', 1)[0]
      }
      return Returns(`Complex<${baseReturns}>`, z => {
         const reOne = uno(z.re)
         if (isZ(z.im) && sgn(z.re) === reOne) return cplxU(sqt(z.re))
         const myabs = sqt(absqC(z))
         const reTwo = plus(reOne, reOne)
         const reQuot = div(plus(myabs, z.re), reTwo)
         const imQuot = div(sub(myabs, z.re), reTwo)
         if (reQuot === undefined || imQuot === undefined) {
            throw new TypeError(`Cannot compute sqrt of ${z.re} + {z.im}i`)
         }
         return cplxB(
            mult(sgn(z.im), sqt(div(plus(myabs, z.re), reTwo))),
            sqt(div(sub(myabs, z.re), reTwo))
         )
      })
   }
}

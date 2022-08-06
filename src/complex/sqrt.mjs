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
      'abs(Complex<T>)': absC,
      'subtract(T,T)': sub
   }) => {
      if (config.predictable) {
         return z => {
            const reOne = uno(z.re)
            if (isZ(z.im) && sgn(z.re) === reOne) return cplxU(me(z.re))
            const reTwo = plus(reOne, reOne)
            return cplxB(
               mult(sgn(z.im), me(div(plus(absC(z),z.re), reTwo))),
               me(div(sub(absC(z),z.re), reTwo))
            )
         }
      }
      return z => {
         const reOne = uno(z.re)
         if (isZ(z.im) && sgn(z.re) === reOne) return me(z.re)
         const reTwo = plus(reOne, reOne)
         const reSqrt = me(div(plus(absC(z),z.re), reTwo))
         const imSqrt = me(div(sub(absC(z),z.re), reTwo))
         if (reSqrt === undefined || imSqrt === undefined) return undefined
         return cplxB(mult(sgn(z.im), reSqrt), imSqrt)
      }
   }
}


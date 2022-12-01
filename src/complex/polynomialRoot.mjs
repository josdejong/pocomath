import Returns from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

export const polynomialRoot = {
   'Complex<T>,...Complex<T>': ({
      T,
      'tuple(...Complex<T>)': tupCplx,
      'tuple(...T)': tupReal,
      'isZero(Complex<T>)': zero,
      'complex(T)': C,
      'multiply(Complex<T>,Complex<T>)': mul,
      'divide(Complex<T>,Complex<T>)': div,
      'negate(Complex<T>)': neg,
      'isReal(Complex<T>)': real,
      'equalTT(Complex<T>,Complex<T>)': eq,
      'add(Complex<T>,Complex<T>)': plus,
      'subtract(Complex<T>,Complex<T>)': sub,
      'sqrtc(Complex<T>)': sqt,
      'cbrtc(Complex<T>)': cbt
   }) => Returns(`Tuple<${T}>|Tuple<Complex<${T}>>`, (constant, rest) => {
      // helper to convert results to appropriate tuple type
      const typedTup = arr => {
         if (arr.every(real)) {
            return tupReal.apply(tupReal, arr.map(z => z.re))
         }
         return tupCplx.apply(tupCplx, arr)
      }

      const coeffs = [constant, ...rest]
      while (coeffs.length > 0 && zero(coeffs[coeffs.length - 1])) {
         coeffs.pop()
      }
      if (coeffs.length < 2) {
      }
      switch (coeffs.length) {
         case 0: case 1:
            throw new RangeError(
               `Polynomial [${constant}, ${rest}] must have at least one`
                  + 'non-zero non-constant coefficient')
         case 2: // linear
            return typedTup([neg(div(coeffs[0], coeffs[1]))])
         case 3: { // quadratic
            const [c, b, a] = coeffs
            const denom = mul(C(2), a)
            const d1 = mul(b, b)
            const d2 = mul(C(4), mul(a, c))
            if (eq(d1, d2)) {
               return typedTup([div(neg(b), denom)])
            }
            let discriminant = sqt(sub(d1, d2))
            return typedTup([
               div(sub(discriminant, b), denom),
               div(sub(neg(discriminant), b), denom)
            ])
         }
         case 4: { // cubic, cf. https://en.wikipedia.org/wiki/Cubic_equation
            const [d, c, b, a] = coeffs
            const denom = neg(mul(C(3), a))
            const asqrd = mul(a, a)
            const D0_1 = mul(b, b)
            const bcubed = mul(D0_1, b)
            const D0_2 = mul(C(3), mul(a, c))
            const D1_1 = plus(
               mul(C(2), bcubed), mul(C(27), mul(asqrd, d)))
            const abc = mul(a, mul(b, c))
            const D1_2 = mul(C(9), abc)
            // Check for a triple root
            if (eq(D0_1, D0_2) && eq(D1_1, D1_2)) {
               return typedTup([div(b, denom)])
            }
            const Delta0 = sub(D0_1, D0_2)
            const Delta1 = sub(D1_1, D1_2)
            const csqrd = mul(c, c)
            const discriminant1 = plus(
               mul(C(18), mul(abc, d)), mul(D0_1, csqrd))
            const discriminant2 = plus(
               mul(C(4), mul(bcubed, d)),
               plus(
                  mul(C(4), mul(a, mul(csqrd, c))),
                  mul(C(27), mul(asqrd, mul(d, d)))))
            // See if we have a double root
            if (eq(discriminant1, discriminant2)) {
               return typedTup([
                  div(
                     sub(
                        mul(C(4), abc),
                        plus(mul(C(9), mul(asqrd, d)), bcubed)),
                     mul(a, Delta0)), // simple root
                  div(
                     sub(mul(C(9), mul(a, d)), mul(b, c)),
                     mul(C(2), Delta0)) // double root
               ])
            }
            // OK, we have three distinct roots
            let Ccubed
            if (eq(D0_1, D0_2)) {
               Ccubed = Delta1
            } else {
               Ccubed = div(
                  plus(
                     Delta1,
                     sqt(sub(
                        mul(Delta1, Delta1),
                        mul(C(4), mul(Delta0, mul(Delta0, Delta0)))))
                  ),
                  C(2))
            }
            const croots = cbt(Ccubed)
            return typedTup(cbt(Ccubed).elts.map(
               C => div(plus(b, plus(C, div(Delta0, C))), denom)))
         }
         default:
            throw new RangeError(
               'only implemented for cubic or lower-order polynomials, '
                  + `not ${JSON.stringify(coeffs)}`)
      }
   })
}

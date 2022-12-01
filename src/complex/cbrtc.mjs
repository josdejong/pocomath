import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

const TAU3 = 2 * Math.PI / 3

/* Complex cube root that returns all three roots as a tuple of complex. */
/* follows the implementation in mathjs */
/* Really only works for T = number at the moment because of arg and cbrt */
export const cbrtc = {
   'Complex<T>': ({
      'arg(T)': theta,
      'divide(T,T)': div,
      'abs(Complex<T>)': absval,
      'complex(T)': cplx,
      'cbrt(T)': cbrtT,
      'multiply(Complex<T>,Complex<T>)': mult,
      'cis(T)': cisT,
      'tuple(...Complex<T>)': tup
   }) => Returns('Tuple<Complex<T>>', z => {
      const arg3 = div(theta(z), 3)
      const r = cplx(cbrtT(absval(z)))
      return tup(
         mult(r, cisT(arg3)),
         mult(r, cisT(arg3 + TAU3)),
         mult(r, cisT(arg3 - TAU3))
      )
   })
}

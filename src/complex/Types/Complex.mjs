import {Returns, returnTypeOf} from '../../core/Returns.mjs'
import PocomathInstance from '../../core/PocomathInstance.mjs'

const Complex = new PocomathInstance('Complex')
// Now the template type: Complex numbers are actually always homogeneous
// in their component types. For an explanation of the meanings of the
// properties, see ../../tuple/Types/Tuple.mjs
Complex.installType('Complex<T>', {
   base: z => z && typeof z === 'object' && 're' in z && 'im' in z,
   test: testT => z => testT(z.re) && testT(z.im),
   infer: ({typeOf, joinTypes}) => z => joinTypes([typeOf(z.re), typeOf(z.im)]),
   from: {
      T: t => ({re: t, im: t-t}), // hack: maybe need a way to call zero(T)
      U: convert => u => {
         const t = convert(u)
         return ({re: t, im: t-t})
      },
      'Complex<U>': convert => cu => ({re: convert(cu.re), im: convert(cu.im)})
   }
})

Complex.promoteUnary = {
   'Complex<T>': ({
      T,
      'self(T)': me,
      complex
   }) => Returns(
      `Complex<${returnTypeOf(me)}>`, z => complex(me(z.re), me(z.im)))
}

export {Complex}

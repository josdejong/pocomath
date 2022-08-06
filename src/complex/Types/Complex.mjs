import PocomathInstance from '../../core/PocomathInstance.mjs'

const Complex = new PocomathInstance('Complex')
// Base type that should generally not be used directly
Complex.installType('Complex', {
   test: z => z && typeof z === 'object' && 're' in z && 'im' in z
})
// Now the template type: Complex numbers are actually always homeogeneous
// in their component types.
Complex.installType('Complex<T>', {
   infer: ({typeOf, joinTypes}) => z => joinTypes([typeOf(z.re), typeOf(z.im)]),
   test: testT => z => testT(z.re) && testT(z.im),
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
   'Complex<T>': ({'self(T)': me, complex}) => z => complex(me(z.re), me(z.im))
}

export {Complex}

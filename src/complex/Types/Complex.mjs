import PocomathInstance from '../../core/PocomathInstance.mjs'

/* Use a plain object with keys re and im for a complex; note the components
 * can be any type (for this proof-of-concept; in reality we'd want to
 * insist on some numeric or scalar supertype).
 */
function isComplex(z) { 
   return z && typeof z === 'object' && 're' in z && 'im' in z
}

const Complex = new PocomathInstance('Complex')
Complex.installType('Complex', {
   test: isComplex,
   from: {
      number: x => ({re: x, im: 0}),
      bigint: x => ({re: x, im: 0n})
   }
})

export {Complex}

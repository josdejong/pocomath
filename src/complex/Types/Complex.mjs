/* Use a plain object with keys re and im for a complex; note the components
 * can be any type (for this proof-of-concept; in reality we'd want to
 * insist on some numeric or scalar supertype).
 */
export function isComplex(z) { 
   return z && typeof z === 'object' && 're' in z && 'im' in z
}

export const Types = {
   Complex: {
      test: isComplex,
      from: {
         number: x => ({re: x, im: 0}),
         bigint: x => ({re: x, im: 0n})
      }
   }
}

/* test if an entity is Complex<number>, so to speak: */
export function numComplex(z) {
   return isComplex(z) && typeof z.re === 'number' && typeof z.im === 'number'
}

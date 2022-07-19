import typed from 'typed-function'

/* Use a plain object with keys re and im for a complex; note the components
 * can be any type (for this proof-of-concept; in reality we'd want to
 * insist on some numeric or scalar supertype).
 */
export function isComplex(z) { 
   return z && typeof z === 'object' && 're' in z && 'im' in z
}

typed.addType({name: 'Complex', test: isComplex})
typed.addConversion({
   from: 'number',
   to: 'Complex',
   convert: x => ({re: x, im: 0})
})
/* Pleasantly enough, it is OK to add this conversion even if there is no
 * type 'bigint' defined, so everything should Just Work.
 */
typed.addConversion({
   from: 'bigint',
   to: 'Complex',
   convert: x => ({re: x, im: 0n})
})

/* test if an entity is Complex<number>, so to speak: */
export function numComplex(z) {
   return isComplex(z) && typeof z.re === 'number' && typeof z.im === 'number'
}

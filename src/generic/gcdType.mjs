import Returns from '../core/Returns.mjs'

/* Note we do not use a template here so that we can explicitly control
 * which types this is instantiated for, namely the "integer" types, and
 * not simply allow Pocomath to generate instances for any type it encounters.
 */
/* Returns a object that defines the gcd for the given type */
export default function(type) {
   const producer = refs => {
      const modder = refs[`mod(${type},${type})`]
      const zeroTester = refs[`isZero(${type})`]
      return Returns(type, (a,b) => {
         while (!zeroTester(b)) {
            const r = modder(a,b)
            a = b
            b = r
         }
         return a
      })
   }
   const retval = {}
   retval[`${type},${type}`] = producer
   return retval
}

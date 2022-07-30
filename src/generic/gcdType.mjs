/* Returns a object that defines the gcd for the given type */
export default function(type) {
   const producer = refs => {
      const modder = refs[`mod(${type},${type})`]
      const zeroTester = refs[`isZero(${type})`]
      return (a,b) => {
         while (!zeroTester(b)) {
            const r = modder(a,b)
            a = b
            b = r
         }
         return a
      }
   }
   const retval = {}
   retval[`${type},${type}`] = producer
   return retval
}

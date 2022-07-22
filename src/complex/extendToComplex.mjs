import * as complex from './complex.mjs'

/* Add all the complex implementations for functions already
   in the instance:
*/

export default async function extendToComplex(pmath) {
   pmath.install(complex)
   for (const name in pmath._imps) {
      const modulePath = `./${name}.mjs`
      try {
         const mod = await import(modulePath)
         pmath.install(mod)
      } catch (err) {
         // Guess it wasn't a method available in complex; no worries
      }
   }
}

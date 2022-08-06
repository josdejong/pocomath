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
   // Since extension to complex was specifically requested, instantiate
   // all of the templates so that the associated type conversions will
   // be available to make function calls work immediately:
   for (const baseType in pmath.Types) {
      if (baseType in pmath.Templates || baseType.includes('<')) {
         continue // don't mess with templates
      }
      const ignore = new Set(['undefined', 'any', 'T', 'ground'])
      if (ignore.has(baseType)) continue
      // (What we really want is a check for "numeric" types but we don't
      //  have that concept (yet?)). If we did, we'd instantiate just for those...
      pmath.instantiateTemplate('Complex', baseType)
   }
}

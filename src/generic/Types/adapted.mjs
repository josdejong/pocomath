import PocomathInstance from '../../core/PocomathInstance.mjs'
/* creates a PocomathInstance incorporating a new numeric type encapsulated
 * as a class. (This instance can the be `install()ed` in another to add the
 * type so created.)
 *
 * @param {string} name       The name of the new type
 * @param {class} Thing       The class implementing the new type
 * @param {object} overrides  Patches to the auto-generated adaptation
 */
export default function adapted(name, Thing, overrides) {
   const thing = new PocomathInstance('Adapted Thing')
   const test = overrides.isa || Thing.isa || (x => x instanceof Thing)
   thing.installType(name, {
      test,
      from: overrides.from || {},
      before: overrides.before || [],
      refines: overrides.refines || undefined
   })

   // Build the operations for Thing
   const operations = {}
   // first a creator function, with name depending on the name of the thing:
   const creatorName = overrides.creatorName || name.toLowerCase()
   const creator = overrides[creatorName]
      ? overrides[creatorName]('')
      : Thing[creatorName]
         ? (Thing[creatorName])
         : ((...args) => new Thing(...args))
   const defaultCreatorImps = {
      '': () => () => creator(),
      '...any': () => args => creator(...args)
   }
   defaultCreatorImps[name] = () => x => x // x.clone(x)?
   operations[creatorName] = overrides[creatorName] || defaultCreatorImps

   // We make the default instance, just as a place to check for methods
   const instance = overrides.instance || creator()

   // Now adapt the methods to typed-function:
   const unaryOps = {
      abs: 'abs',
      ceiling: 'ceil',
      floor: 'floor',
      invert: 'inverse',
      round: 'round',
      sqrt: 'sqrt',
      negate: 'neg'
   }
   const binaryOps = {
      add: 'add',
      compare: 'compare',
      divide: 'div',
      equalTT: 'equals',
      gcd: 'gcd',
      lcm: 'lcm',
      mod: 'mod',
      multiply: 'mul',
      subtract: 'sub'
   }
   for (const [mathname, standardname] of Object.entries(unaryOps)) {
      if (standardname in instance) {
         operations[mathname] = {}
         operations[mathname][name] = () => t => t[standardname]()
      }
   }
   operations.zero = {}
   operations.zero[name] = () => t => creator()
   operations.one = {}
   operations.one[name] = () => t => creator(1)
   operations.conjugate = {}
   operations.conjugate[name] = () => t => t // or t.clone() ??

   const binarySignature = `${name},${name}`
   for (const [mathname, standardname] of Object.entries(binaryOps)) {
      if (standardname in instance) {
         operations[mathname] = {}
         operations[mathname][binarySignature] = () => (t,u) => t[standardname](u)
      }
   }
   if ('operations' in overrides) {
      Object.assign(operations, overrides.operations)
   }

   thing.install(operations)
   return thing
}

export {adapted}

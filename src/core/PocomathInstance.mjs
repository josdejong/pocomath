/* Core of pocomath: create an instance */
import typed from 'typed-function'

export default class PocomathInstance {
   /* Disallowed names for ops; beware, this is slightly non-DRY
    * in that if a new top-level PocomathInstance method is added, its name
    * must be added to this list.
    */
   static reserved = new Set(['install'])

   constructor(name) {
      this.name = name
      this._imps = {}
      this._affects = {}
      this._typed = typed.create()
      this._typed.clear()
      // Convenient hack for now, would remove when a real string type is added:
      this._typed.addTypes([{name: 'string', test: s => typeof s === 'string'}])
   }
    
   /**
    * (Partially) define one or more operations of the instance:
    *
    * @param {Object<string, Object<Signature, [string[], function]>>} ops
    *    The only parameter ops gives the semantics of the operations to install.
    *    The keys are operation names. The value for a key is an object
    *    mapping (typed-function) signature strings to pairs of dependency
    *    lists and implementation functions.
    *
    *    A dependency list is a list of strings. Each string can either be the
    *    name of a function that the corresponding implementation has to call,
    *    or a specification of a particular signature of a function that it has
    *    to call, in the form 'FN(SIGNATURE)'. Note the function name can be
    *    the special value 'self' to indicate a recursive call to the given
    *    operation (either with or without a particular signature.
    *
    *    There are two cases for the implementation function. If the dependency
    *    list is empty, it should be a function taking the arguments specified
    *    by the signature and returning the value. Otherwise, it should be
    *    a function taking an object with the dependency lists as keys and the
    *    requested functions as values, to a function taking the arguments
    *    specified by the signature and returning the value.
    *
    *    Note that the "operation" named `Types` is special: it gives
    *    types that must be installed in the instance. In this case, the keys
    *    are type names, and the values are objects with a property 'test'
    *    giving the predicate for the type, and properties for each type that can
    *    be converted **to** this type, giving the corresponding conversion
    *    function.
    */
   install(ops) {
      for (const key in ops) this._installOp(key, ops[key])
   }

   /* Used internally by install, see the documentation there */
   _installOp(name, implementations) {
      if (name.charAt(0) === '_') {
         throw new SyntaxError(
            `Pocomath: Cannot install ${name}, `
               + 'initial _ reserved for internal use.')
      }
      if (PocomathInstance.reserved.has(name)) {
         throw new SyntaxError(
            `Pocomath: the meaning of function '${name}' cannot be modified.`)
      }
      // new implementations, so set the op up to lazily recreate itself
      this._invalidate(name)
      const opImps = this._imps[name]
      for (const signature in implementations) {
         if (signature in opImps) {
            if (implementations[signature] === opImps[signature]) continue
            throw new SyntaxError(
               `Conflicting definitions of ${signature} for ${name}`)
         } else {
            opImps[signature] = implementations[signature]
            for (const dep of implementations[signature][0] || []) {
               const depname = dep.split('(', 1)[0]
               if (depname === 'self') continue
               if (!(depname in this._affects)) {
                  this._affects[depname] = new Set()
               }
               this._affects[depname].add(name)
            }
         }
      }
   }

   /**
    * Reset an operation to require creation of typed-function,
    * and if it has no implementations so far, set them up.
    */
   _invalidate(name) {
      const self = this
      Object.defineProperty(this, name, {
         configurable: true,
         get: () => self._bundle(name)
      })
      if (!(name in this._imps)) {
         this._imps[name] = {}
      }
      if (name in this._affects) {
         for (const ancestor of this._affects[name]) {
            this._invalidate(ancestor)
         }
      }
   }

   /**
    * Create a typed-function from the signatures for the given name and
    * assign it to the property with that name, returning it as well
    */
   _bundle(name) {
      const imps = this._imps[name]
      if (!imps || Object.keys(imps).length === 0) {
         throw new SyntaxError(`No implementations for ${name}`)
      }
      this._ensureTypes()
      const tf_imps = {}
      for (const signature in imps) {
         const [deps, imp] = imps[signature]
         if (deps.length === 0) {
            tf_imps[signature] = imp
         } else {
            const refs = {}
            let self_referential = false
            for (const dep of deps) {
               // TODO: handle signature-specific dependencies
               if (dep.includes('(')) {
                  throw new Error('signature specific reference unimplemented')
               }
               if (dep === 'self') {
                  self_referential = true
               } else {
                  refs[dep] = this[dep] // assume acyclic for now
               }
            }
            if (self_referential) {
               tf_imps[signature] = this._typed.referToSelf(self => {
                  refs.self = self
                  return imp(refs)
               })
            } else {
               tf_imps[signature] = imp(refs)
            }
         }
      }
      const tf = this._typed(name, tf_imps)
      Object.defineProperty(this, name, {configurable: true, value: tf})
      return tf
   }

   /**
    * Ensure that all of the requested types and conversions are actually
    * in the typed-function universe:
    */
   _ensureTypes() {
      const newTypes = []
      const newTypeSet = new Set()
      const knownTypeSet = new Set()
      const conversions = []
      const typeSpec = this._imps.Types
      for (const name in this._imps.Types) {
         knownTypeSet.add(name)
         for (const from in typeSpec[name]) {
            if (from === 'test') continue;
            conversions.push(
               {from, to: name, convert: typeSpec[name][from]})
         }
         try { // Hack: work around typed-function #154
            this._typed._findType(name)
         } catch {
            newTypeSet.add(name)
            newTypes.push({name, test: typeSpec[name].test})
         }
      }
      this._typed.addTypes(newTypes)
      const newConversions = conversions.filter(
         item => (newTypeSet.has(item.from) || newTypeSet.has(item.to)) &&
            knownTypeSet.has(item.from) && knownTypeSet.has(item.to)
      )
      this._typed.addConversions(newConversions)
   }

}

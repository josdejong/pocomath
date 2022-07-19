/* Core of pocomath: create an instance */
import typed from 'typed-function'

export default class PocomathInstance {
   constructor(name) {
      this.name = name
      this._imps = {}
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
    *    specified by the signature and returning the value
    */
   install(ops) {
      for (const key in ops) this._installOp(key, ops[key])
   }

   /* Used internally by install, see the documentation there */
   _installOp(name, implementations) {
      // new implementations, so set the op up to lazily recreate itself
      this._invalidate(name)
      const opImps = this._imps[name]
      for (const signature in implementations) {
         if (signature in opImps) {
            if (implemenatations[signature] === opImps[signature]) continue
            throw new SyntaxError(
               `Conflicting definitions of ${signature} for ${name}`)
         } else {
            opImps[signature] = implementations[signature]
         }
      }
   }

   /**
    * Reset an operation to require creation of typed-function,
    * and if it has no implementations so far, set them up.
    */
   _invalidate(name) {
      const self = this
      this[name] = function () {
         return self._bundle(name).apply(self, arguments)
      }
      if (!(name in this._imps)) {
         this._imps[name] = {}
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
      const tf_imps = {}
      for (const signature in imps) {
         const [deps, imp] = imps[signature]
         if (deps.length === 0) {
            tf_imps[signature] = imp
         } else {
            const refs = {}
            for (const dep of deps) {
               // TODO: handle self dependencies
               if (dep.slice(0,4) === 'self') {
                  throw new Error('self-reference unimplemented')
               }
               // TODO: handle signature-specific dependencies
               if (dep.includes('(')) {
                  throw new Error('signature specific reference unimplemented')
               }
               refs[dep] = this._ensureBundle(dep) // just assume acyclic for now
            }
            tf_imps[signature] = imp(refs)
         }
      }
      const tf = typed(name, tf_imps)
      this[name] = tf
      return tf
   }

   /**
    * Ensure that the generated typed function is assigned to the given
    * name and return it
    */
   _ensureBundle(name) {
      const maybe = this[name]
      if (typed.isTypedFunction(maybe)) return maybe
      return this._bundle(name)
   }
}

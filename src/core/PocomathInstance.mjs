/* Core of pocomath: create an instance */
import typed from 'typed-function'
import dependencyExtractor from './dependencyExtractor.mjs'

export default class PocomathInstance {
   /* Disallowed names for ops; beware, this is slightly non-DRY
    * in that if a new top-level PocomathInstance method is added, its name
    * must be added to this list.
    */
   static reserved = new Set(['install', 'importDependencies'])

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
    * @param {Object<string, Object<Signature, ({deps})=> implementation>>} ops
    *    The only parameter ops gives the semantics of the operations to install.
    *    The keys are operation names. The value for a key is an object
    *    mapping each desired (typed-function) signature to a function taking
    *    a dependency object to an implementation.
    *
    *    For more detail, such functions should have the format
    *    ```
    *    ({depA, depB, depC: aliasC, ...}) => (opArg1, opArg2) => <result>
    *    ```
    *    where the `depA`, `depB` etc. are the names of the
    *    operations this implementation depends on; those operations can
    *    then be referred to directly by the identifiers `depA` and `depB`
    *    in the code for the '<result>`, or when an alias has been given
    *    as in the case of `depC`, by the identifier `aliasC`.
    *    Given an object that has these dependencies with these keys, the
    *    function returns a function taking the operation arguments to the
    *    desired result of the operation.
    *
    *    You can specify that an operation depends on itself by using the
    *    special dependency identifier 'self'.
    *
    *    You can specify that an implementation depends on just a specific
    *    signature of the given operation by suffixing the dependency name
    *    with the signature in parentheses, e.g. `add(number,number)` to
    *    refer to just adding two numbers. In this case, it is of course
    *    necessary to specify an alias to be able to refer to the supplied
    *    operation in the body of the implementation. [NOTE: this signature-
    *    specific reference is not yet implemented.]
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

   /**
    * Import (and install) all dependencies of previously installed functions,
    * for the specified types.
    *
    * @param {string[]} types  A list of type names
    */
   async importDependencies(types) {
      const doneSet = new Set(['self']) // nothing to do for self dependencies
      while (true) {
         const requiredSet = new Set()
         /* Grab all of the known deps */
         for (const func in this._imps) {
            if (func === 'Types') continue
            for (const {uses} of Object.values(this._imps[func])) {
               for (const dependency of uses) {
                  const depName = dependency.split('(',1)[0]
                  if (doneSet.has(depName)) continue
                  requiredSet.add(depName)
               }
            }
         }
         if (requiredSet.size === 0) break
         for (const name of requiredSet) {
            for (const type of types) {
               try {
                  const modName = `../${type}/${name}.mjs`
                  const mod = await import(modName)
                  this.install(mod)
               } catch (err) {
                  // No such module, but that's OK
               }
            }
            doneSet.add(name)
         }
      }
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
      for (const [signature, does] of Object.entries(implementations)) {
         if (name === 'Types') {
            if (signature in opImps) {
               if (does != opImps[signature]) {
                  throw newSyntaxError(
                     `Conflicting definitions of type ${signature}`)
               }
            } else {
               opImps[signature] = does
            }
            continue
         }
         if (signature in opImps) {
            if (does !== opImps[signature].does) {
               throw new SyntaxError(
                  `Conflicting definitions of ${signature} for ${name}`)
            }
         } else {
            if (name === 'Types') {
               opImps[signature] = does
               continue
            }
            const uses = new Set()
            does(dependencyExtractor(uses))
            opImps[signature] = {uses, does}
            for (const dep of uses) {
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
      for (const [signature, {uses, does}] of Object.entries(imps)) {
         if (uses.length === 0) {
            tf_imps[signature] = does()
         } else {
            const refs = {}
            let self_referential = false
            for (const dep of uses) {
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
                  return does(refs)
               })
            } else {
               tf_imps[signature] = does(refs)
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

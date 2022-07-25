/* Core of pocomath: create an instance */
import typed from 'typed-function'
import dependencyExtractor from './dependencyExtractor.mjs'
import {subsetOfKeys, typesOfSignature} from './utils.mjs'

export default class PocomathInstance {
   /* Disallowed names for ops; beware, this is slightly non-DRY
    * in that if a new top-level PocomathInstance method is added, its name
    * must be added to this list.
    */
   static reserved = new Set(['config', 'importDependencies', 'install', 'name'])

   constructor(name) {
      this.name = name
      this._imps = {}
      this._affects = {}
      this._typed = typed.create()
      this._typed.clear()
      this.Types = {any: {}} // dummy entry to track the default 'any' type
      this._doomed = new Set() // for detecting circular reference
      this._config = {predictable: false}
      const self = this
      this.config = new Proxy(this._config, {
         get: (target, property) => target[property],
         set: (target, property, value) => {
            if (value !== target[property]) {
               target[property] = value
               self._invalidateDependents('config')
            }
            return true // successful
         }
      })
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
    *    are type names, and the values are plain objects with the following
    *    properties:
    *
    *    - test: the predicate for the type
    *    - from: a plain object mapping the names of types that can be converted
    *        **to** this type to the corresponding conversion functions
    *    - before: [optional] a list of types this should be added
    *        before, in priority order
    */
   install(ops) {
      for (const [item, spec] of Object.entries(ops)) {
         if (item === 'Types') {
            this._installTypes(spec)
         } else {
            this._installOp(item, spec)
         }
      }
   }

   /**
    * Import (and install) all dependencies of previously installed functions,
    * for the specified types.
    *
    * @param {string[]} types  A list of type names
    */
   async importDependencies(types) {
      const typeSet = new Set(types)
      typeSet.add('generic')
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
            for (const type of typeSet) {
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

   /* Used internally by install, see the documentation there.
    * Note that unlike _installOp below, we can do this immediately
    */
   _installTypes(typeSpecs) {
      for (const [type, spec] of Object.entries(typeSpecs)) {
         if (type in this.Types) {
            if (spec !== this.Types[type]) {
                  throw new SyntaxError(
                     `Conflicting definitions of type ${type}`)
            }
            continue
         }
         let beforeType = 'any'
         for (const other of spec.before || []) {
            if (other in this.Types) {
               beforeType = other
               break
            }
         }
         this._typed.addTypes([{name: type, test: spec.test}], beforeType)
         /* Now add conversions to this type */
         for (const from in (spec.from || {})) {
            if (from in this.Types) {
               this._typed.addConversion(
                  {from, to: type, convert: spec.from[from]})
            }
         }
         /* And add conversions from this type */
         for (const to in this.Types) {
            if (type in (this.Types[to].from || {})) {
               this._typed.addConversion(
                  {from: type, to, convert: this.Types[to].from[type]})
            }
         }
         this.Types[type] = spec
         // rebundle anything that uses the new type:
         this._invalidateDependents(':' + type)
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
         if (signature in opImps) {
            if (does !== opImps[signature].does) {
               throw new SyntaxError(
                  `Conflicting definitions of ${signature} for ${name}`)
            }
         } else {
            const uses = new Set()
            does(dependencyExtractor(uses))
            opImps[signature] = {uses, does}
            for (const dep of uses) {
               const depname = dep.split('(', 1)[0]
               if (depname === 'self') continue
               this._addAffect(depname, name)
            }
            for (const type of typesOfSignature(signature)) {
               this._addAffect(':' + type, name)
            }
         }
      }
   }

   _addAffect(dependency, dependent) {
      if (dependency in this._affects) {
         this._affects[dependency].add(dependent)
      } else {
         this._affects[dependency] = new Set([dependent])
      }
   }

   /**
    * Reset an operation to require creation of typed-function,
    * and if it has no implementations so far, set them up.
    */
   _invalidate(name) {
      if (this._doomed.has(name)) {
         /* In the midst of a circular invalidation, so do nothing */
         return
      }
      if (!(name in this._imps)) {
         this._imps[name] = {}
      }
      this._doomed.add(name)
      this._invalidateDependents(name)
      this._doomed.delete(name)
      const self = this
      Object.defineProperty(this, name, {
         configurable: true,
         get: () => self._bundle(name)
      })
   }

   /**
    * Invalidate all the dependents of a given property of the instance
    */
   _invalidateDependents(name) {
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
      if (!imps) {
         throw new SyntaxError(`No implementations for ${name}`)
      }
      const usableEntries = Object.entries(imps).filter(
         ([signature]) => subsetOfKeys(typesOfSignature(signature), this.Types))
      if (usableEntries.length === 0) {
         throw new SyntaxError(
            `Every implementation for ${name} uses an undefined type;\n`
               + `    signatures: ${Object.keys(imps)}`)
      }
      Object.defineProperty(this, name, {configurable: true, value: 'limbo'})
      const tf_imps = {}
      for (const [signature, {uses, does}] of usableEntries) {
         if (uses.length === 0) {
            tf_imps[signature] = does()
         } else {
            const refs = {}
            let full_self_referential = false
            let part_self_references = []
            for (const dep of uses) {
               const [func, needsig] = dep.split(/[()]/)
               if (func === 'self') {
                  if (needsig) {
                     if (full_self_referential) {
                        throw new SyntaxError(
                           'typed-function does not support mixed full and '
                              + 'partial self-reference')
                     }
                     if (subsetOfKeys(typesOfSignature(needsig), this.Types)) {
                        part_self_references.push(needsig)
                     }
                  } else {
                     if (part_self_references.length) {
                        throw new SyntaxError(
                           'typed-function does not support mixed full and '
                              + 'partial self-reference')
                     }
                     full_self_referential = true
                  }
               } else {
                  if (this[func] === 'limbo') {
                     /* We are in the midst of bundling func, so have to use
                      * an indirect reference to func. And given that, there's
                      * really no helpful way to extract a specific signature
                      */
                     const self = this
                     refs[dep] = function () { // is this the most efficient?
                        return self[func].apply(this, arguments)
                     }
                  } else {
                     // can bundle up func, and grab its signature if need be
                     let destination = this[func]
                     if (needsig) {
                        destination = this._typed.find(destination, needsig)
                     }
                     refs[dep] = destination
                  }
               }
            }
            if (full_self_referential) {
               tf_imps[signature] = this._typed.referToSelf(self => {
                  refs.self = self
                  return does(refs)
               })
            } else if (part_self_references.length) {
               tf_imps[signature] = this._typed.referTo(
                  ...part_self_references, (...impls) => {
                     for (let i = 0; i < part_self_references.length; ++i) {
                        refs[`self(${part_self_references[i]})`] = impls[i]
                     }
                     return does(refs)
                  }
               )
            } else {
               tf_imps[signature] = does(refs)
            }
         }
      }
      const tf = this._typed(name, tf_imps)
      Object.defineProperty(this, name, {configurable: true, value: tf})
      return tf
   }

}

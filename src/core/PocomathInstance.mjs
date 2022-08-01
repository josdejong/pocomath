/* Core of pocomath: create an instance */
import typed from 'typed-function'
import dependencyExtractor from './dependencyExtractor.mjs'
import {subsetOfKeys, typesOfSignature} from './utils.mjs'

const anySpec = {} // fixed dummy specification of 'any' type

const theTemplateParam = 'T' // First pass: only allow this one exact parameter

/* Returns a new signature just like sig but with the parameter replaced by
 * the type
 */
function substituteInSig(sig, parameter, type) {
   const pattern = new RegExp("\\b" + parameter + "\\b", 'g')
   return sig.replaceAll(pattern, type)
}

export default class PocomathInstance {
   /* Disallowed names for ops; beware, this is slightly non-DRY
    * in that if a new top-level PocomathInstance method is added, its name
    * must be added to this list.
    */
   static reserved = new Set([
      'config',
      'importDependencies',
      'install',
      'installType',
      'name',
      'typeOf',
      'Types',
      'undefinedTypes'
   ])

   constructor(name) {
      this.name = name
      this._imps = {}
      this._affects = {}
      this._typed = typed.create()
      this._typed.clear()
      /* List of types installed in the instance. We start with just dummies
       * for the 'any' type and for type parameters:
       */
      this.Types = {any: anySpec}
      this.Types[theTemplateParam] = anySpec
      this._subtypes = {} // For each type, gives all of its (in)direct subtypes
      /* The following gives for each type, a set of all types that could
       * match in typed-function's dispatch algorithm before the given type.
       * This is important because if we instantiate a template, we must
       * instantiate it for all prior types as well, or else the wrong instance
       * might match.
       */
      this._priorTypes = {}
      this._usedTypes = new Set() // all types that have occurred in a signature
      this._doomed = new Set() // for detecting circular reference
      this._config = {predictable: false, epsilon: 1e-12}
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
    * The sole parameter can be another Pocomath instance, in which case all
    * of the types and operations of the other instance are installed in this
    * one, or it can be a plain object as described below.
    *
    * @param {Object<string,
    *                PocomathInstance
    *                | Object<Signature, ({deps})=> implementation>>} ops
    *    The only parameter ops gives the semantics of the operations to install.
    *    The keys are operation names. The value for a key could be
    *    a PocomathInstance, in which case it is simply merged into this
    *    instance.
    *
    *    Otherwise, ops must be an object
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
    *    operation in the body of the implementation.
    *
    *    You can specify template implementations. If any item in the signature
    *    contains the word 'T' (currently the only allowed type parameter) then
    *    the signature/implementation is a template. The T can match any type
    *    of argument, and it may appear in the dependencies, where it is
    *    replaced by the matching type. A bare 'T' in the dependencies will be
    *    supplied with the name of the type as its value. See the implementation
    *    of `subtract` for an example.
    *    Usually templates are instantiated as needed, but for some heavily
    *    used functions, or functions with non-template signatures that refer
    *    to signatures generated from a template, it makes more sense to just
    *    instantiate the template immediately for all known types. This eager
    *    instantiation can be accomplished by prefixin the signature with an
    *    exclamation point.
    */
   install(ops) {
      if (ops instanceof PocomathInstance) {
         return _installInstance(ops)
      }
      /* Standardize the format of all implementations, weeding out
       * any other instances as we go
       */
      const stdFunctions = {}
      for (const [item, spec] of Object.entries(ops)) {
         if (spec instanceof PocomathInstance) {
            this._installInstance(spec)
         } else {
            if (item.charAt(0) === '_') {
               throw new SyntaxError(
                  `Pocomath: Cannot install ${item}, `
                     + 'initial _ reserved for internal use.')
            }
            if (PocomathInstance.reserved.has(item)) {
               throw new SyntaxError(
                  `Pocomath: reserved function '${item}' cannot be modified.`)
            }
            const stdimps = {}
            for (const [signature, does] of Object.entries(spec)) {
               const uses = new Set()
               does(dependencyExtractor(uses))
               stdimps[signature] = {uses, does}
            }
            stdFunctions[item] = stdimps
         }
      }
      this._installFunctions(stdFunctions)
   }

   /* Merge any number of PocomathInstances or modules:  */
   static merge(name, ...pieces) {
      const result = new PocomathInstance(name)
      for (const piece of pieces) {
         result.install(piece)
      }
      return result
   }

   _installInstance(other) {
      for (const [type, spec] of Object.entries(other.Types)) {
         if (type === 'any' || this._templateParam(type)) continue
         this.installType(type, spec)
      }
      const migrateImps = {}
      for (const operator in other._imps) {
         if (operator != 'typeOf') { // skip the builtin, we already have it
            migrateImps[operator] = other._imps[operator]
         }
      }
      this._installFunctions(migrateImps)
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
                  if (!(err.message.includes('find'))) {
                     // Not just a error because module doesn't exist
                     // So take it seriously
                     throw err
                  }
                  // We don't care if a module doesn't exist, so merely proceed
               }
            }
            doneSet.add(name)
         }
      }
   }

   /* Used to install a type in a PocomathInstance.
    *
    * @param {string} name  The name of the type
    * @param {{test: any => bool,  // the predicate for the type
    *          from: Record<string, <that type> => <type name>> // conversions
    *          before: string[]  // lower priority types
    *        }} specification
    *
    * The second parameter of this function specifies the structure of the
    * type via a plain
    *    object with the following properties:
    *
    *    - test: the predicate for the type
    *    - from: a plain object mapping the names of types that can be converted
    *        **to** this type to the corresponding conversion functions
    *    - before: [optional] a list of types this should be added
    *        before, in priority order
    *    - refines: [optional] the name of a type that this is a subtype
    *        of. This means the test is the conjunction of the given test and
    *        the supertype test, and that it must come before the supertype.
    */
   /*
    * Implementation note: unlike _installFunctions below, we can make
    * the corresponding changes to the _typed object immediately
    */
   installType(type, spec) {
      if (this._templateParam(type)) {
         throw new SyntaxError(
            `Type name '${type}' reserved for template parameter`)
      }
      if (type in this.Types) {
         if (spec !== this.Types[type]) {
            throw new SyntaxError(`Conflicting definitions of type ${type}`)
         }
         return
      }
      if (spec.refines && !(spec.refines in this.Types)) {
         throw new SyntaxError(
            `Cannot install ${type} before its supertype ${spec.refines}`)
      }
      let beforeType = spec.refines
      if (!beforeType) {
         beforeType = 'any'
         for (const other of spec.before || []) {
            if (other in this.Types) {
               beforeType = other
               break
            }
         }
      }
      let testFn = spec.test
      if (spec.refines) {
         const supertypeTest = this.Types[spec.refines].test
         testFn = entity => supertypeTest(entity) && spec.test(entity)
      }
      this._typed.addTypes([{name: type, test: testFn}], beforeType)
      this.Types[type] = spec
      this._priorTypes[type] = new Set()
      /* Now add conversions to this type */
      for (const from in (spec.from || {})) {
         if (from in this.Types) {
            // add conversions from "from" to this one and all its supertypes:
            let nextSuper = type
            while (nextSuper) {
               this._typed.addConversion(
                  {from, to: nextSuper, convert: spec.from[from]})
               this._invalidateDependents(':' + nextSuper)
               this._priorTypes[nextSuper].add(from)
               nextSuper = this.Types[nextSuper].refines
            }
         }
      }
      /* And add conversions from this type */
      for (const to in this.Types) {
         if (type in (this.Types[to].from || {})) {
            if (spec.refines == to || spec.refines in this._subtypes[to]) {
               throw new SyntaxError(
                  `Conversion of ${type} to its supertype ${to} disallowed.`)
            }
            let nextSuper = to
            while (nextSuper) {
               this._typed.addConversion({
                  from: type,
                  to: nextSuper,
                  convert: this.Types[to].from[type]
               })
               this._invalidateDependents(':' + nextSuper)
               this._priorTypes[nextSuper].add(type)
               nextSuper = this.Types[nextSuper].refines
            }
         }
      }
      // Update all the subtype sets of supertypes up the chain, and
      // while we are at it add trivial conversions from subtypes to supertypes
      // to help typed-function match signatures properly:
      this._subtypes[type] = new Set()
      let nextSuper = spec.refines
      while (nextSuper) {
         this._typed.addConversion(
            {from: type, to: nextSuper, convert: x => x})
         this._invalidateDependents(':' + nextSuper)
         this._priorTypes[nextSuper].add(type)
         this._subtypes[nextSuper].add(type)
         nextSuper = this.Types[nextSuper].refines
      }

      // update the typeOf function
      const imp = {}
      imp[type] = {uses: new Set(), does: () => () => type}
      this._installFunctions({typeOf: imp})
   }

   /* Returns a list of all types that have been mentioned in the
    * signatures of operations, but which have not actually been installed:
    */
   undefinedTypes() {
      return Array.from(this._usedTypes).filter(t => !(t in this.Types))
   }

   /* Used internally by install, see the documentation there */
   _installFunctions(functions) {
      for (const [name, spec] of Object.entries(functions)) {
         // new implementations, so set the op up to lazily recreate itself
         this._invalidate(name)
         const opImps = this._imps[name]
         for (const [signature, behavior] of Object.entries(spec)) {
            if (signature in opImps) {
               if (behavior.does !== opImps[signature].does) {
                  throw new SyntaxError(
                     `Conflicting definitions of ${signature} for ${name}`)
               }
            } else {
               // Must avoid aliasing into another instance:
               opImps[signature] = {uses: behavior.uses, does: behavior.does}
               for (const dep of behavior.uses) {
                  const depname = dep.split('(', 1)[0]
                  if (depname === 'self' || this._templateParam(depname)) {
                     continue
                  }
                  this._addAffect(depname, name)
               }
               for (const type of typesOfSignature(signature)) {
                  if (this._templateParam(type)) continue
                  this._usedTypes.add(type)
                  this._addAffect(':' + type, name)
               }
            }
         }
      }
   }

   /* returns a boolean indicating whether t denotes a template parameter.
    * We will start this out very simply: the special string `T` is always
    * a template parameter, and that's the only one
    */
   _templateParam(t) { return t === theTemplateParam }

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
      for (const [rawSignature, behavior] of usableEntries) {
         /* Check if it's an ordinary non-template signature */
         let explicit = true
         for (const type of typesOfSignature(rawSignature)) {
            if (this._templateParam(type)) { // template types need better check
               explicit = false
               break
            }
         }
         if (explicit) {
            this._addTFimplementation(tf_imps, rawSignature, behavior)
            continue
         }
         /* It's a template, have to instantiate */
         /* First, add the known instantiations, gathering all types needed */
         if (!('instantiations' in behavior)) {
            behavior.instantiations = new Set()
         }
         let instantiationSet = new Set()
         let trimSignature = rawSignature
         if (rawSignature.charAt(0) === '!') {
            trimSignature = trimSignature.slice(1)
            instantiationSet = this._usedTypes
         } else {
            for (const instType of behavior.instantiations) {
               instantiationSet.add(instType)
               for (const other of this._priorTypes[instType]) {
                  instantiationSet.add(other)
               }
            }
         }

         for (const instType of instantiationSet) {
            if (this.Types[instType] === anySpec) continue
            const signature =
                  substituteInSig(trimSignature, theTemplateParam, instType)
            /* Don't override an explicit implementation: */
            if (signature in imps) continue
            const uses = new Set()
            for (const dep of behavior.uses) {
               if (this._templateParam(dep)) continue
               uses.add(substituteInSig(dep, theTemplateParam, instType))
            }
            const patch = (refs) => {
               const innerRefs = {}
               for (const dep of behavior.uses) {
                  if (this._templateParam(dep)) {
                     innerRefs[dep] = instType
                  } else {
                     const outerName = substituteInSig(
                        dep, theTemplateParam, instType)
                     innerRefs[dep] = refs[outerName]
                  }
               }
               const original = behavior.does(innerRefs)
               return behavior.does(innerRefs)
            }
            this._addTFimplementation(tf_imps, signature, {uses, does: patch})
         }
         /* Now add the catchall signature */
         const signature = substituteInSig(
            trimSignature, theTemplateParam, 'any')
         /* The catchall signature has to detect the actual type of the call
          * and add the new instantiations
          */
         const argTypes = trimSignature.split(',')
         let exemplar = -1
         for (let i = 0; i < argTypes.length; ++i) {
            const argType = argTypes[i].trim()
            if (argType === theTemplateParam) {
               exemplar = i
               break
            }
         }
         if (exemplar < 0) {
            throw new SyntaxError(
               `Cannot find template parameter in ${rawSignature}`)
         }
         const self = this
         const patch = (refs) => (...args) => {
            const example = args[exemplar]
            const instantiateFor = self.typeOf(example)
            refs[theTemplateParam] = instantiateFor
            behavior.instantiations.add(instantiateFor)
            self._invalidate(name)
            // And for now, we have to rely on the "any" implementation. Hope
            // it matches the instantiated one!
            return behavior.does(refs)(...args)
         }
         this._addTFimplementation(
            tf_imps, signature, {uses: behavior.uses, does: patch})
      }
      const tf = this._typed(name, tf_imps)
      Object.defineProperty(this, name, {configurable: true, value: tf})
      return tf
   }

   /* Adapts Pocomath-style behavior specification (uses, does) for signature
    * to typed-function implementations and inserts the result into plain object
    * imps
    */
   _addTFimplementation(imps, signature, behavior) {
      const {uses, does} = behavior
      if (uses.length === 0) {
         imps[signature] = does()
         return
      }
      const refs = {}
      let full_self_referential = false
      let part_self_references = []
      for (const dep of uses) {
         let [func, needsig] = dep.split(/[()]/)
         const needTypes = needsig ? typesOfSignature(needsig) : new Set()
         /* For now, punt on template parameters */
         if (needTypes.has(theTemplateParam)) needsig = ''
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
         imps[signature] = this._typed.referToSelf(self => {
            refs.self = self
            return does(refs)
         })
         return
      }
      if (part_self_references.length) {
         imps[signature] = this._typed.referTo(
            ...part_self_references, (...impls) => {
               for (let i = 0; i < part_self_references.length; ++i) {
                  refs[`self(${part_self_references[i]})`] = impls[i]
               }
               return does(refs)
            }
         )
         return
      }
      imps[signature] = does(refs)
   }
}

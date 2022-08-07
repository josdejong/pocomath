/* Core of pocomath: create an instance */
import typed from 'typed-function'
import {dependencyExtractor, generateTypeExtractor} from './extractors.mjs'
import {makeChain} from './Chain.mjs'
import {typeListOfSignature, typesOfSignature, subsetOfKeys} from './utils.mjs'

const anySpec = {} // fixed dummy specification of 'any' type

const theTemplateParam = 'T' // First pass: only allow this one exact parameter
const templateFromParam = 'U' // For defining covariant conversions

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
      'chain',
      'config',
      'importDependencies',
      'install',
      'installType',
      'instantiateTemplate',
      'joinTypes',
      'name',
      'self',
      'Templates',
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
      this._typed.addTypes([{name: 'ground', test: () => true}])
      /* List of types installed in the instance. We start with just dummies
       * for the 'any' type and for type parameters:
       */
      this.Types = {any: anySpec}
      this.Types[theTemplateParam] = anySpec
      this.Types.ground = anySpec
      // All the template types that have been defined
      this.Templates = {}
      // The actual type testing functions
      this._typeTests = {}
      this._subtypes = {} // For each type, gives all of its (in)direct subtypes
      /* The following gives for each type, a set of all types that could
       * match in typed-function's dispatch algorithm before the given type.
       * This is important because if we instantiate a template, we must
       * instantiate it for all prior types as well, or else the wrong instance
       * might match.
       */
      this._priorTypes = {}
      this._seenTypes = new Set() // all types that have occurred in a signature
      this._maxDepthSeen = 1 // deepest template nesting we've actually encountered
      this._invalid = new Set() // methods that are currently invalid
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
      this._plainFunctions = new Set() // the names of the plain functions
      this._chainRepository = {} // place to store chainified functions

      this._installFunctions({
         typeOf: {ground: {uses: new Set(), does: () => () => 'any'}}
      })

      this.joinTypes = this.joinTypes.bind(this)
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
         } else if (typeof spec === 'function') {
            stdFunctions[item] = spec
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

   /* Return a chain object for this instance with a given value: */
   chain(value) {
      return makeChain(value, this, this._chainRepository)
   }

   _installInstance(other) {
      for (const [type, spec] of Object.entries(other.Types)) {
         if (spec === anySpec) continue
         this.installType(type, spec)
      }
      for (const [base, info] of Object.entries(other.Templates)) {
         this._installTemplateType(info.type, info.spec)
      }
      const migrateImps = {}
      for (const operator in other._imps) {
         if (operator != 'typeOf') { // skip the builtin, we already have it
            migrateImps[operator] = other._imps[operator]
         }
      }
      for (const plain of other._plainFunctions) {
         migrateImps[plain] = other[plain]
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
    *          refines: string   // The type this is a subtype of
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
      const parts = type.split(/[<,>]/)
      if (this._templateParam(parts[0])) {
         throw new SyntaxError(
            `Type name '${type}' reserved for template parameter`)
      }
      if (parts.some(this._templateParam.bind(this))) {
         // It's a template, deal with it separately
         return this._installTemplateType(type, spec)
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
         beforeType = 'ground'
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
      this._typeTests[type] = testFn
      this._typed.addTypes([{name: type, test: testFn}], beforeType)
      this.Types[type] = spec
      this._subtypes[type] = new Set()
      this._priorTypes[type] = new Set()
      // Update all the subtype sets of supertypes up the chain
      let nextSuper = spec.refines
      while (nextSuper) {
         this._invalidateDependents(':' + nextSuper)
         this._priorTypes[nextSuper].add(type)
         this._subtypes[nextSuper].add(type)
         nextSuper = this.Types[nextSuper].refines
      }
      /* Now add conversions to this type */
      for (const from in (spec.from || {})) {
         if (from in this.Types) {
            // add conversions from "from" to this one and all its supertypes:
            let nextSuper = type
            while (nextSuper) {
               if (this._priorTypes[nextSuper].has(from)) break
               if (from === nextSuper) break
               this._typed.addConversion(
                  {from, to: nextSuper, convert: spec.from[from]})
               this._invalidateDependents(':' + nextSuper)
               this._priorTypes[nextSuper].add(from)
               /* And all of the subtypes of from are now prior as well: */
               for (const subtype of this._subtypes[from]) {
                  this._priorTypes[nextSuper].add(subtype)
               }
               nextSuper = this.Types[nextSuper].refines
            }
         }
      }
      /* And add conversions from this type */
      for (const to in this.Types) {
         for (const fromtype in this.Types[to].from) {
            if (type == fromtype
                || (fromtype in this._subtypes
                    && this._subtypes[fromtype].has(type))) {
               if (spec.refines == to || spec.refines in this._subtypes[to]) {
                  throw new SyntaxError(
                     `Conversion of ${type} to its supertype ${to} disallowed.`)
               }
               let nextSuper = to
               while (nextSuper) {
                  if (type === nextSuper) break
                  try { // may already be a conversion, and no way to ask
                     this._typed.addConversion({
                        from: type,
                        to: nextSuper,
                        convert: this.Types[to].from[fromtype]
                     })
                     this._invalidateDependents(':' + nextSuper)
                  } catch {
                  }
                  this._priorTypes[nextSuper].add(type)
                  nextSuper = this.Types[nextSuper].refines
               }
            }
         }
      }
      // update the typeOf function
      const imp = {}
      imp[type] = {uses: new Set(), does: () => () => type}
      this._installFunctions({typeOf: imp})
   }

   /* Returns the most refined type of all the types in the array, with
    * '' standing for the empty type for convenience. If the second
    * argument `convert` is true, a convertible type is considered a
    * a subtype (defaults to false).
    */
   joinTypes(types, convert) {
      let join = ''
      for (const type of types) {
         join = this._joinTypes(join, type, convert)
      }
      return join
   }
   /* helper for above */
   _joinTypes(typeA, typeB, convert) {
      if (!typeA) return typeB
      if (!typeB) return typeA
      if (typeA === 'any' || typeB === 'any') return 'any'
      if (typeA === 'ground' || typeB === 'ground') return 'ground'
      if (typeA === typeB) return typeA
      const subber = convert ? this._priorTypes : this._subtypes
      if (subber[typeB].has(typeA)) return typeB
      /* OK, so we need the most refined supertype of A that contains B:
       */
      let nextSuper = typeA
      while (nextSuper) {
         if (subber[nextSuper].has(typeB)) return nextSuper
         nextSuper = this.Types[nextSuper].refines
      }
      /* And if conversions are allowed, we have to search the other way too */
      if (convert) {
         nextSuper = typeB
         while (nextSuper) {
            if (subber[nextSuper].has(typeA)) return nextSuper
            nextSuper = this.Types[nextSuper].refines
         }
      }
      return 'any'
   }

   /* Returns a list of all types that have been mentioned in the
    * signatures of operations, but which have not actually been installed:
    */
   undefinedTypes() {
      return Array.from(this._seenTypes).filter(t => !(t in this.Types))
   }

   /* Used internally to install a template type */
   _installTemplateType(type, spec) {
      const base = type.split('<')[0]
      /* For now, just allow a single template per base type; that
       * might need to change later:
       */
      if (base in this.Templates) {
         if (spec !== this.Templates[base].spec) {
            throw new SyntaxError(
               `Conflicting definitions of template type ${type}`)
         }
         return
      }
      // update the typeOf function
      const imp = {}
      imp[type] = {uses: new Set(['T']), does: ({T}) => () => `${base}<${T}>`}
      this._installFunctions({typeOf: imp})

      // Nothing else actually happens until we match a template parameter
      this.Templates[base] = {type, spec}
   }

   /* Used internally by install, see the documentation there */
   _installFunctions(functions) {
      for (const [name, spec] of Object.entries(functions)) {
         if (typeof spec === 'function') {
            if (name in this) {
               if (spec === this[name]) continue
               throw new SyntaxError(`Attempt to redefine function ${name}`)
            }
            this._plainFunctions.add(name)
            this[name] = spec
            continue
         }
         // new implementations, first check the name isn't taken
         if (this._plainFunctions.has(name)) {
            throw new SyntaxError(
               `Can't add implementations to function ${name}`)
         }
         // All clear, so set the op up to lazily recreate itself
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
                  for (const word of type.split(/[<>]/)) {
                     if (word.length == 0) continue
                     if (this._templateParam(word)) continue
                     this._seenTypes.add(word)
                     this._addAffect(':' + word, name)
                  }
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
      if (this._invalid.has(name)) return
      if (!(name in this._imps)) {
         this._imps[name] = {}
      }
      this._invalid.add(name)
      this._invalidateDependents(name)
      const self = this
      Object.defineProperty(this, name, {
         configurable: true,
         get: () => {
            const result = self._bundle(name)
            self._invalid.delete(name)
            return result
         }
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
      /* Collect the entries we know the types for */
      const usableEntries = []
      for (const entry of Object.entries(imps)) {
         let keep = true
         for (const type of typesOfSignature(entry[0])) {
            if (type in this.Types) continue
            const baseType = type.split('<')[0]
            if (baseType in this.Templates) continue
            keep = false
            break
         }
         if (keep) usableEntries.push(entry)
      }
      if (usableEntries.length === 0) {
         throw new SyntaxError(
            `Every implementation for ${name} uses an undefined type;\n`
               + `    signatures: ${Object.keys(imps)}`)
      }
      /* Initial error checking done; mark this method as being
       * in the midst of being reassembled
       */
      Object.defineProperty(this, name, {configurable: true, value: 'limbo'})
      const tf_imps = {}
      for (const [rawSignature, behavior] of usableEntries) {
         /* Check if it's an ordinary non-template signature */
         let explicit = true
         for (const type of typesOfSignature(rawSignature)) {
            for (const word of type.split(/[<>]/)) {
               if (this._templateParam(word)) {
                  explicit = false
                  break
               }
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
         for (const instType of behavior.instantiations) {
            instantiationSet.add(instType)
            for (const other of this._priorTypes[instType]) {
               instantiationSet.add(other)
            }
         }

         for (const instType of instantiationSet) {
            if (!(instType in this.Types)) continue
            if (this.Types[instType] === anySpec) continue
            const signature =
                  substituteInSig(rawSignature, theTemplateParam, instType)
            /* Don't override an explicit implementation: */
            if (signature in imps) continue
            /* Don't go too deep */
            let maxdepth = 0
            for (const argType in typeListOfSignature(signature)) {
               const depth = argType.split('<').length
               if (depth > maxdepth) maxdepth = depth
            }
            if (maxdepth > this._maxDepthSeen + 1) continue
            /* All right, go ahead and instantiate */
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
               return behavior.does(innerRefs)
            }
            this._addTFimplementation(
               tf_imps, signature, {uses, does: patch})
         }
         /* Now add the catchall signature */
         let templateCall = `<${theTemplateParam}>`
         /* Relying here that the base of 'Foo<T>' is 'Foo': */
         let baseSignature = rawSignature.replaceAll(templateCall, '')
         /* Any remaining template params are top-level */
         const signature = substituteInSig(
            baseSignature, theTemplateParam, 'ground')
         /* The catchall signature has to detect the actual type of the call
          * and add the new instantiations.
          * First, prepare the type inference data:
          */
         const parTypes = rawSignature.split(',')
         const restParam = (parTypes[parTypes.length-1].slice(0,3) === '...')
         const topTyper = entity => this.typeOf(entity)
         const inferences = parTypes.map(
            type => generateTypeExtractor(
               type,
               theTemplateParam,
               topTyper,
               this.joinTypes.bind(this),
               this.Templates))
         if (inferences.every(x => !x)) { // all false
            throw new SyntaxError(
               `Cannot find template parameter in ${rawSignature}`)
         }
         /* And eliminate template parameters from the dependencies */
         const simplifiedUses = {}
         for (const dep of behavior.uses) {
            let [func, needsig] = dep.split(/[()]/)
            if (needsig) {
               const subsig = substituteInSig(needsig, theTemplateParam, '')
               if (subsig === needsig) {
                  simplifiedUses[dep] = dep
               } else {
                  simplifiedUses[dep] = func
               }
            } else {
               simplifiedUses[dep] = dep
            }
         }
         /* Now build the catchall implementation */
         const self = this
         const patch = (refs) => (...args) => {
            /* We unbundle the rest arg if there is one */
            const regLength = args.length - 1
            if (restParam) {
               const restArgs = args.pop()
               args = args.concat(restArgs)
            }
            /* Now infer the type we actually should have been called for */
            let i = -1
            let j = -1
            /* collect the arg types */
            const argTypes = []
            for (const arg of args) {
               ++j
               // in case of rest parameter, reuse last parameter type:
               if (i < inferences.length - 1) ++i
               if (inferences[i]) {
                  const argType = inferences[i](arg)
                  if (!argType) {
                     throw TypeError(
                        `Type inference failed for argument ${j} of ${name}`)
                  }
                  if (argType === 'any') {
                     throw TypeError(
                        `In call to ${name}, incompatible template arguments: `
                        // + args.map(a => JSON.stringify(a)).join(', ')
                        // unfortunately barfs on bigints. Need a better formatter
                        // wish we could just use the one that console.log uses;
                        // is that accessible somehow?
                           + args.map(a => a.toString()).join(', ')
                           + ' of types ' + argTypes.join(', ') + argType)
                  }
                  argTypes.push(argType)
               }
            }
            if (argTypes.length === 0) {
               throw TypeError('Type inference failed for' + name)
            }
            let usedConversions = false
            let instantiateFor = self.joinTypes(argTypes)
            if (instantiateFor === 'any') {
               usedConversions = true
               instantiateFor = self.joinTypes(argTypes, usedConversions)
               if (instantiateFor === 'any') {
                  throw TypeError(
                     `In call to ${name}, no type unifies arguments `
                        + args.toString() + '; of types ' + argTypes.toString()
                        + '; note each consecutive pair must unify to a '
                        + 'supertype of at least one of them')
               }
            }
            const depth = instantiateFor.split('<').length
            if (depth > self._maxDepthSeen) {
               self._maxDepthSeen = depth
            }
            /* Generate the list of actual wanted types */
            const wantTypes = parTypes.map(type => substituteInSig(
               type, theTemplateParam, instantiateFor))
            /* Now we have to add any actual types that are relevant
             * to this invocation. Namely, that would be every formal parameter
             * type in the invocation, with the parameter template instantiated
             * by instantiateFor, and for all of instantiateFor's "prior types"
             */
            for (j = 0; j < parTypes.length; ++j) {
               if (wantTypes[j] !== parTypes[j] && parTypes[j].includes('<')) {
                  // actually used the param and is a template
                  self._ensureTemplateTypes(parTypes[j], instantiateFor)
               }
            }
            /* Transform the arguments if we used any conversions: */
            if (usedConversions) {
               i = - 1
               for (j = 0; j < args.length; ++j) {
                  if (i < parTypes.length - 1) ++i
                  let wantType = parTypes[i]
                  if (wantType.slice(0,3) === '...') {
                     wantType = wantType.slice(3)
                  }
                  wantType = substituteInSig(
                     wantType, theTemplateParam, instantiateFor)
                  if (wantType !== parTypes[i]) {
                     args[j] = self._typed.convert(args[j], wantType)
                  }
               }
            }
            /* Finally reassemble the rest args if there were any */
            if (restParam) {
               const restArgs = args.slice(regLength)
               args = args.slice(0,regLength)
               args.push(restArgs)
            }
            /* Arrange that the desired instantiation will be there next
             * time so we don't have to go through that again for this type
             */
            refs[theTemplateParam] = instantiateFor
            behavior.instantiations.add(instantiateFor)
            self._invalidate(name)
            // And update refs because we now know the type we're instantiating
            // for:
            const innerRefs = {}
            for (const dep in simplifiedUses) {
               const simplifiedDep = simplifiedUses[dep]
               if (dep === simplifiedDep) {
                  innerRefs[dep] = refs[dep]
               } else {
                  let [func, needsig] = dep.split(/[()]/)
                  if (self._typed.isTypedFunction(refs[simplifiedDep])) {
                     const subsig = substituteInSig(
                        needsig, theTemplateParam, instantiateFor)
                     let resname = simplifiedDep
                     if (resname == 'self') resname = name
                     innerRefs[dep] = self._pocoresolve(
                        resname, subsig, refs[simplifiedDep])
                  } else {
                     innerRefs[dep] = refs[simplifiedDep]
                  }
               }
            }
            // Finally ready to make the call.
            return behavior.does(innerRefs)(...args)
         }
         // The actual uses value needs to be a set:
         const outerUses = new Set(Object.values(simplifiedUses))
         this._addTFimplementation(
            tf_imps, signature, {uses: outerUses, does: patch})
      }
      this._correctPartialSelfRefs(name, tf_imps)
      // Make sure we have all of the needed (template) types; and if they
      // can't be added (because they have been instantiated too deep),
      // ditch the signature:
      const badSigs = new Set()
      for (const sig in tf_imps) {
         for (const type of typeListOfSignature(sig)) {
            if (type.includes('<')) {
               // it's a template type, turn it into a template and an arg
               let base = type.split('<',1)[0]
               const arg = type.slice(base.length+1, -1)
               if (base.slice(0,3) === '...') {
                  base = base.slice(3)
               }
               if (this.instantiateTemplate(base, arg) === undefined) {
                  badSigs.add(sig)
               }
            }
         }
      }
      for (const badSig of badSigs) {
         delete tf_imps[badSig]
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
         /* Safety check that can perhaps be removed:
          * Verify that the desired signature has been fully grounded:
          */
         if (needsig) {
            const trysig = substituteInSig(needsig, theTemplateParam, '')
            if (trysig !== needsig) {
               throw new Error(
                  'Attempt to add a template implementation: ' +
                     `${signature} with dependency ${dep}`)
            }
         }
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
               if (destination &&needsig) {
                  destination = this._pocoresolve(func, needsig)
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
         /* There is an obstruction here. The list part_self_references
          * might contain a signature that requires conversion for self to
          * handle. But I advocated this not be allowed in typed.referTo, which
          * made sense for human-written functions, but is unfortunate now.
          * So we have to defer creating these and correct them later, at
          * least until we can add an option to typed-function.
          */
         imps[signature] = {
            deferred: true,
            builtRefs: refs,
            sigDoes: does,
            psr: part_self_references
         }
         return
      }
      imps[signature] = does(refs)
   }

   _correctPartialSelfRefs(name, imps) {
      for (const aSignature in imps) {
         if (!(imps[aSignature].deferred)) continue
         const part_self_references = imps[aSignature].psr
         const corrected_self_references = []
         for (const neededSig of part_self_references) {
            // Have to find a match for neededSig among the other signatures
            // of this function. That's a job for typed-function, but we will
            // try here:
            if (neededSig in imps) { // the easy case
               corrected_self_references.push(neededSig)
               continue
            }
            // No exact match, try to get one that matches with
            // subtypes since the whole conversion thing in typed-function
            // is too complicated to reproduce
            const foundSig = this._findSubtypeImpl(name, imps, neededSig)
            if (foundSig) {
               corrected_self_references.push(foundSig)
            } else {
               throw new Error(
                  'Implement inexact self-reference in typed-function for '
                     + `${name}(${neededSig})`)
            }
         }
         const refs = imps[aSignature].builtRefs
         const does = imps[aSignature].sigDoes
         imps[aSignature] = this._typed.referTo(
            ...corrected_self_references, (...impls) => {
               for (let i = 0; i < part_self_references.length; ++i) {
                  refs[`self(${part_self_references[i]})`] = impls[i]
               }
               return does(refs)
            }
         )
      }
   }

   /* This function analyzes the template and makes sure the
    * instantiations of it for type and all prior types of type are present
    * in the instance.
    */
   _ensureTemplateTypes(template, type) {
      const base = template.split('<', 1)[0]
      const arg = template.slice(base.length + 1, -1)
      if (!arg) {
         throw new Error(
            'Implementation error in _ensureTemplateTypes', template, type)
      }
      let instantiations
      if (this._templateParam(arg)) { // 1st-level template
         instantiations = new Set(this._priorTypes[type])
         instantiations.add(type)
      } else { // nested template
         instantiations = this._ensureTemplateTypes(arg, type)
      }
      const resultingTypes = new Set()
      for (const iType of instantiations) {
         const resultType = this.instantiateTemplate(base, iType)
         if (resultType) resultingTypes.add(resultType)
      }
      return resultingTypes
   }

   /* Maybe add the instantiation of template type base with argument tyoe
    * instantiator to the Types of this instance, if it hasn't happened already.
    * Returns the name of the type if added, false if it was already there,
    * and undefined if the type is declined (because of being nested too deep).
    */
   instantiateTemplate(base, instantiator) {
      const depth = instantiator.split('<').length
      if (depth > this._maxDepthSeen ) {
         // don't bother with types much deeper thant we have seen
         return undefined
      }
      const wantsType = `${base}<${instantiator}>`
      if (wantsType in this.Types) return false
      // OK, need to generate the type from the template
      // Set up refines, before, test, and from
      const newTypeSpec = {refines: base}
      const maybeFrom = {}
      const template = this.Templates[base].spec
      if (!template) {
         throw new Error(
            `Implementor error in instantiateTemplate(${base}, ${instantiator})`)
      }
      const instantiatorSpec = this.Types[instantiator]
      let beforeTypes = []
      if (instantiatorSpec.before) {
         beforeTypes = instantiatorSpec.before.map(type => `${base}<${type}>`)
      }
      if (template.before) {
         for (const beforeTmpl of template.before) {
            beforeTypes.push(
               substituteInSig(beforeTmpl, theTemplateParam, instantiator))
         }
      }
      if (beforeTypes.length > 0) {
         newTypeSpec.before = beforeTypes
      }
      newTypeSpec.test = template.test(this._typeTests[instantiator])
      if (template.from) {
         for (let source in template.from) {
            const instSource = substituteInSig(
               source, theTemplateParam, instantiator)
            let usesFromParam = false
            for (const word of instSource.split(/[<>]/)) {
               if (word === templateFromParam) {
                  usesFromParam = true
                  break
               }
            }
            if (usesFromParam) {
               for (const iFrom in instantiatorSpec.from) {
                  const finalSource = substituteInSig(
                     instSource, templateFromParam, iFrom)
                  maybeFrom[finalSource] = template.from[source](
                     instantiatorSpec.from[iFrom])
               }
               // Assuming all templates are covariant here, I guess...
               for (const subType of this._subtypes[instantiator]) {
                  const finalSource = substituteInSig(
                     instSource, templateFromParam, subType)
                  maybeFrom[finalSource] = template.from[source](x => x)
               }
            } else {
               maybeFrom[instSource] = template.from[source]
            }
         }
      }

      if (Object.keys(maybeFrom).length > 0) {
         newTypeSpec.from = maybeFrom
      }
      this.installType(wantsType, newTypeSpec)
      return wantsType
   }

   _findSubtypeImpl(name, imps, neededSig) {
      if (neededSig in imps) return neededSig
      let foundSig = false
      const typeList = typeListOfSignature(neededSig)
      for (const otherSig in imps) {
         const otherTypeList = typeListOfSignature(otherSig)
         if (typeList.length !== otherTypeList.length) continue
         let allMatch = true
         for (let k = 0; k < typeList.length; ++k) {
            let myType = typeList[k]
            let otherType = otherTypeList[k]
            if (otherType === theTemplateParam) {
               otherTypeList[k] = 'ground'
               otherType = 'ground'
            }
            if (otherType === '...T') {
               otherTypeList[k] = '...ground'
               otherType = 'ground'
            }
            const adjustedOtherType = otherType.replaceAll(
               `<${theTemplateParam}>`, '')
            if (adjustedOtherType !== otherType) {
               otherTypeList[k] = adjustedOtherType
               otherType = adjustedOtherType
            }
            if (myType.slice(0,3) === '...') myType = myType.slice(3)
            if (otherType.slice(0,3) === '...') otherType = otherType.slice(3)
            if (otherType === 'any') continue
            if (otherType === 'ground') continue
            if (!(otherType in this.Types)) {
               allMatch = false
               break
            }
            if (myType === otherType
                || this._subtypes[otherType].has(myType)) {
               continue
            }
            if (otherType in this.Templates) {
               if (this.instantiateTemplate(otherType, myType)) {
                  let dummy
                  dummy = this[name] // for side effects
                  return this._findSubtypeImpl(name, this._imps[name], neededSig)
               }
            }
            allMatch = false
            break
         }
         if (allMatch) {
            foundSig = otherTypeList.join(',')
            break
         }
      }
      return foundSig
   }

   _pocoresolve(name, sig, typedFunction) {
      if (!this._typed.isTypedFunction(typedFunction)) {
         typedFunction = this[name]
      }
      let result = undefined
      try {
         result = this._typed.find(typedFunction, sig, {exact: true})
      } catch {
      }
      if (result) return result
      const foundsig = this._findSubtypeImpl(name, this._imps[name], sig)
      if (foundsig) return this._typed.find(typedFunction, foundsig)
      // Make sure bundle is up-to-date:
      typedFunction = this[name]
      try {
         result = this._typed.find(typedFunction, sig)
      } catch {
      }
      if (result) return result
      // total punt, revert to typed-function resolution on every call;
      // hopefully this happens rarely:
      return typedFunction
   }

}

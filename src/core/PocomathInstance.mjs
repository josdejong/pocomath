/* Core of pocomath: create an instance */
import typed from 'typed-function'
import {makeChain} from './Chain.mjs'
import {dependencyExtractor, generateTypeExtractor} from './extractors.mjs'
import {Returns, returnTypeOf} from './Returns.mjs'
import {typeListOfSignature, typesOfSignature, subsetOfKeys} from './utils.mjs'

const anySpec = {} // fixed dummy specification of 'any' type

/* Template/signature parsing stuff; should probably be moved to a
 * separate file, but it's a bit interleaved at the moment
 */

const theTemplateParam = 'T' // First pass: only allow this one exact parameter
const restTemplateParam = `...${theTemplateParam}`
const templateCall = `<${theTemplateParam}>`
const templateFromParam = 'U' // For defining covariant conversions

/* returns the pair [base, instance] for a template type. If the type
 * is not a template, instance is undefined
 */
const templatePattern = /^\s*([^<\s]*)\s*<\s*(\S*)\s*>\s*$/
function splitTemplate(type) {
   if (!(type.includes('<'))) return [type, undefined]
   const results = templatePattern.exec(type)
   return [results[1], results[2]]
}
/* Returns the instance such that type is template instantiated for that
 * instance.
 */
function whichInstance(type, template) {
   if (template === theTemplateParam) return type
   if (type === template) return ''
   if (!(template.includes(templateCall))) {
      throw new TypeError(
         `Type ${template} is not a template, so can't produce ${type}`)
   }
   const [typeBase, typeInstance] = splitTemplate(type)
   if (!typeInstance) {
      throw new TypeError(
         `Type ${type} not from a template, so isn't instance of ${template}`)
   }
   const [tempBase, tempInstance] = splitTemplate(template)
   if (typeBase !== tempBase) {
      throw new TypeError(
         `Type ${type} has wrong top-level base to be instance of ${template}`)
   }
   return whichInstance(typeInstance, tempInstance)
}
/* Same as above, but for signatures */
function whichSigInstance(sig, tempsig) {
   const sigTypes = typeListOfSignature(sig)
   const tempTypes = typeListOfSignature(tempsig)
   const sigLength = sigTypes.length
   if (sigLength === 0) {
      throw new TypeError("No types in signature, so can't determine instance")
   }
   if (sigLength !== tempTypes.length) {
      throw new TypeError(`Signatures ${sig} and ${tempsig} differ in length`)
   }
   let maybeInstance = whichInstance(sigTypes[0], tempTypes[0])
   for (let i = 1; i < sigLength; ++i) {
      const currInstance = whichInstance(sigTypes[i], tempTypes[i])
      if (maybeInstance) {
         if (currInstance && currInstance !== maybeInstance) {
            throw new TypeError(
               `Inconsistent instantiation of ${sig} from ${tempsig}`)
         }
      } else {
         maybeInstance = currInstance
      }
   }
   if (!maybeInstance) {
      throw new TypeError(
         `Signature ${sig} identical to ${tempsig}, not an instance`)
   }
   return maybeInstance
}

/* Returns a new signature just like sig but with the parameter replaced by
 * the type
 */
const upperBounds = /\s*(\S*)\s*:\s*(\w*)\s*/g
function substituteInSignature(signature, parameter, type) {
   const sig = signature.replaceAll(upperBounds, '$1')
   const pattern = new RegExp("\\b" + parameter + "\\b", 'g')
   return sig.replaceAll(pattern, type)
}

let lastWhatToDo = null // used in an infinite descent check

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
      'isPriorTo',
      'isSubtypeOf',
      'joinTypes',
      'name',
      'returnTypeOf',
      'resolve',
      'self',
      'subtypesOf',
      'supertypesOf',
      'Templates',
      'typeOf',
      'Types',
      'undefinedTypes'
   ])

   constructor(name) {
      this.name = name
      this._imps = {} // Pocomath implementations, with dependencies
      this._TFimps = {} // typed-function implementations, dependencies resolved
      this._affects = {}
      this._typed = typed.create()
      this._typed.clear()
      // The following is an additional typed-function universe for resolving
      // uninstantiated template instances. It is linked to the main one in
      // its onMismatch function, below:
      this._metaTyped = typed.create()
      this._metaTyped.clear()
      // And these are the meta bindings: (I think we don't need separate
      // invalidation for them as they are only accessed through a main call.)
      this._meta = {} // The resulting typed-functions
      this._metaTFimps = {} // and their implementations
      const me = this
      const myTyped = this._typed
      this._typed.onMismatch = (name, args, sigs) => {
         if (me._invalid.has(name)) {
            // rebuild implementation and try again
            return me[name](...args)
         }
         const metaversion = me._meta[name]
         if (metaversion) {
            return me._meta[name](...args)
         }
         me._typed.throwMismatchError(name, args, sigs)
      }
      // List of types installed in the instance: (We start with just dummies
      // for the 'any' type and for type parameters.)
      this.Types = {any: anySpec}
      this.Types[theTemplateParam] = anySpec
      // Types that have been moved into the metaverse:
      this._metafiedTypes = new Set()
      // All the template types that have been defined:
      this.Templates = {}
      // And their instantiations:
      this._instantiationsOf = {}
      // The actual type testing functions:
      this._typeTests = {}
      // For each type, gives all of its (in)direct subtypes in topo order:
      this._subtypes = {}
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
      this.config = new Proxy(this._config, {
         get: (target, property) => target[property],
         set: (target, property, value) => {
            if (value !== target[property]) {
               target[property] = value
               me._invalidateDependents('config')
            }
            return true // successful
         }
      })
      this._plainFunctions = new Set() // the names of the plain functions
      this._chainRepository = {} // place to store chainified functions
      this.joinTypes = this.joinTypes.bind(me)
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
   install = Returns('void', function(ops) {
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
               try {
                  does(dependencyExtractor(uses))
               } catch {
               }
               stdimps[signature] = {uses, does}
            }
            stdFunctions[item] = stdimps
         }
      }
      this._installFunctions(stdFunctions)
   })

   /* Merge any number of PocomathInstances or modules:  */
   static merge(name, ...pieces) {
      const result = new PocomathInstance(name)
      for (const piece of pieces) {
         result.install(piece)
      }
      return result
   }

   /* Determine the return type of an operation given an input signature */
   returnTypeOf = Returns('string', function(operation, signature) {
      for (const type of typeListOfSignature(signature)) {
         this._maybeInstantiate(type)
      }
      if (typeof operation !== 'string') {
         operation = operation.name
      }
      const details = this._pocoFindSignature(operation, signature)
      if (details) {
         return returnTypeOf(details.fn, signature, this)
      }
      return returnTypeOf(this[operation], signature, this)
   })

   /* Return a chain object for this instance with a given value: */
   chain = Returns(
      sig => `Chain<${sig}>`,
      function(value) {
         return makeChain(value, this, this._chainRepository)
      }
   )

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
                  const moduleName = `../${type}/${name}.mjs`
                  const module = await import(moduleName)
                  this.install(module)
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
   installType = Returns('void', function(type, spec) {
      const parts = type.split(/[<,>]/).map(s => s.trim())
      if (this._templateParam(parts[0])) {
         throw new SyntaxError(
            `Type name '${type}' reserved for template parameter`)
      }
      if (parts.some(this._templateParam.bind(this))) {
         // It's an uninstantiated template, deal with it separately
         return this._installTemplateType(type, spec)
      }
      const base = parts[0]
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
      this._typeTests[type] = testFn
      this._typed.addTypes([{name: type, test: testFn}], beforeType)
      this.Types[type] = spec
      this._subtypes[type] = []
      this._priorTypes[type] = new Set()
      // Update all the subtype sets of supertypes up the chain
      let nextSuper = spec.refines
      while (nextSuper) {
         this._invalidateDependents(':' + nextSuper)
         this._priorTypes[nextSuper].add(type)
         this._addSubtypeTo(nextSuper, type)
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

               /* Add the conversion in the metaverse if need be: */
               const [toBase, toInstance] = splitTemplate(nextSuper)
               if (toInstance) {
                  const [fromBase, fromInstance] = splitTemplate(from)
                  if (!fromBase || fromBase !== toBase) {
                     this._metafy(from)
                     try {
                        this._metaTyped.addConversion(
                           {from, to: toBase, convert: spec.from[from]})
                     } catch {
                     }
                  }
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
                    && this.isSubtypeOf(type, fromtype))) {
               if (spec.refines == to || this.isSubtypeOf(spec.refines,to)) {
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
                     /* Add the conversion in the metaverse if need be: */
                     const [toBase, toInstance] = splitTemplate(nextSuper)
                     if (toInstance && base !== toBase) {
                        this._metafy(type)
                        this._metaTyped.addConversion({
                           from: type,
                           to: toBase,
                           convert: this.Types[to].from[fromtype]
                        })
                     }
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
      imp[type] = {uses: new Set(), does: () => Returns('string', () => type)}
      this._installFunctions({typeOf: imp})
   })

   _metafy(type) {
      if (this._metafiedTypes.has(type)) return
      this._metaTyped.addTypes([{name: type, test: this._typeTests[type]}])
      this._metafiedTypes.add(type)
   }

   _addSubtypeTo(sup, sub) {
      if (this.isSubtypeOf(sub, sup)) return
      const supSubs = this._subtypes[sup]
      let i
      for (i = 0; i < supSubs.length; ++i) {
         if (this.isSubtypeOf(sub, supSubs[i])) break
      }
      supSubs.splice(i, 0, sub)
   }

   /* Returns true if typeA is a strict subtype of type B */
   isSubtypeOf = Returns('boolean', function(typeA, typeB) {
      // Currently not considering types to be a subtype of 'any'
      if (typeB === 'any' || typeA === 'any') return false
      return this._subtypes[typeB].includes(typeA)
   })

   /* Returns true if typeA is a subtype of or converts to type B */
   isPriorTo = Returns('boolean', function(typeA, typeB) {
      if (!(typeB in this._priorTypes)) return false
      return this._priorTypes[typeB].has(typeA)
   })

   /* Returns a list of the strict ubtypes of a given type, in topological
    * sorted order (i.e, no type on the list contains one that comes after it).
    */
   subtypesOf = Returns('Array<string>', function(type) {
      return this._subtypes[type] // should we clone?
   })

   /* Returns a list of the supertypes of a given type, starting with itself,
    * in topological order
    */
   supertypesOf = Returns('Array<string>', function(type) {
      const supList = []
      while (type) {
         supList.push(type)
         type = this.Types[type].refines
      }
      return supList
   })

   /* Returns the most refined type containing all the types in the array,
    * with '' standing for the empty type for convenience. If the second
    * argument `convert` is true, a convertible type is considered a
    * a subtype (defaults to false).
    */
   joinTypes = Returns('string', function(types, convert) {
      let join = ''
      for (const type of types) {
         join = this._joinTypes(join, type, convert)
      }
      return join
   })

   /* helper for above */
   _joinTypes(typeA, typeB, convert) {
      if (!typeA) return typeB
      if (!typeB) return typeA
      if (typeA === 'any' || typeB === 'any') return 'any'
      if (typeA === typeB) return typeA
      const subber = convert ? this._priorTypes : this._subtypes
      const pick = convert ? 'has' : 'includes'
      if (subber[typeB][pick](typeA)) return typeB
      /* OK, so we need the most refined supertype of A that contains B:
       */
      let nextSuper = typeA
      while (nextSuper) {
         if (subber[nextSuper][pick](typeB)) return nextSuper
         nextSuper = this.Types[nextSuper].refines
      }
      /* And if conversions are allowed, we have to search the other way too */
      if (convert) {
         nextSuper = typeB
         while (nextSuper) {
            if (subber[nextSuper][pick](typeA)) return nextSuper
            nextSuper = this.Types[nextSuper].refines
         }
      }
      return 'any'
   }

   /* Returns a list of all types that have been mentioned in the
    * signatures of operations, but which have not actually been installed:
    */
   undefinedTypes = Returns('Array<string>', function() {
      return Array.from(this._seenTypes).filter(
         t => !(t in this.Types || t in this.Templates))
   })

   /* Used internally to install a template type */
   _installTemplateType(type, spec) {
      const [base] = splitTemplate(type)
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

      // install the "base type" in the meta universe:
      let beforeType = 'any'
      for (const other of spec.before || []) {
         if (other in this.templates) {
            beforeType = other
            break
         }
      }
      this._metaTyped.addTypes([{name: base, test: spec.base}], beforeType)
      this._instantiationsOf[base] = new Set()

      // update the typeOf function
      const imp = {}
      imp[type] = {
         uses: new Set(['T']),
         does: ({T}) => Returns('string', () => `${base}<${T}>`)
      }
      this._installFunctions({typeOf: imp})

      // Invalidate any functions that reference this template type:
      this._invalidateDependents(':' + base)

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
               /* Check if it's an ordinary non-template signature */
               let explicit = true
               for (const type of typesOfSignature(signature)) {
                  for (const word of type.split(/[<>:\s]/)) {
                     if (this._templateParam(word)) {
                        explicit = false
                        break
                     }
                  }
                  if (!explicit) break
               }
               opImps[signature] = {
                  explicit,
                  resolved: false,
                  uses: behavior.uses,
                  does: behavior.does
               }
               if (!explicit) {
                  opImps[signature].hasInstantiations = {}
                  opImps[signature].needsInstantiations = new Set()
               }
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
   _invalidate(name, reason) {
      if (!(name in this._imps)) {
         this._imps[name] = {}
         this._TFimps[name] = {}
         this._metaTFimps[name] = {}
      }
      if (reason) {
         // Make sure no TF imps that depend on reason remain:
         for (const [signature, behavior] of Object.entries(this._imps[name])) {
            let invalidated = false
            if (reason.charAt(0) === ':') {
               const badType = reason.slice(1)
               if (signature.includes(badType)) invalidated = true
            } else {
               for (const dep of behavior.uses) {
                  if (dep.includes(reason)) {
                     invalidated = true
                     break
                  }
               }
            }
            if (invalidated) {
               if (behavior.explicit) {
                  if (behavior.resolved) delete this._TFimps[signature]
                  behavior.resolved = false
               } else {
                  for (const fullSig
                       of Object.values(behavior.hasInstantiations)) {
                     delete this._TFimps[fullSig]
                  }
                  behavior.hasInstantiations = {}
               }
            }
         }
      }
      if (this._invalid.has(name)) return
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
            this._invalidate(ancestor, name)
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
      const tf_imps = this._TFimps[name]
      const meta_imps = this._metaTFimps[name]
      /* Collect the entries we know the types for */
      const usableEntries = []
      for (const entry of Object.entries(imps)) {
         let keep = true
         for (const type of typesOfSignature(entry[0])) {
            if (type in this.Types) continue
            const [baseType] = splitTemplate(type)
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
      for (const [rawSignature, behavior] of usableEntries) {
         if (behavior.explicit) {
            if (!(behavior.resolved)) {
               this._addTFimplementation(tf_imps, rawSignature, behavior)
               tf_imps[rawSignature]._pocoSignature = rawSignature
               behavior.resolved = true
            }
            continue
         }
         /* It's a template, have to instantiate */
         /* First, find any upper bounds on the instantation */
         /* TODO: handle multiple upper bounds */
         upperBounds.lastIndex = 0
         let ubType = upperBounds.exec(rawSignature)
         if (ubType) {
            ubType = ubType[2]
            if (!ubType in this.Types) {
               throw new TypeError(
                  `Unknown type upper bound '${ubType}' in '${rawSignature}'`)
            }
         }
         /* First, add the known instantiations, gathering all types needed */
         if (ubType) behavior.needsInstantiations.add(ubType)
         let instantiationSet = new Set()
         const ubTypes = new Set()
         if (!ubType) {
            // Collect all upper-bound types for this signature
            for (const othersig in imps) {
               const thisUB = upperBounds.exec(othersig)
               if (thisUB) ubTypes.add(thisUB[2])
               let basesig = othersig.replaceAll(templateCall, '')
               if (basesig !== othersig) {
                  // A template
                  const testsig = substituteInSignature(
                     basesig, theTemplateParam, '')
                  if (testsig === basesig) {
                     // that is not also top-level
                     for (const templateType of typeListOfSignature(basesig)) {
                        if (templateType.slice(0,3) === '...') {
                           templateType = templateType.slice(3)
                        }
                        ubTypes.add(templateType)
                     }
                  }
               }
            }
         }
         for (const instType of behavior.needsInstantiations) {
            instantiationSet.add(instType)
            const otherTypes =
                  ubType ? this.subtypesOf(instType) : this._priorTypes[instType]
            for (const other of otherTypes) {
               if (!(this._atOrBelowSomeType(other, ubTypes))) {
                  instantiationSet.add(other)
               }
            }
         }

         /* Prevent other existing signatures from blocking use of top-level
          * templates via conversions:
          */
         let baseSignature = rawSignature.replaceAll(templateCall, '')
         /* Any remaining template params are top-level */
         const signature = substituteInSignature(
            baseSignature, theTemplateParam, 'any')
         const hasTopLevel = (signature !== baseSignature)
         if (!ubType && hasTopLevel) {
            for (const othersig in imps) {
               let basesig = othersig.replaceAll(templateCall, '')
               const testsig = substituteInSignature(
                  basesig, theTemplateParam, '')
               if (testsig !== basesig) continue // a top-level template
               for (let othertype of typeListOfSignature(othersig)) {
                  if (othertype.slice(0,3) === '...') {
                     othertype = othertype.slice(3)
                  }
                  if (this.Types[othertype] === anySpec) continue
                  const testType = substituteInSignature(
                     othertype, theTemplateParam, '')
                  let otherTypeCollection = [othertype]
                  if (testType !== othertype) {
                     const [base] = splitTemplate(othertype)
                     otherTypeCollection = this._instantiationsOf[base]
                  }
                  for (const possibility of otherTypeCollection) {
                     for (const convtype of this._priorTypes[possibility]) {
                        if (this.isSubtypeOf(convtype, possibility)) continue
                        if (!(this._atOrBelowSomeType(convtype, ubTypes))) {
                           instantiationSet.add(convtype)
                        }
                     }
                  }
               }
            }
         }

         for (const instType of instantiationSet) {
            this._instantiateTemplateImplementation(name, rawSignature, instType)
         }
         /* Now add the catchall signature */
         /* (Not needed if if it's a bounded template) */
         if (ubType) continue
         if (behavior.resolved) continue
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

         /* Now build the catchall implementation */
         const self = this
         /* For return type annotation, we may have to fix this to
            propagate the return type. At the moment we are just bagging
         */
         const patch = () => {
            const patchFunc = (...tfBundledArgs) => {
               /* We unbundle the rest arg if there is one */
               let args = Array.from(tfBundledArgs)
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
                           `In call to ${name}, `
                              + 'incompatible template arguments:'
                           // + args.map(a => JSON.stringify(a)).join(', ')
                           // unfortunately barfs on bigints. Need a better
                           // formatter. I wish we could just use the one that
                           // console.log uses; is that accessible somehow?
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
               const wantTypes = parTypes.map(type => substituteInSignature(
                  type, theTemplateParam, instantiateFor))
               const wantSig = wantTypes.join(',')
               /* Now we have to add any actual types that are relevant
                * to this invocation. Namely, that would be every formal
                * parameter type in the invocation, with the parameter
                * template instantiated by instantiateFor, and for all of
                * instantiateFor's "prior types"
                */
               for (j = 0; j < parTypes.length; ++j) {
                  if (wantTypes[j] !== parTypes[j] && parTypes[j].includes('<')) {
                     // actually used the param and is a template
                     self._ensureTemplateTypes(parTypes[j], instantiateFor)
                  }
               }

               /* Request the desired instantiation: */
               // But possibly since this resolution was grabbed, the proper
               // instantiation has been added (like if there are multiple
               // uses in the implementation of another method.
               if (!(behavior.needsInstantiations.has(instantiateFor))) {
                  behavior.needsInstantiations.add(instantiateFor)
                  self._invalidate(name)
               }
               const brandNewMe = self[name]
               const whatToDo = self._typed.resolve(brandNewMe, args)
               // We can access return type information here
               // And in particular, if it might be a template, we should try to
               // instantiate it:
               const returnType = returnTypeOf(whatToDo.fn, wantSig, self)
               for (const possibility of returnType.split('|')) {
                  const instantiated = self._maybeInstantiate(possibility)
                  if (instantiated) {
                     const [tempBase] = splitTemplate(instantiated)
                     self._invalidateDependents(':' + tempBase)
                  }
               }
               if (whatToDo === lastWhatToDo) {
                  throw new Error(
                     `Infinite recursion in resolving $name called on`
                        + args.map(x => x.toString()).join(','))
               }
               lastWhatToDo = whatToDo
               const retval = whatToDo.implementation(...args)
               lastWhatToDo = null
               return retval
            }
            Object.defineProperty(
               patchFunc, 'name', {value: `${name}(${signature})`})
            patchFunc._pocoSignature = rawSignature
            return patchFunc
         }
         Object.defineProperty(
            patch, 'name', {value: `generate[${name}(${signature})]`})
         // TODO?: Decorate patch with a function that calculates the
         // correct return type a priori. Deferring because unclear what
         // aspects will be merged into typed-function.
         this._addTFimplementation(
            meta_imps, signature, {uses: new Set(), does: patch})
         behavior.resolved = true
      }
      this._correctPartialSelfRefs(name, tf_imps)
      // Make sure we have all of the needed (template) types; and if they
      // can't be added (because they have been instantiated too deep),
      // ditch the signature:
      const badSigs = new Set()
      for (const sig in tf_imps) {
         for (const type of typeListOfSignature(sig)) {
            if (this._maybeInstantiate(type) === undefined) {
               badSigs.add(sig)
            }
         }
      }
      for (const badSig of badSigs) {
         const imp = tf_imps[badSig]
         delete tf_imps[badSig]
         const fromBehavior = this._imps[name][imp._pocoSignature]
         if (fromBehavior.explicit) {
            fromBehavior.resolved = false
         } else {
            delete fromBehavior.hasInstantiations[imp._pocoInstance]
         }
      }
      let tf
      if (Object.keys(tf_imps).length > 0) {
         tf = this._typed(name, tf_imps)
         tf.fromInstance = this
      }
      let metaTF
      if (Object.keys(meta_imps).length > 0) {
         metaTF = this._metaTyped(name, meta_imps)
         metaTF.fromInstance = this
      }
      this._meta[name] = metaTF

      tf = tf || metaTF
      Object.defineProperty(this, name, {configurable: true, value: tf})
      return tf
   }

   /* Takes a type and a set of types and returns true if the type
    * is a subtype of some type in the set.
    */
   _atOrBelowSomeType(type, typeSet) {
      if (typeSet.has(type)) return true
      let belowSome = false
      for (const anUB of typeSet) {
         if (anUB in this.Templates) {
            if (type.slice(0, anUB.length) === anUB) {
               belowSome = true
               break
            }
         } else {
            if (this.isSubtypeOf(type, anUB)) {
               belowSome = true
               break
            }
         }
      }
      return belowSome
   }

   /* Takes an arbitrary type and performs an instantiation if necessary.
    * @param {string} type  The type to instantiate
    * @param {string | bool | undefined }
    *     Returns the name of the type if an instantiation occurred, false
    *     if the type was already present, and undefined if the type can't
    *     be satisfied (because it is not the name of a type or it is nested
    *     too deep.
    */
   _maybeInstantiate(type) {
      if (type.slice(0,3) === '...') {
         type = type.slice(3)
      }
      if (!(type.includes('<'))) {
         // Not a template, so just check if type exists
         if (type in this.Types) return false // already there
         return undefined // no such type
      }
      // it's a template type, turn it into a template and an arg
      let [base, arg] = splitTemplate(type)
      return this.instantiateTemplate(base, arg)
   }

   /* Generate and include a template instantiation for operation name
    * for the template signature templateSignature instantiated for
    * instanceType, returning the resulting implementation.
    */
   _instantiateTemplateImplementation(name, templateSignature, instanceType) {
      if (!(instanceType in this.Types)) return undefined
      if (this.Types[instanceType] === anySpec) return undefined
      const imps = this._imps[name]
      const behavior = imps[templateSignature]
      if (instanceType in behavior.hasInstantiations) return undefined
      const signature = substituteInSignature(
         templateSignature, theTemplateParam, instanceType)
      /* Don't override an explicit implementation: */
      if (signature in imps) return undefined
      /* Don't go too deep */
      let maxdepth = 0
      for (const argType in typeListOfSignature(signature)) {
         const depth = argType.split('<').length
         if (depth > maxdepth) maxdepth = depth
      }
      if (maxdepth > this._maxDepthSeen + 1) return undefined
      /* All right, go ahead and instantiate */
      const uses = new Set()
      for (const dep of behavior.uses) {
         if (this._templateParam(dep)) continue
         uses.add(substituteInSignature(dep, theTemplateParam, instanceType))
      }
      const patch = (refs) => {
         const innerRefs = {}
         for (const dep of behavior.uses) {
            if (this._templateParam(dep)) {
               innerRefs[dep] = instanceType
            } else {
               const outerName = substituteInSignature(
                  dep, theTemplateParam, instanceType)
               innerRefs[dep] = refs[outerName]
            }
         }
         return behavior.does(innerRefs)
      }
      const tf_imps = this._TFimps[name]
      this._addTFimplementation(tf_imps, signature, {uses, does: patch})
      tf_imps[signature]._pocoSignature = templateSignature
      tf_imps[signature]._pocoInstance = instanceType
      behavior.hasInstantiations[instanceType] = signature
      return tf_imps[signature]
   }

   /* Adapts Pocomath-style behavior specification (uses, does) for signature
    * to typed-function implementations and inserts the result into plain
    * object imps
    */
   _addTFimplementation(imps, signature, behavior) {
      const {uses, does} = behavior
      if (uses.length === 0) {
         const implementation = does()
         // could do something with return type information here
         imps[signature] = implementation
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
            const trysig = substituteInSignature(needsig, theTemplateParam, '')
            if (trysig !== needsig) {
               throw new Error(
                  'Attempt to add a template implementation: ' +
                     `${signature} with dependency ${dep}`)
            }
         }
         if (func === 'self') {
            if (needsig) {
               /* Maybe we can resolve the self reference without troubling
                * typed-function:
                */
               if (needsig in imps && typeof imps[needsig] == 'function') {
                  refs[dep] = imps[needsig]
               } else {
                  if (full_self_referential) {
                     throw new SyntaxError(
                        'typed-function does not support mixed full and '
                           + 'partial self-reference')
                  }
                  const needTypes = typesOfSignature(needsig)
                  const mergedTypes = Object.assign(
                     {}, this.Types, this.Templates)
                  if (subsetOfKeys(needTypes, mergedTypes)) {
                     part_self_references.push(needsig)
                  }
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
               /* We are in the midst of bundling func */
               let fallback =  true
               /* So the first thing we can do is try the tf_imps we are
                * accumulating:
                */
               if (needsig) {
                  let typedUniverse
                  let tempTF
                  if (Object.keys(this._TFimps[func]).length > 0) {
                     typedUniverse = this._typed
                     tempTF = typedUniverse('dummy_' + func, this._TFimps[func])
                  } else {
                     typedUniverse = this._metaTyped
                     tempTF = typedUniverse(
                        'dummy_' + func, this._metaTFimps[func])
                  }
                  let result = undefined
                  try {
                     result = typedUniverse.find(tempTF, needsig, {exact: true})
                  } catch {}
                  if (result) {
                     refs[dep] = result
                     fallback = false
                  }
               }
               if (fallback) {
                  /* Either we need the whole function or the signature
                   * we need is not available yet, so we have to use
                   * an indirect reference to func. And given that, there's
                   * really no helpful way to extract a specific signature
                   */
                  const self = this
                  const redirect = function () { // is this the most efficient?
                     return self[func].apply(this, arguments)
                  }
                  Object.defineProperty(redirect, 'name', {value: func})
                  Object.defineProperty(redirect, 'fromInstance', {value: this})
                  refs[dep] = redirect
               }
            } else {
               // can bundle up func, and grab its signature if need be
               let destination = this[func]
               if (destination && needsig) {
                  destination = this.resolve(func, needsig)
               }
               refs[dep] = destination
            }
         }
      }
      if (full_self_referential) {
         imps[signature] = this._typed.referToSelf(self => {
            refs.self = self
            const implementation = does(refs)
            Object.defineProperty(implementation, 'name', {value: does.name})
            implementation.fromInstance = this
            // What are we going to do with the return type info in here?
            return implementation
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
            fromInstance: this,
            psr: part_self_references
         }
         return
      }
      const implementation = does(refs)
      implementation.fromInstance = this
      // could do something with return type information here?
      imps[signature] = implementation
   }

   _correctPartialSelfRefs(name, imps) {
      for (const aSignature in imps) {
         if (!(imps[aSignature].deferred)) continue
         const deferral = imps[aSignature]
         const part_self_references = deferral.psr
         const corrected_self_references = []
         const remaining_self_references = []
         const refs = deferral.builtRefs
         for (const neededSig of part_self_references) {
            // Have to find a match for neededSig among the other signatures
            // of this function. That's a job for typed-function, but we will
            // try here:
            if (neededSig in imps) { // the easy case
               corrected_self_references.push(neededSig)
               remaining_self_references.push(neededSig)
               continue
            }
            // No exact match, try to get one that matches with
            // subtypes since the whole conversion thing in typed-function
            // is too complicated to reproduce
            let foundSig = this._findSubtypeImpl(name, imps, neededSig)
            if (foundSig) {
               corrected_self_references.push(foundSig)
               remaining_self_references.push(neededSig)
            } else {
               // Maybe it's a template instance we don't yet have
               foundSig = this._findSubtypeImpl(
                  name, this._imps[name], neededSig)
               if (foundSig) {
                  const match = this._pocoFindSignature(name, neededSig)
                  const neededTemplate = match.fn._pocoSignature
                  const neededInstance = whichSigInstance(
                     neededSig, neededTemplate)
                  const neededImplementation =
                     this._instantiateTemplateImplementation(
                        name, neededTemplate, neededInstance)
                  if (!neededImplementation) {
                     refs[`self(${neededSig})`] = match.implementation
                  } else {
                     if (typeof neededImplementation === 'function') {
                        refs[`self(${neededSig})`] = neededImplementation
                     } else {
                        corrected_self_references.push(neededSig)
                        remaining_self_references.push(neededSig)
                     }
                  }
               } else {
                  throw new Error(
                     'Implement inexact self-reference in typed-function for '
                        + `${name}(${neededSig})`)
               }
            }
         }
         const does = deferral.sigDoes
         if (remaining_self_references.length > 0) {
            imps[aSignature] = this._typed.referTo(
               ...corrected_self_references, (...impls) => {
                  for (let i = 0; i < remaining_self_references.length; ++i) {
                     refs[`self(${remaining_self_references[i]})`] = impls[i]
                  }
                  const implementation = does(refs)
                  // What will we do with the return type info in here?
                  return implementation
               }
            )
         } else {
            imps[aSignature] = does(refs)
         }
         imps[aSignature]._pocoSignature = deferral._pocoSignature
         imps[aSignature]._pocoInstance = deferral._pocoInstance
         imps[aSignature].fromInstance = deferral.fromInstance
      }
   }

   /* This function analyzes the template and makes sure the
    * instantiations of it for type and all prior types of type are present
    * in the instance.
    */
   _ensureTemplateTypes(template, type) {
      const [base, arg] = splitTemplate(template)
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

   /* Maybe add the instantiation of template type base with argument type
    * instantiator to the Types of this instance, if it hasn't happened
    * already.
    * Returns the name of the type if added, false if it was already there,
    * and undefined if the type is declined (because of being nested too deep).
    */
   instantiateTemplate = Returns('void', function(base, instantiator) {
      const depth = instantiator.split('<').length
      if (depth > this._maxDepthSeen ) {
         // don't bother with types much deeper thant we have seen
         return undefined
      }
      const wantsType = `${base}<${instantiator}>`
      if (wantsType in this.Types) return false
      // OK, need to generate the type from the template
      // Set up refines, before, test, and from
      const newTypeSpec = {}
      const maybeFrom = {}
      const template = this.Templates[base].spec
      if (!template) {
         throw new Error(
            `Implementor error in instantiateTemplate(${base}, ${instantiator})`)
      }
      const instantiatorSpec = this.Types[instantiator]
      if (instantiatorSpec.refines) {
         this.instantiateTemplate(base, instantiatorSpec.refines)
         // Assuming our templates are covariant, I guess
         newTypeSpec.refines = `${base}<${instantiatorSpec.refines}>`
      }
      let beforeTypes = []
      if (instantiatorSpec.before) {
         beforeTypes = instantiatorSpec.before.map(type => `${base}<${type}>`)
      }
      if (template.before) {
         for (const beforeTmpl of template.before) {
            beforeTypes.push(
               substituteInSignature(beforeTmpl, theTemplateParam, instantiator))
         }
      }
      if (beforeTypes.length > 0) {
         newTypeSpec.before = beforeTypes
      }
      const templateTest = template.test(this._typeTests[instantiator])
      newTypeSpec.test = x => (template.base(x) && templateTest(x))
      if (template.from) {
         for (let source in template.from) {
            const instSource = substituteInSignature(
               source, theTemplateParam, instantiator)
            const testSource = substituteInSignature(
               instSource, templateFromParam, instantiator)
            const usesFromParam = (testSource !== instSource)
            if (usesFromParam) {
               for (const iFrom in instantiatorSpec.from) {
                  const finalSource = substituteInSignature(
                     instSource, templateFromParam, iFrom)
                  maybeFrom[finalSource] = template.from[source](
                     instantiatorSpec.from[iFrom])
               }
               if (testSource !== wantsType) { // subtypes handled with refines
                  // Assuming all templates are covariant here, I guess...
                  for (const subType of this._subtypes[instantiator]) {
                     const finalSource = substituteInSignature(
                        instSource, templateFromParam, subType)
                     maybeFrom[finalSource] = template.from[source](x => x)
                  }
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
      this._instantiationsOf[base].add(wantsType)
      return wantsType
   })

   _findSubtypeImpl(name, imps, neededSig) {
      if (neededSig in imps) return neededSig
      let foundSig = false
      const typeList = typeListOfSignature(neededSig)
      for (const otherSig in imps) {
         const otherTypeList = typeListOfSignature(otherSig)
         if (typeList.length !== otherTypeList.length) continue
         let allMatch = true
         let paramBound = 'any'
         for (let k = 0; k < typeList.length; ++k) {
            let myType = typeList[k]
            let otherType = otherTypeList[k]
            if (otherType === theTemplateParam) {
               otherTypeList[k] = paramBound
               otherType = paramBound
            }
            if (otherType === restTemplateParam) {
               otherTypeList[k] = `...${paramBound}`
               otherType = paramBound
            }
            const adjustedOtherType = otherType.replaceAll(templateCall, '')
            if (adjustedOtherType !== otherType) {
               otherTypeList[k] = adjustedOtherType
               otherType = adjustedOtherType
            }
            if (myType.slice(0,3) === '...') myType = myType.slice(3)
            if (otherType.slice(0,3) === '...') otherType = otherType.slice(3)
            const otherBound = upperBounds.exec(otherType)
            if (otherBound) {
               paramBound = otherBound[2]
               otherType = paramBound
               otherTypeList[k] = otherBound[1].replaceAll(
                  theTemplateParam, paramBound)
            }
            if (otherType === 'any') continue
            if (myType === otherType) continue
            if (otherType in this.Templates) {
               const [myBase] = splitTemplate(myType)
               if (myBase === otherType) continue
               if (this.instantiateTemplate(otherType, myType)) {
                  let dummy
                  dummy = this[name] // for side effects
                  return this._findSubtypeImpl(name, this._imps[name], neededSig)
               }
            }
            if (!(otherType in this.Types)) {
               allMatch = false
               break
            }
            if (this.isSubtypeOf(myType, otherType)) continue
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

   _pocoFindSignature(name, sig, typedFunction) {
      if (!this._typed.isTypedFunction(typedFunction)) {
         typedFunction = this[name]
      }
      const haveTF = this._typed.isTypedFunction(typedFunction)
      if (haveTF) {
         // First try a direct match
         let result
         try {
            result = this._typed.findSignature(typedFunction, sig, {exact: true})
         } catch {
         }
         if (result) return result
         // Next, look ourselves but with subtypes:
         const wantTypes = typeListOfSignature(sig)
         for (const [implSig, details]
              of typedFunction._typedFunctionData.signatureMap) {
            let allMatched = true
            const implTypes = typeListOfSignature(implSig)
            for (let i = 0; i < wantTypes.length; ++i) {
               const implIndex = Math.min(i, implTypes.length - 1)
               let implType = implTypes[implIndex]
               if (implIndex < i) {
                  if (implType.slice(0,3) !== '...') {
                     // ran out of arguments in impl
                     allMatched = false
                     break
                  }
               }
               if (implType.slice(0,3) === '...') {
                  implType = implType.slice(3)
               }
               const hasMatch = implType.split('|').some(
                  t => (wantTypes[i] === t || this.isSubtypeOf(wantTypes[i], t)))
               if (!hasMatch) {
                  allMatched = false
                  break
               }
            }
            if (allMatched) return details
         }
      }
      if (!(this._imps[name])) return undefined
      const foundsig = this._findSubtypeImpl(name, this._imps[name], sig)
      if (foundsig) {
         if (haveTF) {
            try {
               return this._typed.findSignature(typedFunction, foundsig)
            } catch {
            }
         }
         try {
            return this._metaTyped.findSignature(this._meta[name], foundsig)
         } catch {
         }
         // We have an implementation but not a typed function. Do the best
         // we can:
         const foundImpl = this._imps[name][foundsig]
         const needs = {}
         for (const dep of foundImpl.uses) {
            const [base, sig] = dep.split('()')
            needs[dep] = this.resolve(base, sig)
         }
         const pseudoImpl = foundImpl.does(needs)
         return {fn: pseudoImpl, implementation: pseudoImpl}
      }
      // Hmm, no luck. Make sure bundle is up-to-date and retry:
      let result = undefined
      typedFunction = this[name]
      try {
         result = this._typed.findSignature(typedFunction, sig)
      } catch {
      }
      return result
   }

   /* Returns a function that implements the operation with the given name
    * when called with the given signature. The optional third argument is
    * the typed function that provides the operation name, which can be
    * passed in for efficiency if it is already available.
    */
   resolve = Returns('function', function (name, sig, typedFunction) {
      if (!this._typed.isTypedFunction(typedFunction)) {
         typedFunction = this[name]
      }
      const result = this._pocoFindSignature(name, sig, typedFunction)
      if (result) return result.implementation
      // total punt, revert to typed-function resolution on every call;
      // hopefully this happens rarely:
      return typedFunction
   })

}

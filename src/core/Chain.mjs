/* An object that holds a value and a reference to a PocomathInstance for
 * applying operations to that value. Since the operations need to be wrapped,
 * that instance is supposed to provide a place where wrapped operations can
 * be stored, known as the repository.
 */
class Chain {
   constructor(value, instance, repository) {
      this.value = value
      this.instance = instance
      this.repository = repository
      if (!('_wrapped' in this.repository)) {
         this.repository._wrapped = {}
      }
   }

   /* This is the wrapper for func which calls it with the chain's
    * current value inserted as the first argument.
    */
   _chainify(func, typed) {
      return function () {
         // Here `this` is the proxied Chain instance
         if (arguments.length === 0) {
            this.value = func(this.value)
         } else {
            const args = [this.value, ...arguments]
            if (typed.isTypedFunction(func)) {
               const sigObject = typed.resolve(func, args)
               if (sigObject.params.length === 1) {
                  throw new Error(
                     `chain function ${func.name} attempting to split a rest`
                        + 'parameter between chain value and other arguments')
               }
               this.value = sigObject.implementation.apply(func, args)
            } else {
               this.value = func.apply(func, args)
            }
         }
         return this
      }
   }
}

export function makeChain(value, instance, repository) {
   const chainObj = new Chain(value, instance, repository)
   /* Rather than using the chainObj directly, we Proxy it to
    * ensure we only get back wrapped, current methods of the instance.
    */
   return new Proxy(chainObj, {
      get: (target, property) => {
         if (property === 'value') return target.value
         if (!(property in target.instance)) {
            throw new SyntaxError(`Unknown operation ${property}`)
         }
         if (property.charAt(0) === '_') {
            throw new SyntaxError(`No access to private ${property}`)
         }
         const curval = target.instance[property]
         if (typeof curval !== 'function') {
            throw new SyntaxError(
               `Property ${property} does not designate an operation`)
         }
         if (curval != target.repository._wrapped[property]) {
            target.repository._wrapped[property] = curval
            target.repository[property] = target._chainify(
               curval, target.instance._typed)
         }
         return target.repository[property]
      }
   })
}

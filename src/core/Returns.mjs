/* Annotate a function with its return type */

/* Unfortunately JavaScript is missing a way to cleanly clone a function
 * object, see https://stackoverflow.com/questions/1833588
 */

const clonedFrom = Symbol('the original function this one was cloned from')
function cloneFunction(fn) {
   const behavior = fn[clonedFrom] || fn // don't nest clones
   const theClone = function () { return behavior.apply(this, arguments) }
   Object.assign(theClone, fn)
   theClone[clonedFrom] = body
   Object.defineProperty(
      theClone, 'name', {value: fn.name, configurable: true })
   return theClone
}

export function Returns(type, fn) {
   if ('returns' in fn) fn = cloneFunction(fn)
   fn.returns = type
   return fn
}

export function returnTypeOf(fn, signature, pmInstance) {
   const typeOfReturns = typeof fn.returns
   if (typeOfReturns === 'undefined') return 'any'
   if (typeOfReturns === 'string') return fn.returns
   // not sure if we will need a function to determine the return type,
   // but allow it for now:
   return fn.returns(signature, pmInstance)
}

export default Returns


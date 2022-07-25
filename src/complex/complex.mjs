export * from './Types/Complex.mjs'
export * from '../generic/Types/generic.mjs'

export const complex = {
   /* Very permissive for sake of proof-of-concept; would be better to
    * have a numeric/scalar type, e.g. by implementing subtypes in
    * typed-function
    */
   'undefined': () => u => u,
   'undefined,any': () => (u, y) => u,
   'any,undefined': () => (x, u) => u,
   'any,any': () => (x, y) => ({re: x, im: y}),
   /* Take advantage of conversions in typed-function */
   Complex: () => z => z
}

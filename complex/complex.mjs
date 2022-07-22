import './types/Complex.mjs'

export const complex = {
   /* Very permissive for sake of proof-of-concept; would be better to
    * have a numeric/scalar type, e.g. by implementing subtypes in
    * typed-function
    */
   'any, any': [[], (x, y) => ({re: x, im: y})],
   /* Take advantage of conversions in typed-function */
   Complex: [[], z => z]
}

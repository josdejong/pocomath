import {Returns, returnTypeOf} from '../core/Returns.mjs'
export * from './Types/Complex.mjs'

/* arg is the "argument" or angle theta of z in its form r cis theta */
export const arg = {
   'Complex<number>': () => Returns('number', z => Math.atan2(z.im, z.re))
}

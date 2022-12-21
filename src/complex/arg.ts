import { Complex } from './interfaces'

export type ArgComplexNumber = (z: Complex<number>) => number

/* arg is the "argument" or angle theta of z in its form r cis theta */
export const arg = {
   'infer': (): ArgComplexNumber => z => Math.atan2(z.im, z.re)
}

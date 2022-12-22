import { Complex } from './interfaces'

// we should move Arg and ArgComplex into /interfaces/ 
export type Arg<T, U> = (z: T) => U
export type ArgComplex<U> = Arg<Complex<U>, U>

// now, we can write out ArgComplexNumber and ArgComplexBigint. 
// this is probably redundant though
export type ArgComplexNumber = ArgComplex<number>
export type ArgComplexBigInt = ArgComplex<bigint>

/* arg is the "argument" or angle theta of z in its form r cis theta */
export const arg = {
   'infer': (): ArgComplexNumber => z => Math.atan2(z.im, z.re)
}

// Experiment: drop the {infer} wrapper object and write without optional dependencies:
export const arg_2: ArgComplexNumber = z => Math.atan2(z.im, z.re)

import { Abs } from '../interfaces/arithmetic.js'
export * from './Types/number.mjs'

// Is the following interface really adding value?
export type AbsNumber = Abs<number>

export const abs = {
  'infer': (): AbsNumber => Math.abs
}

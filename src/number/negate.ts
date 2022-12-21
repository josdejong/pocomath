import { Negate } from '../interfaces/arithmetic.js'

export type NegateNumber = Negate<number>

export const negate = {
   infer: (): NegateNumber => n => -n
}

import { Add } from '../interfaces/arithmetic.js'

export type AddBigInt = Add<bigint>

export const add = {
  infer: (): AddBigInt => (a, b) => a + b
}

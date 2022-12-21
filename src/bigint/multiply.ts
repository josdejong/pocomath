import { Multiply } from '../interfaces/arithmetic.js'
export * from './Types/bigint.mjs'

export type MultiplyBigInt = Multiply<bigint>

export const multiply = {
  infer: (): MultiplyBigInt => (a, b) => a * b
}

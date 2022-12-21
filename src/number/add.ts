import { Add } from '../interfaces/arithmetic.js'
export * from './Types/number.mjs'

export type AddNumber = Add<number>

export const add = {
    infer: (): AddNumber => (a, b) => a + b
}

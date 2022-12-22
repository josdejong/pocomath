import { Add } from '../interfaces/arithmetic.js'
export * from './Types/number.mjs'

export type AddNumber = Add<number>

export const add = {
    infer: (): AddNumber => (a, b) => a + b
}

// Experiment: drop the {infer} wrapper object and write without optional dependencies:
export const add_2: AddNumber = (a, b) => a + b

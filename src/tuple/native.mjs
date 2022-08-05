import {Tuple} from './Types/Tuple.mjs'

export const add = Tuple.promoteBinaryUnary
export const complex = Tuple.promoteBinaryStrict
export const conjugate = Tuple.promoteUnary
export const divide = Tuple.promoteBinaryStrict
export {equalTT} from './equalTT.mjs'
export const invert = Tuple.promoteUnary
export {isZero} from './isZero.mjs'
export {length} from './length.mjs'
export const multiply = Tuple.promoteBinaryUnary
export const negate = Tuple.promoteUnary
export const one = Tuple.promoteUnary
export const quotient = Tuple.promoteBinaryStrict
export const roundquotient = Tuple.promoteBinaryStrict
export const sqrt = Tuple.promoteUnary
export const subtract = Tuple.promoteBinaryStrict
export {tuple} from './tuple.mjs'
export const zero = Tuple.promoteUnary

export {Tuple}

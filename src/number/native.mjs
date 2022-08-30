import gcdType from '../generic/gcdType.mjs'
import {identitySubTypes} from '../generic/identity.mjs'

export * from './Types/number.mjs'

export {abs} from './abs.mjs'
export {absquare} from './absquare.mjs'
export {add} from './add.mjs'
export {compare} from './compare.mjs'
export const conjugate = {'T:number': identitySubTypes('number')}
export const gcd = gcdType('NumInt')
export {invert} from './invert.mjs'
export {isZero} from './isZero.mjs'
export {multiply} from './multiply.mjs'
export {negate} from './negate.mjs'
export {one} from './one.mjs'
export {quotient} from './quotient.mjs'
export {roundquotient} from './roundquotient.mjs'
export {sqrt} from './sqrt.mjs'
export {zero} from './zero.mjs'

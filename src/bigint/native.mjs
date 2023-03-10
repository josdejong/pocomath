import gcdType from '../generic/gcdType.mjs'
import {identityType} from '../generic/identity.mjs'

export * from './Types/bigint.mjs'

export {absquare} from './absquare.mjs'
export {add} from './add.mjs'
export {compare} from './compare.mjs'
export const conjugate = {bigint: identityType('bigint')}
export {divide} from './divide.mjs'
export const gcd = gcdType('bigint')
export {isZero} from './isZero.mjs'
export {multiply} from './multiply.mjs'
export {negate} from './negate.mjs'
export {one} from './one.mjs'
export {sign} from './sign.mjs'
export {quotient} from './quotient.mjs'
export {roundquotient} from './roundquotient.mjs'
export {sqrt} from './sqrt.mjs'
export {zero} from './zero.mjs'

import PocomathInstance from '../core/PocomathInstance.mjs'
import * as bigints from './native.mjs'
import * as generic from '../generic/arithmetic.mjs'

export default PocomathInstance.merge('bigint', bigints, generic)

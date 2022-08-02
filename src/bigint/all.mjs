import PocomathInstance from '../core/PocomathInstance.mjs'
import * as bigints from './native.mjs'
import * as generic from '../generic/all.mjs'
import * as ops from '../ops/all.mjs'

export default PocomathInstance.merge('bigint', bigints, generic, ops)

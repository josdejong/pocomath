import PocomathInstance from '../core/PocomathInstance.mjs'
import * as bigints from './native.mjs'
import * as generic from '../generic/all.mjs'
import * as floor from '../ops/floor.mjs'

export default PocomathInstance.merge('bigint', bigints, generic, floor)

import PocomathInstance from '../core/PocomathInstance.mjs'
import * as complexes from './native.mjs'
import * as generic from '../generic/arithmetic.mjs'
import * as floor from '../ops/floor.mjs'

export default PocomathInstance.merge('complex', complexes, generic, floor)

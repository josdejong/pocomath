import PocomathInstance from '../core/PocomathInstance.mjs'
import * as numbers from './native.mjs'
import * as generic from '../generic/all.mjs'
import * as floor from '../ops/floor.mjs'

export default PocomathInstance.merge('number', numbers, generic, floor)


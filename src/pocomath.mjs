/* Core of pocomath: generates the default instance */
import PocomathInstance from './core/PocomathInstance.mjs'
import * as numbers from './number/native.mjs'
import * as bigints from './bigint/native.mjs'
import * as complex from './complex/native.mjs'
import * as generic from './generic/all.mjs'
import * as floor from './ops/floor.mjs'

const math = PocomathInstance.merge(
    'math', numbers, bigints, complex, generic, floor)

export default math

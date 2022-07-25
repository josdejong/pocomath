/* Core of pocomath: generates the default instance */
import PocomathInstance from './core/PocomathInstance.mjs'
import * as numbers from './number/native.mjs'
import * as bigints from './bigint/native.mjs'
import * as complex from './complex/native.mjs'
import * as generic from './generic/all.mjs'

const math = new PocomathInstance('math')
math.install(numbers)
math.install(bigints)
math.install(complex)
math.install(generic)

export default math

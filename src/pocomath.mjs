/* Core of pocomath: generates the default instance */
import PocomathInstance from './core/PocomathInstance.mjs'
import * as numbers from './number/all.mjs'
import * as bigints from './bigint/all.mjs'
import * as complex from './complex/all.mjs'

const math = new PocomathInstance('math')
math.install(numbers)
math.install(bigints)
math.install(complex)

export default math

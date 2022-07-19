/* Core of pocomath: generates the default instance */
import PocomathInstance from './PocomathInstance.mjs'
import * as numbers from './number/all.mjs'
import * as complex from './complex/all.mjs'

const math = new PocomathInstance('math')
math.install(numbers)
math.install(complex)

export default math

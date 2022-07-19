/* Core of pocomath: generates the default instance */
import PocomathInstance from './PocomathInstance.mjs'
import * as numberAdd from './number/add.mjs'

const math = new PocomathInstance('math')
math.install(numberAdd)

export default math

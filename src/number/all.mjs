import PocomathInstance from '../core/PocomathInstance.mjs'
import * as numbers from './native.mjs'
import * as generic from '../generic/arithmetic.mjs'

export default PocomathInstance.merge('number', numbers, generic)


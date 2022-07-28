import PocomathInstance from '../../core/PocomathInstance.mjs'
const Undefined = new PocomathInstance('Undefined')
Undefined.installType('undefined', {test: u => u === undefined})
export {Undefined}


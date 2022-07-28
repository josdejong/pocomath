import PocomathInstance from '../../core/PocomathInstance.mjs'
const BigInt = new PocomathInstance('BigInt')
BigInt.installType('bigint', {
    before: ['Complex'],
    test: b => typeof b === 'bigint'
})
export {BigInt}

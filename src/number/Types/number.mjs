import PocomathInstance from '../../core/PocomathInstance.mjs'
const Number = new PocomathInstance('Number')
Number.installType('number', {
    before: ['Complex'],
    test: n => typeof n === 'number',
    from: {string: s => +s}
})
export {Number}
